"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./trial-admin.module.css";

type Trial = {
  gmail: string;
  member_id: string;
  claimed_at: string;
  expires_at: string;
  active: boolean;
  member_status: string;
  tier: string | null;
  access_code: string | null;
  resettable: boolean;
};

type TrialResponse = {
  adminEmail?: string;
  summary?: { total: number; active: number; expired: number };
  trials?: Trial[];
  message?: string;
  error?: string;
};

function formatPht(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date) + " PHT";
}

export default function TrialAdmin() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, expired: 0 });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const response = await fetch("/prompts/api/trials", { cache: "no-store", credentials: "include" });
    const body = (await response.json().catch(() => ({}))) as TrialResponse;
    if (response.status === 401 || response.status === 403) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }
    if (!response.ok) {
      setError(body.error || "Could not load Google trial claims.");
      setLoading(false);
      return;
    }
    setUnauthorized(false);
    setTrials(body.trials || []);
    setSummary(body.summary || { total: 0, active: 0, expired: 0 });
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    load().catch((cause) => {
      setError(cause instanceof Error ? cause.message : "Could not load Google trial claims.");
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return trials;
    return trials.filter((trial) => [trial.gmail, trial.member_status, trial.tier || "", trial.access_code || ""].some((value) => value.toLowerCase().includes(needle)));
  }, [query, trials]);

  async function resetTrial(trial: Trial) {
    const confirmed = window.confirm(
      `Reset the free trial for ${trial.gmail}?\n\nThis removes their current trial member record and lets this Google account claim a fresh 80-minute trial.`
    );
    if (!confirmed) return;

    setBusy(trial.gmail);
    setNotice("");
    setError("");
    const response = await fetch("/prompts/api/trials", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gmail: trial.gmail }),
    });
    const body = (await response.json().catch(() => ({}))) as TrialResponse;
    if (!response.ok) setError(body.error || "Could not reset trial.");
    else {
      setNotice(body.message || "Trial reset.");
      await load();
    }
    setBusy("");
  }

  if (unauthorized) return null;

  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <div>
          <p>Free access analytics</p>
          <h2>Google Trial Claims</h2>
          <span>Every Google account that claims the one-time 80-minute trial is recorded here.</span>
        </div>
        <strong>{summary.total}</strong>
      </div>

      {(notice || error) && <div className={error ? styles.error : styles.notice}>{error || notice}</div>}

      <div className={styles.summaryGrid}>
        <article><span>Total claims</span><strong>{summary.total}</strong></article>
        <article><span>Active now</span><strong>{summary.active}</strong></article>
        <article><span>Expired</span><strong>{summary.expired}</strong></article>
      </div>

      <div className={styles.searchRow}>
        <label>
          <span>Search trials</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search Gmail, status, tier, or code..." />
        </label>
        {query && <button type="button" onClick={() => setQuery("")}>Clear</button>}
      </div>

      {loading ? <div className={styles.empty}>Loading free trials…</div> : (
        <div className={styles.list}>
          {filtered.map((trial) => (
            <article className={styles.row} key={trial.gmail}>
              <div className={styles.identity}>
                <strong>{trial.gmail}</strong>
                <span>Claimed {formatPht(trial.claimed_at)}</span>
              </div>

              <div className={styles.timeBlock}>
                <span>Expires</span>
                <strong>{formatPht(trial.expires_at)}</strong>
              </div>

              <div className={styles.meta}>
                <b className={trial.active ? styles.active : styles.expired}>{trial.active ? "Active" : "Expired"}</b>
                <span>{trial.tier || "Trial"}</span>
                {trial.access_code && <code>{trial.access_code}</code>}
              </div>

              <button
                className={styles.resetButton}
                type="button"
                disabled={!trial.resettable || busy === trial.gmail}
                onClick={() => resetTrial(trial)}
                title={trial.resettable ? "Allow this Google account to claim another free trial" : "This claim is linked to a non-trial member and cannot be reset here"}
              >
                {busy === trial.gmail ? "Resetting…" : trial.resettable ? "Reset trial" : "Protected"}
              </button>
            </article>
          ))}
          {!filtered.length && !error && <div className={styles.empty}>{query ? "No trial claims match your search." : "No Google trials claimed yet."}</div>}
        </div>
      )}
    </section>
  );
}
