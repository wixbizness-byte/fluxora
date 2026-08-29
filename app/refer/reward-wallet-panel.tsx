"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./reward-wallet.module.css";

type WalletHistoryEntry = {
  id: number;
  entryType: "grant" | "redeem" | "adjustment" | "revoke" | "expire";
  rewardType: string;
  amount: number;
  sourceType: string;
  sourceId: string | null;
  label: string;
  createdAt: string;
  appliedImmediately: boolean;
};

type Wallet = {
  availablePremiumDays: number;
  totalPremiumDaysGranted: number;
  totalPremiumDaysRedeemed: number;
  totalCreatorPreviewDaysGranted?: number;
  creatorPreviewActive?: boolean;
  creatorPreviewExpiresAt?: string | null;
  maxStackDays: number;
  member: {
    id: string;
    tier: string;
    status: string;
    expiresAt: string | null;
    active: boolean;
    timedAccess: boolean;
    isPaidPremium?: boolean;
    creatorPreviewActive?: boolean;
    creatorPreviewExpiresAt?: string | null;
    effectiveAccess?: string;
  } | null;
  history: WalletHistoryEntry[];
};

type WalletResponse = {
  gmail?: string;
  wallet?: Wallet | null;
  status?: string;
  message?: string;
  appliedDays?: number;
  stackLimited?: boolean;
  member?: {
    tier?: string;
    status?: string;
    expiresAt?: string | null;
    accessCode?: string | null;
  } | null;
  error?: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function entryAmount(entry: WalletHistoryEntry) {
  const amount = Number(entry.amount || 0);
  const sign = amount > 0 ? "+" : "";
  const unit = entry.rewardType === "creator_days" ? "Creator Preview day" : "Premium day";
  return `${sign}${amount} ${unit}${Math.abs(amount) === 1 ? "" : "s"}`;
}

export default function RewardWalletPanel() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState(1);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [accessCode, setAccessCode] = useState<string | null>(null);

  async function loadWallet() {
    const response = await fetch("/prompts/api/reward-wallet", { cache: "no-store" });
    if (response.status === 401 || response.status === 404) {
      setLoaded(true);
      return;
    }

    const body = (await response.json().catch(() => ({}))) as WalletResponse;
    if (!response.ok) throw new Error(body.error || "Could not load reward wallet.");

    setWallet(body.wallet || null);
    if (body.wallet?.availablePremiumDays) {
      setDays((current) => Math.max(1, Math.min(current, Math.floor(body.wallet!.availablePremiumDays))));
    }
    setLoaded(true);
  }

  useEffect(() => {
    loadWallet().catch(() => setLoaded(true));
  }, []);

  const available = Math.max(0, Math.floor(Number(wallet?.availablePremiumDays || 0)));
  const history = useMemo(() => (wallet?.history || []).slice(0, 12), [wallet]);
  const isPaidPremium = Boolean(wallet?.member?.isPaidPremium);
  const previewActive = Boolean(wallet?.member?.creatorPreviewActive || wallet?.creatorPreviewActive);
  const previewExpiry = wallet?.member?.creatorPreviewExpiresAt || wallet?.creatorPreviewExpiresAt || null;
  const creatorDaysEarned = Number(wallet?.totalCreatorPreviewDaysGranted || 0);

  async function applyDays(amount = days) {
    if (!wallet || available <= 0 || busy) return;

    const requested = Math.max(1, Math.min(Math.floor(amount), available));
    setBusy(true);
    setError("");
    setNotice("");
    setAccessCode(null);

    try {
      const requestId = crypto.randomUUID();
      const response = await fetch("/prompts/api/reward-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: requested, requestId }),
      });
      const body = (await response.json().catch(() => ({}))) as WalletResponse;

      if (!response.ok) throw new Error(body.error || body.message || "Could not apply reward days.");

      if (body.wallet) {
        setWallet(body.wallet);
        const nextBalance = Math.floor(Number(body.wallet.availablePremiumDays || 0));
        setDays(Math.max(1, Math.min(requested, Math.max(1, nextBalance))));
      }
      if (body.member?.accessCode) setAccessCode(body.member.accessCode);

      if (body.status === "stack_limit_reached" || body.status === "incompatible_access") {
        setError(body.message || "Those reward days cannot be applied right now.");
      } else {
        setNotice(body.message || `${body.appliedDays || requested} reward days applied.`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not apply reward days.");
    } finally {
      setBusy(false);
    }
  }

  if (!loaded || !wallet) return null;

  return (
    <section className={styles.wrap} aria-label="Fluxora reward wallet">
      <div className={styles.card}>
        <div className={styles.heading}>
          <div>
            <p className={styles.kicker}>Fluxora rewards</p>
            <h2>{isPaidPremium ? "Creator Preview Balance" : "Reward Wallet"}</h2>
            <p>
              {isPaidPremium
                ? "Creator Preview rewards apply immediately to your paid Premium account. Any older Premium-day balance stays separate below."
                : "Keep earned access days until you are ready to use them."}
            </p>
          </div>
          <div className={styles.balanceBlock}>
            <span>{isPaidPremium ? "Creator Preview earned" : "Available"}</span>
            <strong>{isPaidPremium ? creatorDaysEarned : available}</strong>
            <small>{isPaidPremium ? "days total" : `Premium ${available === 1 ? "day" : "days"}`}</small>
          </div>
        </div>

        <div className={styles.summaryGrid}>
          {isPaidPremium ? (
            <>
              <article>
                <span>Creator Preview</span>
                <strong>{previewActive ? "Active" : "Inactive"}</strong>
                <small>{previewActive && previewExpiry ? `Until ${formatDate(previewExpiry)}` : "Earn Trial-Day rewards to extend it"}</small>
              </article>
              <article>
                <span>Creator days earned</span>
                <strong>+{creatorDaysEarned}</strong>
                <small>applied immediately</small>
              </article>
            </>
          ) : (
            <>
              <article><span>Total earned</span><strong>+{Number(wallet.totalPremiumDaysGranted || 0)}</strong><small>Premium days</small></article>
              <article><span>Already applied</span><strong>{Number(wallet.totalPremiumDaysRedeemed || 0)}</strong><small>Premium days</small></article>
            </>
          )}
          <article>
            <span>Premium wallet</span>
            <strong>{available}</strong>
            <small>unapplied days</small>
          </article>
          <article>
            <span>Current access</span>
            <strong>{wallet.member?.active ? wallet.member.effectiveAccess || wallet.member.tier : "Inactive"}</strong>
            <small>
              {wallet.member?.active && wallet.member.expiresAt
                ? `Premium until ${formatDate(wallet.member.expiresAt)}`
                : wallet.member?.active
                  ? "Base plan has no expiry"
                  : "Wallet can activate Premium"}
            </small>
          </article>
        </div>

        <div className={styles.applyCard}>
          <div>
            <span className={styles.applyLabel}>Apply Premium reward days</span>
            <strong>{available > 0 ? "Choose how many Premium days to use" : "No unapplied Premium days right now"}</strong>
            <p>
              Creator Preview days are applied automatically. This control is only for existing Premium-day wallet rewards, which remain subject to the {wallet.maxStackDays}-day stacking limit.
            </p>
          </div>

          <div className={styles.applyControls}>
            <input aria-label="Premium days to apply" type="number" min={1} max={Math.max(1, available)} value={days} disabled={available <= 0 || busy} onChange={(event) => {
              const next = Number(event.target.value);
              setDays(Number.isFinite(next) ? Math.max(1, Math.min(Math.floor(next), Math.max(1, available))) : 1);
            }} />
            <button type="button" disabled={available <= 0 || busy} onClick={() => applyDays()}>{busy ? "Applying…" : "Apply Reward"}</button>
            {available > 1 && <button className={styles.secondaryButton} type="button" disabled={busy} onClick={() => applyDays(available)}>Apply all</button>}
          </div>
        </div>

        {(notice || error) && <div className={error ? styles.error : styles.notice}>{error || notice}</div>}

        {accessCode && (
          <div className={styles.accessCodeBox}>
            <div><span>Your active Fluxora access code</span><strong>{accessCode}</strong></div>
            <button type="button" onClick={() => navigator.clipboard.writeText(accessCode)}>Copy code</button>
          </div>
        )}

        <div className={styles.historyHeading}>
          <div><p className={styles.kicker}>Ledger</p><h3>Recent reward activity</h3></div>
          <span>Last {history.length}</span>
        </div>

        <div className={styles.historyList}>
          {history.map((entry) => (
            <article className={styles.historyRow} key={entry.id}>
              <div><strong>{entry.label}</strong><span>{formatDate(entry.createdAt)}</span></div>
              <strong data-positive={Number(entry.amount) > 0 ? "true" : "false"}>{entryAmount(entry)}</strong>
            </article>
          ))}
          {!history.length && <div className={styles.empty}>Your reward activity will appear here.</div>}
        </div>

        <p className={styles.note}>
          The reward ledger is append-only. Creator Preview, Premium-day, applied, adjusted, and revoked rewards stay explicitly typed in history.
        </p>
      </div>
    </section>
  );
}
