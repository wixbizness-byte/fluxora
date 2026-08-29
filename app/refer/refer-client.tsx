"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import styles from "./refer.module.css";
import TelegramBotVerification from "./telegram-bot-verification";

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

type PublicReferrer = {
  id: string;
  gmail: string;
  telegramUserId: number;
  telegramUsername: string | null;
  referralCode: string;
  referralUrl: string;
  status: string;
  createdAt: string;
};

type PublicReferralActivity = {
  id: string;
  status: "clicked" | "verified" | "qualified" | "rejected";
  maskedGmail: string | null;
  clickedAt: string;
  verifiedAt: string | null;
  qualifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
};

type PublicReferralDashboard = {
  stats: {
    clicks: number;
    registrations: number;
    qualified: number;
    pending: number;
    rejected: number;
    daysEarned: number;
    creatorPreviewDaysEarned?: number;
    rewardBalance: number;
    conversionRate: number;
  };
  member: {
    tier: string;
    status: string;
    expiresAt: string | null;
    active: boolean;
    isPaidPremium?: boolean;
    creatorPreviewActive?: boolean;
    creatorPreviewExpiresAt?: string | null;
    effectiveAccess?: string;
  } | null;
  recent: PublicReferralActivity[];
};

type PublicReferrerResponse = {
  gmail?: string;
  gmailVerified?: boolean;
  telegramVerified?: boolean;
  botUsername?: string | null;
  botVerificationEnabled?: boolean;
  verificationMode?: "telegram_bot" | "telegram_widget";
  referrer?: PublicReferrer | null;
  dashboard?: PublicReferralDashboard | null;
  message?: string;
  error?: string;
};

type TelegramAuthUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

declare global {
  interface Window {
    onFluxoraTelegramAuth?: (user: TelegramAuthUser) => void;
  }
}

function TelegramLogin({
  botUsername,
  onAuth,
}: {
  botUsername: string;
  onAuth: (user: TelegramAuthUser) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current || !botUsername) return;

    window.onFluxoraTelegramAuth = onAuth;
    mountRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername.replace(/^@/, ""));
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onFluxoraTelegramAuth(user)");
    mountRef.current.appendChild(script);

    return () => {
      delete window.onFluxoraTelegramAuth;
      if (mountRef.current) mountRef.current.innerHTML = "";
    };
  }, [botUsername, onAuth]);

  return <div ref={mountRef} className={styles.telegramMount} />;
}

function activityTitle(activity: PublicReferralActivity) {
  if (activity.status === "qualified") return "Qualified referral";
  if (activity.status === "verified") return "Gmail verified";
  if (activity.status === "rejected") return "Referral not eligible";
  return "Referral link opened";
}

function rejectionLabel(reason: string | null) {
  if (reason === "self_referral") return "Self-referral blocked";
  if (reason === "already_claimed_referral") return "Referral trial already used";
  if (reason === "previous_google_trial") return "Free trial already used";
  if (reason === "existing_active_member") return "Already an active member";
  if (reason === "referrer_inactive") return "Referral link inactive";
  return "Not eligible for this trial";
}

function activityTime(activity: PublicReferralActivity) {
  const value = activity.qualifiedAt || activity.rejectedAt || activity.verifiedAt || activity.clickedAt;
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ReferClient() {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"legacy" | "public-guest" | "public-register" | "public-ready">("public-guest");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [affiliate, setAffiliate] = useState<ReferralResponse["affiliate"]>();
  const [stats, setStats] = useState({ total: 0, threeHours: 0, oneDay: 0 });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [createdMember, setCreatedMember] = useState<ReferralMember | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [publicState, setPublicState] = useState<PublicReferrerResponse>({});

  const sortedReferrals = useMemo(() => referrals, [referrals]);
  const canIssueCreator = affiliate?.access_scope === "premium_creator";

  async function loadPublic() {
    const response = await fetch("/prompts/api/public-referrer", { cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as PublicReferrerResponse;

    if (response.status === 401) {
      setMode("public-guest");
      setPublicState({});
      return;
    }
    if (!response.ok) throw new Error(body.error || "Could not load Refer & Earn.");

    setPublicState(body);
    setMode(body.referrer ? "public-ready" : "public-register");
  }

  async function load() {
    setLoading(true);
    setError("");

    const response = await fetch("/prompts/api/referrals", { cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as ReferralResponse;

    if (response.ok) {
      setMode("legacy");
      setAffiliate(body.affiliate);
      setStats(body.stats || { total: 0, threeHours: 0, oneDay: 0 });
      setReferrals(body.referrals || []);
      setLoading(false);
      return;
    }

    if (response.status === 401 || response.status === 403) {
      try {
        await loadPublic();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not load Refer & Earn.");
      }
      setLoading(false);
      return;
    }

    setError(body.error || "Could not load referral data.");
    setLoading(false);
  }

  useEffect(() => {
    load().catch((cause) => {
      setError(cause instanceof Error ? cause.message : "Could not load referrals.");
      setLoading(false);
    });
  }, []);

  async function registerTelegram(user: TelegramAuthUser) {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/prompts/api/public-referrer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const body = (await response.json().catch(() => ({}))) as PublicReferrerResponse;

      if (!response.ok) {
        setError(body.error || "Could not connect Telegram.");
        return;
      }

      setPublicState((current) => ({ ...current, ...body }));
      setMode("public-ready");
      setNotice(body.message || "Referral account created.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not connect Telegram.");
    } finally {
      setBusy(false);
    }
  }

  async function finishBotVerification() {
    setNotice("Telegram verified. Your referral account is ready.");
    setError("");
    await loadPublic();
  }

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

  async function copy(value: string, message = "Copied.") {
    await navigator.clipboard.writeText(value);
    setNotice(message);
  }

  async function shareReferral(referrer: PublicReferrer) {
    const text = `Try Fluxora Premium free for 2 days with my referral link: ${referrer.referralUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Fluxora 2-Day Premium Trial",
          text,
          url: referrer.referralUrl,
        });
        return;
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
      }
    }
    await copy(text, "Referral message copied.");
  }

  if (loading) {
    return <main className={styles.page}><section className={styles.centerCard}>Loading Fluxora referrals…</section></main>;
  }

  if (mode === "public-guest") {
    return (
      <main className={styles.page}>
        <section className={styles.centerCard}>
          <p className={styles.kicker}>Fluxora Refer & Earn</p>
          <h1>Invite friends. Earn access.</h1>
          <p>Anyone can become a Fluxora referrer. Verify one Gmail, connect one Telegram account, and receive your own permanent referral link.</p>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.miniSteps}>
            <span><strong>1</strong> Verify Gmail</span>
            <span><strong>2</strong> Connect Telegram</span>
            <span><strong>3</strong> Share & earn</span>
          </div>
          <a className={styles.primaryButton} href="/prompts/referrer-login">Start with Google</a>
          <p className={styles.finePrint}>One Gmail can be linked to one Telegram account only. Each qualified referral gives the new user 2 days of Premium access and earns you 2 days too.</p>
          <a className={styles.textLink} href="/">Back to Fluxora</a>
        </section>
      </main>
    );
  }

  if (mode === "public-register") {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <div><p className={styles.kicker}>Fluxora Refer & Earn</p><h1>Verify Telegram</h1><p>Gmail verified: {publicState.gmail}</p></div>
          <div className={styles.headerActions}><a href="/">Fluxora</a><a href="/prompts/referrer-login">Google account</a></div>
        </header>

        {(notice || error) && <div className={error ? styles.error : styles.notice}>{error || notice}</div>}

        <section className={styles.panel}>
          <div className={styles.stepBadge}>Step 2 of 2</div>
          <div className={styles.sectionTitle}><div><p className={styles.kicker}>Identity verification</p><h2>Verify your Telegram account</h2></div></div>
          <p className={styles.panelCopy}>Fluxora stores your permanent Telegram numeric ID so changing your @username later will not break your referral account.</p>

          {publicState.botVerificationEnabled ? (
            <TelegramBotVerification onVerified={finishBotVerification} />
          ) : publicState.botUsername ? (
            <div className={styles.telegramBox}>
              {busy ? <strong>Verifying Telegram…</strong> : <TelegramLogin botUsername={publicState.botUsername} onAuth={registerTelegram} />}
              <small>Signing in verifies the Telegram account. It does not expose your Telegram password to Fluxora.</small>
            </div>
          ) : (
            <div className={styles.error}>Telegram login is not configured on the server yet.</div>
          )}
        </section>
      </main>
    );
  }

  if (mode === "public-ready" && publicState.referrer) {
    const referrer = publicState.referrer;
    const dashboard = publicState.dashboard;
    const publicStats = dashboard?.stats || {
      clicks: 0,
      registrations: 0,
      qualified: 0,
      pending: 0,
      rejected: 0,
      daysEarned: 0,
      creatorPreviewDaysEarned: 0,
      rewardBalance: 0,
      conversionRate: 0,
    };
    const paidPremium = Boolean(dashboard?.member?.isPaidPremium);
    const previewActive = Boolean(dashboard?.member?.creatorPreviewActive);
    const effectiveAccess = dashboard?.member?.effectiveAccess || dashboard?.member?.tier || "Premium";
    const visibleExpiry = previewActive ? dashboard?.member?.creatorPreviewExpiresAt : dashboard?.member?.expiresAt;

    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <div><p className={styles.kicker}>Fluxora Refer & Earn</p><h1>Referral Dashboard</h1><p>{referrer.gmail}</p></div>
          <div className={styles.headerActions}><a href="/">Fluxora</a><a href="/prompts/referrer-login">Account</a></div>
        </header>

        {(notice || error) && <div className={error ? styles.error : styles.notice}>{error || notice}</div>}

        <section className={`${styles.panel} ${styles.referralHero}`}>
          <div className={styles.sectionTitle}>
            <div><p className={styles.kicker}>Your permanent referral link</p><h2>{referrer.referralCode}</h2></div>
            <span className={styles.activePill}>{referrer.status}</span>
          </div>

          <div className={styles.linkBox}>
            <code>{referrer.referralUrl}</code>
            <button type="button" onClick={() => copy(referrer.referralUrl, "Referral link copied.")}>Copy link</button>
            <button type="button" onClick={() => shareReferral(referrer)}>Share</button>
          </div>

          <p className={styles.rewardCallout}>
            {paidPremium ? (
              <><strong>Refer friends. Extend your Creator Preview.</strong> Every qualified referral still gives the new user 2 days of Premium access, while your +2 Trial-Day reward becomes +2 Creator Preview days.</>
            ) : (
              <><strong>Both get 2 days.</strong> A new eligible user who claims through your link gets 2 days of Premium access, and you earn +2 Premium days.</>
            )}
          </p>

          <div className={styles.accountGrid}>
            <div><span>Verified Gmail</span><strong>{referrer.gmail}</strong></div>
            <div><span>Telegram</span><strong>{referrer.telegramUsername ? `@${referrer.telegramUsername}` : `ID ${referrer.telegramUserId}`}</strong></div>
            <div>
              <span>Current access</span>
              <strong>{dashboard?.member?.active ? `${effectiveAccess} · ${dashboard.member.status}` : "No active access"}</strong>
            </div>
            <div>
              <span>{previewActive ? "Creator Preview expiry" : "Access expiry"}</span>
              <strong>
                {dashboard?.member?.active && visibleExpiry
                  ? new Date(visibleExpiry).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })
                  : dashboard?.member?.active ? "No expiry" : "—"}
              </strong>
            </div>
          </div>
        </section>

        <section className={styles.dashboardStats}>
          <article><span>Link clicks</span><strong>{publicStats.clicks}</strong></article>
          <article><span>Verified signups</span><strong>{publicStats.registrations}</strong></article>
          <article><span>Qualified</span><strong>{publicStats.qualified}</strong></article>
          <article><span>{paidPremium ? "Creator days earned" : "Days earned"}</span><strong>+{paidPremium ? Number(publicStats.creatorPreviewDaysEarned || 0) : publicStats.daysEarned}</strong></article>
          <article><span>Premium wallet</span><strong>{publicStats.rewardBalance}</strong><small>unapplied Premium days</small></article>
          <article><span>Conversion</span><strong>{publicStats.conversionRate}%</strong></article>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionTitle}>
            <div><p className={styles.kicker}>Referral funnel</p><h2>Recent activity</h2></div>
            <div className={styles.activitySummary}><span>{publicStats.pending} pending</span><span>{publicStats.rejected} not eligible</span></div>
          </div>

          <div className={styles.activityList}>
            {(dashboard?.recent || []).map((activity) => (
              <article className={styles.activityRow} key={activity.id}>
                <div className={styles.activityMain}>
                  <span className={styles.statusDot} data-status={activity.status} />
                  <div>
                    <strong>{activityTitle(activity)}</strong>
                    <span>{activity.maskedGmail || "Anonymous visitor"}{activity.status === "rejected" ? ` · ${rejectionLabel(activity.rejectionReason)}` : ""}</span>
                  </div>
                </div>
                <div className={styles.activityMeta}>
                  <span className={styles.statusPill} data-status={activity.status}>{activity.status}</span>
                  <time>{activityTime(activity)}</time>
                </div>
              </article>
            ))}
            {!dashboard?.recent?.length && <div className={styles.empty}>No referral activity yet. Share your link to start earning access.</div>}
          </div>

          <p className={styles.finePrint}>Referred Gmail addresses are masked in your dashboard. Rewards are only issued after a referral passes the eligibility checks and successfully qualifies.</p>
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
        <div className={styles.headerActions}><a href="/">Fluxora</a><a href="/prompts/affiliate-login">Account</a></div>
      </header>

      <section className={styles.stats}>
        <article><span>Total issued</span><strong>{stats.total}</strong></article>
        <article><span>3 Hours</span><strong>{stats.threeHours}</strong></article>
        <article><span>1 Day</span><strong>{stats.oneDay}</strong></article>
      </section>

      {(notice || error) && <div className={error ? styles.error : styles.notice}>{error || notice}</div>}

      <section className={styles.panel}>
        <div className={styles.sectionTitle}><div><p className={styles.kicker}>Issue temporary access</p><h2>Create referral code</h2></div></div>
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
            <button type="button" onClick={() => copy(createdMember.access_code, "Access code copied.")}>Copy code</button>
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
                <div className={styles.identity}><strong>{referral.referred_gmail}</strong><span>{referral.duration} · {referral.tier} · {new Date(referral.created_at).toLocaleString()}</span></div>
                {member && (
                  <div className={styles.codeActions}>
                    <button type="button" className={styles.codeButton} onClick={() => toggleReveal(member.id)}>{shown ? member.access_code : "•••••"}</button>
                    {shown && <button type="button" className={styles.copyButton} onClick={() => copy(member.access_code, "Access code copied.")}>Copy</button>}
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
