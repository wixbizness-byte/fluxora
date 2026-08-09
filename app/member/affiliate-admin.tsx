"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "./affiliate-admin.module.css";

type Affiliate = {
  id: number;
  gmail: string;
  display_name: string | null;
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
  const [busy, setBusy] = useState<number | "new" | null>(null);
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
    setBusy("new");
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
      }),
    });
    const body = (await response.json().catch(() => ({}))) as ApiResponse;
    if (!response.ok) setError(body.error || "Could not approve affiliate.");
    else {
      setNotice(body.message || "Affiliate approved.");
      form.reset();
      await load();
    }
    setBusy(null);
  }

  async function toggle(affiliate: Affiliate) {
    setBusy(affiliate.id);
    setNotice("");
    setError("");
    const response = await fetch("/prompts/api/affiliates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: affiliate.id, is_active: !affiliate.is_active }),
    });
    const body = (await response.json().catch(() => ({}))) as ApiResponse;
    if (!response.ok) setError(body.error || "Could not update affiliate.");
    else {
      setNotice(body.message || "Affiliate updated.");
      await load();
    }
    setBusy(null);
  }

  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <div><p>Referral access</p><h2>Affiliates</h2><span>Approve Google accounts that may issue temporary referral codes.</span></div>
        <strong>{affiliates.length}</strong>
      </div>

      {(notice || error) && <div className={error ? styles.error : styles.notice}>{error || notice}</div>}

      <form className={styles.form} onSubmit={addAffiliate}>
        <label><span>Affiliate Gmail</span><input name="gmail" type="email" required placeholder="affiliate@gmail.com" /></label>
        <label><span>Display name</span><input name="display_name" placeholder="Optional" /></label>
        <button type="submit" disabled={busy === "new"}>{busy === "new" ? "Adding…" : "Approve affiliate"}</button>
      </form>

      {loading ? <div className={styles.empty}>Loading affiliates…</div> : (
        <div className={styles.list}>
          {affiliates.map((affiliate) => (
            <article className={styles.row} key={affiliate.id}>
              <div><strong>{affiliate.display_name || affiliate.gmail}</strong><span>{affiliate.gmail}</span></div>
              <div className={styles.meta}><span>{affiliate.issued_count} issued</span><b className={affiliate.is_active ? styles.active : styles.inactive}>{affiliate.is_active ? "Active" : "Inactive"}</b></div>
              <button type="button" onClick={() => toggle(affiliate)} disabled={busy === affiliate.id}>{busy === affiliate.id ? "Saving…" : affiliate.is_active ? "Deactivate" : "Activate"}</button>
            </article>
          ))}
          {!affiliates.length && !error && <div className={styles.empty}>No affiliates approved yet.</div>}
        </div>
      )}
    </section>
  );
}
