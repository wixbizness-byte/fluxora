"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./smart-expiry-retention.module.css";

type RetentionAction = {
  code: string;
  priority: number;
  kind: "earned_access" | "onboarding" | "referral" | "payment" | string;
  title: string;
  description: string;
  cta: string;
  href: string;
  days?: number;
  rewardDays?: number;
  progress?: { completed?: number; required?: number };
};

type RetentionData = {
  eligible: boolean;
  reason?: string;
  urgency?: "critical" | "soon" | "approaching" | string;
  hoursRemaining?: number;
  member?: {
    tier?: string;
    status?: string;
    expiresAt?: string | null;
  };
  earnedAccess?: {
    walletDaysAvailable?: number;
    starterRewardDaysAvailable?: number;
    totalPremiumDaysEarned?: number;
  };
  paymentCtaVisible?: boolean;
  actions?: RetentionAction[];
};

type ApiResponse = {
  retention?: RetentionData | null;
  error?: string;
};

const actionLabels: Record<string, string> = {
  earned_access: "Already earned",
  onboarding: "Still available",
  referral: "Earn more",
  payment: "Optional fallback",
};

function remainingText(expiresAt?: string | null) {
  if (!expiresAt) return "Access ending soon";
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return "Access ending now";
  const minutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainder = hours % 24;
    return `${days}d ${remainder}h remaining`;
  }
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${minutes}m remaining`;
}

function dayLabel(value: number) {
  return `${value} ${value === 1 ? "day" : "days"}`;
}

export default function SmartExpiryRetentionPanel() {
  const [data, setData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, setClock] = useState(0);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/prompts/api/retention", {
        cache: "no-store",
        credentials: "include",
      });
      if (response.status === 401) {
        setData(null);
        setError("");
        return;
      }
      const body = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok) throw new Error(body.error || "Could not load your access options.");
      setData(body.retention || null);
      setError("");
    } catch (reason) {
      setData(null);
      setError(reason instanceof Error ? reason.message : "Could not load your access options.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  useEffect(() => {
    if (!data?.eligible || !data.member?.expiresAt) return;
    const timer = window.setInterval(() => setClock((value) => value + 1), 60_000);
    return () => window.clearInterval(timer);
  }, [data?.eligible, data?.member?.expiresAt]);

  const actions = useMemo(
    () => [...(data?.actions || [])].sort((a, b) => Number(a.priority || 999) - Number(b.priority || 999)),
    [data?.actions],
  );

  if (loading || !data?.eligible) return null;

  const walletDays = Number(data.earnedAccess?.walletDaysAvailable || 0);
  const starterDays = Number(data.earnedAccess?.starterRewardDaysAvailable || 0);
  const totalEarned = Number(data.earnedAccess?.totalPremiumDaysEarned || 0);
  const countdown = remainingText(data.member?.expiresAt);

  return (
    <section className={`${styles.shell} ${styles[data.urgency || "approaching"] || ""}`} aria-labelledby="retention-heading">
      <div className={styles.card}>
        <div className={styles.hero}>
          <div>
            <p className={styles.kicker}>Before your trial ends</p>
            <h1 id="retention-heading">{countdown}</h1>
            <p className={styles.lead}>Use the access you already earned—or can still earn—before considering payment.</p>
          </div>
          <div className={styles.expiryBox}>
            <span>Current access</span>
            <strong>{data.member?.tier || "Premium"}</strong>
            <small>{data.member?.expiresAt ? new Date(data.member.expiresAt).toLocaleString() : "Ending soon"}</small>
          </div>
        </div>

        <div className={styles.earned} aria-label="Earned access summary">
          <div><span>Reward wallet</span><strong>{dayLabel(walletDays)}</strong><small>available now</small></div>
          <div><span>Starter Journey</span><strong>{dayLabel(starterDays)}</strong><small>{starterDays > 0 ? "still unlockable" : "no pending bonus"}</small></div>
          <div><span>Total Premium earned</span><strong>{dayLabel(totalEarned)}</strong><small>from Fluxora rewards</small></div>
        </div>

        <div className={styles.actionList}>
          {actions.map((action, index) => (
            <article className={`${styles.action} ${action.kind === "payment" ? styles.payment : ""}`} key={action.code}>
              <div className={styles.order}>{index + 1}</div>
              <div className={styles.actionCopy}>
                <div className={styles.actionTopline}>
                  <span>{actionLabels[action.kind] || "Option"}</span>
                  {action.progress?.required ? <small>{action.progress.completed || 0}/{action.progress.required} complete</small> : null}
                </div>
                <h2>{action.title}</h2>
                <p>{action.description}</p>
              </div>
              <a className={styles.actionButton} href={action.href}>{action.cta}</a>
            </article>
          ))}
        </div>

        {data.paymentCtaVisible ? (
          <p className={styles.disclosure}>Paid access is shown last on purpose. Your earned and free extension options are listed first.</p>
        ) : (
          <p className={styles.disclosure}>No payment prompt yet. Focus on the available actions above while your trial is active.</p>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    </section>
  );
}
