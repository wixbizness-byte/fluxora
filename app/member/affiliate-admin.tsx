"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "./affiliate-admin.module.css";

type AffiliateAccessScope = "premium_only" | "premium_creator";

type Affiliate = {
  id: number;
  gmail: string;
  display_name: string | null;
  access_scope: AffiliateAccessScope;
  is_active: boolean;
  issued_count: number;
};

type ApiResponse = {
  affiliates?: Affiliate[];
  affiliate?: Affiliate;
  message?: string;
  error?: string;
};

export default function AffiliateAdmin() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const response = await fetch("/prompts/api/affiliates", { cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as ApiResponse;
    if (!response.ok) {
      setError(body.error || "Could not load affiliates.");
      setLoading(false);
      return;
    }
    setAffiliates(body.affiliates || []);
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    load().catch((cause) => {
      setError(cause instanceof Error ? cause.message : "Could not load affiliates.");
      setLoading(false);
    });
  }, []);

  async function addAffiliate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdding(true);
    setNotice("");
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/prompts/api/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gmail: String(data.get("gmail") || "").trim(),
        display_name: String(data.get("display_name") || "").trim(),
        access_scope: String(data.get("access_scope") || "premium_only"),
      }),
    });
    const body = (await response.json().catch(() => ({}))) as ApiResponse;
    if (!response.ok) setError(body.error || "Could not approve affiliate.");
    else {
      setNotice(body.message || "Affiliate approved.");
      form.reset();
      await load();
    }
    setAdding(false);
  }

  async function patchAffiliate(id: number, changes: Record<string, unknown>) {
    setBusyId(id);
    setNotice("");
    setError("");
    const response = await fetch("/prompts/api/affiliates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...changes }),
    });
    const body = (await response.json().catch(() => ({}))) as ApiResponse;
    if (!response.ok) setError(body.error || "Could not update affiliate.");
    else {
      setNotice(body.message || "Affiliate updated.");
      await load();
    }
    setBusyId(null);
  }

  async function toggle(affiliate: Affiliate) {
    await patchAffiliate(affiliate.id, { is_active: !affiliate.is_active });
  }

  async function changeScope(affiliate: Affiliate, accessScope: AffiliateAccessScope) {
    if (accessScope === affiliate.access_scope) return;
    await patchAffiliate(affiliate.id, { access_scope: accessScope });
  }

  async function deleteAffiliate(affiliate: Affiliate) {
    const confirmed = window.confirm(
      `Delete ${affiliate.gmail} as an affiliate?\n\nTheir existing issued member accounts and referral history will be kept.`
    );
    if (!confirmed) return;

    setDeletingId(affiliate.id);
    setNotice("");
    setError("");
    const response = await fetch("/prompts/api/affiliates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: affiliate.id }),
    });
    const body = (await response.json().catch(() => ({}))) as ApiResponse;
    if (!response.ok) setError(body.error || "Could not delete affiliate.");
    else {
      setNotice(body.message || "Affiliate deleted.");
      await load();
    }
    setDeletingId(null);
  }

  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <div>
          <p>Referral access</p>
          <h2>Affiliates</h2>
          <span>Approve Google accounts and control whether they can issue Premium only or Premium + Creator access.</span>
        </div>
        <strong>{affiliates.length}</strong>
      </div>

      {(notice || error) && <div className={error ? styles.error : styles.notice}>{error || notice}</div>}

      <form className={styles.form} onSubmit={addAffiliate}>
        <label><span>Affiliate Gmail</span><input name="gmail" type="email" required placeholder="affiliate@gmail.com" /></label>
        <label><span>Display name</span><input name="display_name" placeholder="Optional" /></label>
        <label>
          <span>Affiliate tier</span>
          <select name="access_scope" defaultValue="premium_only">
            <option value="premium_only">Premium only</option>
            <option value="premium_creator">Premium + Creator</option>
          </select>
        </label>
        <button type="submit" disabled={adding}>{adding ? "Adding…" : "Approve affiliate"}</button>
      </form>

      {loading ? <div className={styles.empty}>Loading affiliates…</div> : (
        <div className={styles.list}>
          {affiliates.map((affiliate) => (
            <article className={styles.row} key={affiliate.id}>
              <div className={styles.identity}>
                <strong>{affiliate.display_name || affiliate.gmail}</strong>
                <span>{affiliate.gmail}</span>
              </div>

              <div className={styles.meta}>
                <span>{affiliate.issued_count} issued</span>
                <b className={affiliate.is_active ? styles.active : styles.inactive}>{affiliate.is_active ? "Active" : "Inactive"}</b>
              </div>

              <label className={styles.scopeControl}>
                <span>Affiliate tier</span>
                <select
                  value={affiliate.access_scope || "premium_only"}
                  onChange={(event) => changeScope(affiliate, event.target.value as AffiliateAccessScope)}
                  disabled={busyId === affiliate.id || deletingId === affiliate.id}
                >
                  <option value="premium_only">Premium only</option>
                  <option value="premium_creator">Premium + Creator</option>
                </select>
              </label>

              <div className={styles.actions}>
                <button type="button" onClick={() => toggle(affiliate)} disabled={busyId === affiliate.id || deletingId === affiliate.id}>
                  {busyId === affiliate.id ? "Saving…" : affiliate.is_active ? "Deactivate" : "Activate"}
                </button>
                <button className={styles.danger} type="button" onClick={() => deleteAffiliate(affiliate)} disabled={busyId === affiliate.id || deletingId === affiliate.id}>
                  {deletingId === affiliate.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </article>
          ))}
          {!affiliates.length && !error && <div className={styles.empty}>No affiliates approved yet.</div>}
        </div>
      )}
    </section>
  );
}
