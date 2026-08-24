"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./referral-claim.module.css";

type Invite = {
  attributionToken: string;
  referralCode: string;
  inviter?: { name?: string | null; username?: string | null };
  trialDays?: number;
};

type ClaimResponse = {
  success?: boolean;
  result?: string;
  message?: string;
  error?: string;
  referrerRewardApplied?: boolean;
  member?: {
    id: string;
    accessCode: string;
    gmail: string;
    tier: string;
    expiresAt: string | null;
  } | null;
};

function validAttribution(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default function ReferralClaimClient({
  code,
  attribution,
  shouldClaim,
}: {
  code: string;
  attribution: string;
  shouldClaim: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [claim, setClaim] = useState<ClaimResponse | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const started = useRef(false);

  const activeAttribution = useMemo(
    () => (validAttribution(attribution) ? attribution : invite?.attributionToken || ""),
    [attribution, invite]
  );

  async function createAttribution() {
    const response = await fetch("/prompts/api/referral-attribution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as Invite & { error?: string };
    if (!response.ok) throw new Error(body.error || "This referral invitation could not be opened.");
    setInvite(body);
    return body.attributionToken;
  }

  async function claimTrial(token: string) {
    setClaiming(true);
    setError("");
    const response = await fetch("/prompts/api/referral-claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attributionToken: token }),
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as ClaimResponse;

    if (response.status === 401) {
      window.location.href = loginUrl(token);
      return;
    }

    setClaim(body);
    if (!response.ok) setError(body.message || body.error || "This referral trial could not be claimed.");
    setClaiming(false);
  }

  function loginUrl(token: string) {
    const params = new URLSearchParams({ mode: "claim", ref: code, attribution: token });
    return `/prompts/referrer-login?${params.toString()}`;
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        if (shouldClaim && validAttribution(attribution)) {
          setLoading(false);
          await claimTrial(attribution);
          return;
        }
        await createAttribution();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not load this referral invitation.");
      } finally {
        setLoading(false);
      }
    })();
  }, [attribution, code, shouldClaim]);

  async function copyCode() {
    const value = claim?.member?.accessCode || "";
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setNotice("Access code copied.");
  }

  if (loading || claiming) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <p className={styles.kicker}>Fluxora referral invite</p>
          <h1>{claiming ? "Activating your access…" : "Opening your invite…"}</h1>
          <p className={styles.muted}>Securely verifying the referral before continuing.</p>
        </section>
      </main>
    );
  }

  if (claim?.success && claim.member) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <div className={styles.successBadge}>2-DAY PREMIUM UNLOCKED</div>
          <h1>Your Fluxora access is active.</h1>
          <p className={styles.lead}>
            You received <strong>2 days of Premium access</strong>. Your referrer also earned their referral reward.
          </p>
          <div className={styles.codeBox}>
            <span>Your access code</span>
            <strong>{claim.member.accessCode}</strong>
            <small>
              {claim.member.gmail} · expires {claim.member.expiresAt ? new Date(claim.member.expiresAt).toLocaleString() : "later"}
            </small>
            <button type="button" onClick={copyCode}>Copy access code</button>
          </div>
          {notice && <p className={styles.notice}>{notice}</p>}
          <div className={styles.actions}>
            <a className={styles.primary} href="/tools">Explore Fluxora Tools</a>
            <a className={styles.secondary} href="/refer">Get My Referral Link</a>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <p className={styles.kicker}>Fluxora referral invite</p>
          <h1>This trial can’t be claimed.</h1>
          <p className={styles.error}>{error}</p>
          <p className={styles.muted}>
            Referral trials are limited to eligible accounts and can’t be stacked with an already-used Fluxora free trial or active membership.
          </p>
          <div className={styles.actions}>
            <a className={styles.primary} href="/">Explore Fluxora</a>
            <a className={styles.secondary} href="/refer">Refer & Earn</a>
          </div>
        </section>
      </main>
    );
  }

  const token = activeAttribution;
  const inviter = invite?.inviter?.username
    ? `@${invite.inviter.username}`
    : invite?.inviter?.name || "a Fluxora user";

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.offerBadge}>REFERRAL EXCLUSIVE</div>
        <p className={styles.kicker}>Invited by {inviter}</p>
        <h1>Unlock Fluxora Premium for 2 days.</h1>
        <p className={styles.lead}>
          Your referral invite includes a <strong>2-day Premium trial</strong>. No payment is required.
        </p>
        <div className={styles.perks}>
          <div><strong>2 Days</strong><span>Premium access</span></div>
          <div><strong>Free</strong><span>No payment required</span></div>
          <div><strong>+2 Days</strong><span>Your referrer earns too</span></div>
        </div>
        <a
          className={`${styles.primary} ${!token ? styles.disabled : ""}`}
          href={token ? loginUrl(token) : "#"}
          aria-disabled={!token}
        >
          Claim My 2-Day Trial
        </a>
        <p className={styles.finePrint}>
          One referral trial per eligible Gmail. Self-referrals and duplicate free-trial claims are not eligible.
        </p>
      </section>
    </main>
  );
}
