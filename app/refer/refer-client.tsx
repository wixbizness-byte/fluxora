"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
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

type PublicReferrerResponse = {
  gmail?: string;
  gmailVerified?: boolean;
  telegramVerified?: boolean;
  botUsername?: string | null;
  referrer?: PublicReferrer | null;
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

export default function ReferClient() {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<
    "legacy" | "public-guest" | "public-register" | "public-ready"
  >("public-guest");
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
    const response = await fetch("/prompts/api/public-referrer", {
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as PublicReferrerResponse;

    if (response.status === 401) {
      setMode("public-guest");
      setPublicState({});
      return;
    }
    if (!response.ok) {
      throw new Error(body.error || "Could not load Refer & Earn.");
    }

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

  if (loading) {
    return (
      <main className={styles.page}>
        <section className={styles.centerCard}>Loading Fluxora referrals…</section>
      </main>
    );
  }

  if (mode === "public-guest") {
    return (
      <main className={styles.page}>
        <section className={styles.centerCard}>
          <p className={styles.kicker}>Fluxora Refer & Earn</p>
          <h1>Invite friends. Earn access.</h1>
          <p>
            Anyone can become a Fluxora referrer. Verify one Gmail, connect one
            Telegram account, and receive your own permanent referral link.
          </p>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.miniSteps}>
            <span><strong>1</strong> Verify Gmail</span>
            <span><strong>2</strong> Connect Telegram</span>
            <span><strong>3</strong> Get your link</span>
          </div>
          <a className={styles.primaryButton} href="/prompts/referrer-login">
            Start with Google
          </a>
          <p className={styles.finePrint}>
            One Gmail can be linked to one Telegram account only. Referral trial
            rewards are enabled in the next phase.
          </p>
          <a className={styles.textLink} href="/">
            Back to Fluxora
          </a>
        </section>
      </main>
    );
  }

  if (mode === "public-register") {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Fluxora Refer & Earn</p>
            <h1>Connect Telegram</h1>
            <p>Gmail verified: {publicState.gmail}</p>
          </div>
          <div className={styles.headerActions}>
            <a href="/">Fluxora</a>
            <a href="/prompts/referrer-login">Google account</a>
          </div>
        </header>

        {(notice || error) && (
          <div className={error ? styles.error : styles.notice}>{error || notice}</div>
        )}

        <section className={styles.panel}>
          <div className={styles.stepBadge}>Step 2 of 2</div>
          <div className={styles.sectionTitle}>
            <div>
              <p className={styles.kicker}>Identity verification</p>
              <h2>Connect your Telegram account</h2>
            </div>
          </div>
          <p className={styles.panelCopy}>
            Fluxora stores your permanent Telegram numeric ID so changing your
            @username later will not break your referral account.
          </p>

          {publicState.botUsername ? (
            <div className={styles.telegramBox}>
              {busy ? (
                <strong>Verifying Telegram…</strong>
              ) : (
                <TelegramLogin
                  botUsername={publicState.botUsername}
                  onAuth={registerTelegram}
                />
              )}
              <small>Signing in verifies the Telegram account. It does not expose your Telegram password to Fluxora.</small>
            </div>
          ) : (
            <div className={styles.error}>
              Telegram login is not configured on the server yet.
            </div>
          )}
        </section>
      </main>
    );
  }

  if (mode === "public-ready" && publicState.referrer) {
    const referrer = publicState.referrer;
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Fluxora Refer & Earn</p>
            <h1>Your referral link</h1>
            <p>{referrer.gmail}</p>
          </div>
          <div className={styles.headerActions}>
            <a href="/">Fluxora</a>
            <a href="/prompts/referrer-login">Account</a>
          </div>
        </header>

        {(notice || error) && (
          <div className={error ? styles.error : styles.notice}>{error || notice}</div>
        )}

        <section className={styles.panel}>
          <div className={styles.sectionTitle}>
            <div>
              <p className={styles.kicker}>Permanent referral ID</p>
              <h2>{referrer.referralCode}</h2>
            </div>
            <span className={styles.activePill}>{referrer.status}</span>
          </div>

          <div className={styles.linkBox}>
            <code>{referrer.referralUrl}</code>
            <button
              type="button"
              onClick={() => copy(referrer.referralUrl, "Referral link copied.")}
            >
              Copy link
            </button>
          </div>

          <div className={styles.accountGrid}>
            <div><span>Verified Gmail</span><strong>{referrer.gmail}</strong></div>
            <div>
              <span>Telegram</span>
              <strong>
                {referrer.telegramUsername
                  ? `@${referrer.telegramUsername}`
                  : `ID ${referrer.telegramUserId}`}
              </strong>
            </div>
          </div>

          <p className={styles.finePrint}>
            Your referral ID is permanent. Phase 3 will activate the 2-day trial
            landing experience and referral rewards on this link.
          </p>
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
                <div className={styles.identity}>
                  <strong>{referral.referred_gmail}</strong>
                  <span>{referral.duration} · {referral.tier} · {new Date(referral.created_at).toLocaleString()}</span>
                </div>
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
