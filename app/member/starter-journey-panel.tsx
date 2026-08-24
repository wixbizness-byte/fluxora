"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./starter-journey.module.css";

type StarterStep = {
  code: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
  cta: string;
  action: string | null;
  order: number;
};

type StarterJourney = {
  completedCount: number;
  actualCompletedCount: number;
  requiredCount: number;
  totalSteps: number;
  complete: boolean;
  completedAt: string | null;
  rewardDays: number;
  rewardGranted: boolean;
  rewardBalance: number;
  steps: StarterStep[];
};

type JourneyResponse = {
  gmail?: string;
  journey?: StarterJourney | null;
  message?: string;
  error?: string;
};

export default function StarterJourneyPanel() {
  const [journey, setJourney] = useState<StarterJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyCode, setBusyCode] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/prompts/api/starter-journey", {
        cache: "no-store",
        credentials: "include",
      });
      if (response.status === 401) {
        setJourney(null);
        setLoading(false);
        return;
      }
      const body = (await response.json().catch(() => ({}))) as JourneyResponse;
      if (!response.ok) throw new Error(body.error || "Could not load Starter Journey.");
      setJourney(body.journey || null);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load Starter Journey.");
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

  const percent = useMemo(() => {
    if (!journey?.requiredCount) return 0;
    return Math.max(0, Math.min(100, (journey.completedCount / journey.requiredCount) * 100));
  }, [journey]);

  async function openStep(step: StarterStep) {
    if (!step.action) {
      window.location.href = step.href;
      return;
    }

    setBusyCode(step.code);
    setError("");
    try {
      const response = await fetch("/prompts/api/starter-journey", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: step.action }),
      });
      const body = (await response.json().catch(() => ({}))) as JourneyResponse;
      if (!response.ok) throw new Error(body.error || "Could not update Starter Journey.");
      if (body.journey) setJourney(body.journey);
      window.location.href = step.href;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update Starter Journey.");
      setBusyCode("");
    }
  }

  if (loading) {
    return (
      <section className={styles.shell} aria-label="Fluxora Starter Journey">
        <div className={styles.card}><p className={styles.loading}>Loading your Starter Journey…</p></div>
      </section>
    );
  }

  if (!journey) return null;

  return (
    <section className={styles.shell} aria-labelledby="starter-journey-heading">
      <div className={styles.card}>
        <div className={styles.heading}>
          <div>
            <p className={styles.kicker}>Fluxora Starter Journey</p>
            <h2 id="starter-journey-heading">
              {journey.complete ? "Starter Journey complete" : "Get your first Fluxora wins"}
            </h2>
            <p className={styles.copy}>
              {journey.complete
                ? `You completed the journey and unlocked +${journey.rewardDays} Premium days in your Reward Wallet.`
                : `Complete any ${journey.requiredCount} of ${journey.totalSteps} useful actions to unlock +${journey.rewardDays} Premium days.`}
            </p>
          </div>
          <div className={journey.complete ? styles.rewardDone : styles.rewardPill}>
            <span>{journey.complete ? "Unlocked" : "Completion reward"}</span>
            <strong>+{journey.rewardDays} days</strong>
          </div>
        </div>

        <div className={styles.progressMeta}>
          <strong>{journey.completedCount} / {journey.requiredCount} complete</strong>
          <span>{journey.complete ? "100%" : `${Math.round(percent)}%`}</span>
        </div>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.fill} style={{ width: `${journey.complete ? 100 : percent}%` }} />
        </div>

        {error && <div className={styles.error} role="alert">{error}</div>}

        <div className={styles.steps}>
          {journey.steps.map((step) => (
            <article className={`${styles.step} ${step.completed ? styles.done : ""}`} key={step.code}>
              <div className={styles.check}>{step.completed ? "✓" : step.order}</div>
              <div className={styles.stepCopy}>
                <strong>{step.title}</strong>
                <span>{step.description}</span>
              </div>
              {step.completed ? (
                <span className={styles.completedLabel}>Completed</span>
              ) : (
                <button
                  type="button"
                  onClick={() => void openStep(step)}
                  disabled={busyCode === step.code}
                >
                  {busyCode === step.code ? "Opening…" : step.cta}
                </button>
              )}
            </article>
          ))}
        </div>

        <div className={styles.footer}>
          <span>
            Existing activity counts automatically when Fluxora can verify it from your account history.
          </span>
          {journey.rewardGranted && (
            <a href="/refer">Open Reward Wallet · {journey.rewardBalance} days available</a>
          )}
        </div>
      </div>
    </section>
  );
}
