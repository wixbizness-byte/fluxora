"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import styles from "./refer.module.css";

type AffiliateAccessScope = "premium_only" | "premium_creator";

type ReferralMember = {
  id: string;
  access_code: string;
  gmail: string;
  tier: string;
  status: string;
  expires_at: string | null;
};

type Referral = {
  id: number;
  member_id: string;
  referred_gmail: string;
  duration: "3 hours" | "1 day";
  tier: "Premium" | "Creator";
  created_at: string;
  member: ReferralMember | null;
};

type ReferralResponse = {
  affiliate?: {
    id: number;
    gmail: string;
    display_name: string | null;
    access_scope: AffiliateAccessScope;
  };
  stats?: { total: number; threeHours: number; oneDay: number };
  referrals?: Referral[];
  member?: ReferralMember;
  message?: string;
  error?: string;
};

export default function ReferClient() {
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [affiliate, setAffiliate] = useState<ReferralResponse["affiliate"]>();
  const [stats, setStats] = useState({ total: 0, threeHours: 0, oneDay: 0 });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [createdMember, setCreatedMember] = useState<ReferralMember | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const sortedReferrals = useMemo(() => referrals, [referrals]);
  const canIssueCreator = affiliate?.access_scope === "premium_creator";

  async function load() {
    setLoading(true);
    setError("");
    const response = await fetch("/prompts/api/referrals", { cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as ReferralResponse;

    if (response.status === 401) {
      setUnauthorized(true);
      setForbidden(false);
      setLoading(false);
      return;
    }
    if (response.status === 403) {
      setUnauthorized(false);
      setForbidden(true);
      setError(body.error || "This Gmail is not an approved affiliate.");
      setLoading(false);
      return;
    }
    if (!response.ok) {
      setError(body.error || "Could not load referral data.");
      setLoading(false);
      return;
    }

    setUnauthorized(false);
    setForbidden(false);
    setAffiliate(body.affiliate);
    setStats(body.stats || { total: 0, threeHours: 0, oneDay: 0 });
    setReferrals(body.referrals || []);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((cause) => {
      setError(cause instanceof Error ? cause.message : "Could not load referrals.");
      setLoading(false);
    });
  }, []);

  async function issue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    setCreatedMember(null);

    const data = new FormData(event.currentTarget);
    const payload = {
      gmail: String(data.get("gmail") || "").trim(),
      duration: String(data.get("duration") || ""),
      tier: String(data.get("tier") || ""),
    };

    const response = await fetch("/prompts/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => ({}))) as ReferralResponse;

    if (!response.ok) {
      setError(body.error || "Could not issue referral access.");
      setBusy(false);
      return;
    }

    setCreatedMember(body.member || null);
    setNotice(body.message || "Referral access created.");
    event.currentTarget.reset();
    await load();
    setBusy(false);
  }

  function toggleReveal(memberId: string) {
    setRevealed((current) => {
      const next = new Set(current);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setNotice("Access code copied.");
  }

  if (loading) {
    return <main className={styles.page}><section className={styles.centerCard}>Checking affiliate access…</section></main>;
  }

  if (unauthorized) {
    return (
      <main className={styles.page}>
        <section className={styles.centerCard}>
          <p className={styles.kicker}>Fluxora referrals</p>
          <h1>Affiliate sign in</h1>
          <p>Use the Google account that has been approved as a Fluxora affiliate.</p>
          <a className={styles.primaryButton} href="/prompts/affiliate-login">Sign in with Google</a>
          <a className={styles.textLink} href="/">Back to Fluxora</a>
        </section>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main className={styles.page}>
        <section className={styles.centerCard}>
          <p className={styles.kicker}>Restricted</p>
          <h1>Affiliate access required</h1>
          <p>{error}</p>
          <a className={styles.primaryButton} href="/prompts/affiliate-login">Change Google account</a>
          <a className={styles.textLink} href="/">Back to Fluxora</a>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Fluxora affiliate</p>
          <h1>Referral Panel</h1>
          <p>{affiliate?.display_name || affiliate?.gmail}</p>
          <p>{canIssueCreator ? "Can issue Premium + Creator" : "Can issue Premium only"}</p>
        </div>
        <div className={styles.headerActions}>
          <a href="/">Fluxora</a>
          <a href="/prompts/affiliate-login">Account</a>
        </div>
      </header>

      <section className={styles.stats}>
        <article><span>Total issued</span><strong>{stats.total}</strong></article>
        <article><span>3 Hours</span><strong>{stats.threeHours}</strong></article>
        <article><span>1 Day</span><strong>{stats.oneDay}</strong></article>
      </section>

      {(notice || error) && <div className={error ? styles.error : styles.notice}>{error || notice}</div>}

      <section className={styles.panel}>
        <div className={styles.sectionTitle}>
          <div><p className={styles.kicker}>Issue temporary access</p><h2>Create referral code</h2></div>
        </div>
        <form className={styles.form} onSubmit={issue}>
          <label><span>Customer Gmail</span><input name="gmail" type="email" required placeholder="customer@gmail.com" /></label>
          <label><span>Duration</span><select name="duration" defaultValue="3 hours"><option value="3 hours">3 Hours</option><option value="1 day">1 Day</option></select></label>
          <label>
            <span>Access tier</span>
            <select name="tier" defaultValue="Premium">
              <option value="Premium">Premium</option>
              {canIssueCreator && <option value="Creator">Creator</option>}
            </select>
          </label>
          <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? "Creating…" : "Generate access"}</button>
        </form>

        {createdMember && (
          <div className={styles.createdBox}>
            <div><span>New 5-character access code</span><strong>{createdMember.access_code}</strong><small>{createdMember.gmail} · {createdMember.status} · {createdMember.tier} · expires {createdMember.expires_at ? new Date(createdMember.expires_at).toLocaleString() : "never"}</small></div>
            <button type="button" onClick={() => copy(createdMember.access_code)}>Copy code</button>
          </div>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionTitle}><div><p className={styles.kicker}>Audit trail</p><h2>Your issued accounts</h2></div><span>{referrals.length}</span></div>
        <div className={styles.list}>
          {sortedReferrals.map((referral) => {
            const member = referral.member;
            const shown = member ? revealed.has(member.id) : false;
            return (
              <article className={styles.row} key={referral.id}>
                <div className={styles.identity}>
                  <strong>{referral.referred_gmail}</strong>
                  <span>{referral.duration} · {referral.tier} · {new Date(referral.created_at).toLocaleString()}</span>
                </div>
                {member && (
                  <div className={styles.codeActions}>
                    <button type="button" className={styles.codeButton} onClick={() => toggleReveal(member.id)}>{shown ? member.access_code : "•••••"}</button>
                    {shown && <button type="button" className={styles.copyButton} onClick={() => copy(member.access_code)}>Copy</button>}
                  </div>
                )}
              </article>
            );
          })}
          {!referrals.length && <div className={styles.empty}>No referral accounts have been issued yet.</div>}
        </div>
      </section>
    </main>
  );
}
