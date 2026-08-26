"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./monthly-challenge.module.css";

type MonthlyObjective = {
  code: string;
  title: string;
  description: string;
  slot: string;
  slotLabel: string;
  progress: number;
  target: number;
  status: string;
  completed: boolean;
  completedAt: string | null;
  rewardXp: number;
  cta: string;
  href: string;
};

type MonthlyChallenge = {
  periodKey: string;
  rotation: number;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  completedCount: number;
  totalCount: number;
  allObjectivesComplete: boolean;
  bonusProgress: number;
  bonusTarget: number;
  bonusCompleted: boolean;
  completionBonusXp: number;
  xpEarned: number;
  xpAvailable: number;
  objectives: MonthlyObjective[];
  generatedAt: string;
};

type ResponseBody = {
  monthlyChallenge?: MonthlyChallenge | null;
  error?: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "End of month";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date) + " PHT";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function MonthlyChallengePanel() {
  const [challenge, setChallenge] = useState<MonthlyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/prompts/api/monthly-challenge", {
        cache: "no-store",
        credentials: "include",
      });
      if (response.status === 401) {
        setChallenge(null);
        setError("");
        setLoading(false);
        return;
      }
      const body = (await response.json().catch(() => ({}))) as ResponseBody;
      if (!response.ok) throw new Error(body.error || "Could not load monthly creator challenge.");
      setChallenge(body.monthlyChallenge || null);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load monthly creator challenge.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const delayed = window.setTimeout(() => void load(), 2200);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(delayed);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const completionPercent = useMemo(() => {
    if (!challenge?.totalCount) return 0;
    return Math.max(0, Math.min(100, challenge.completedCount / challenge.totalCount * 100));
  }, [challenge]);

  if (loading) {
    return (
      <section className={styles.shell} aria-label="Fluxora Monthly Creator Challenge">
        <div className={styles.card}><p className={styles.loading}>Loading this month’s creator challenge…</p></div>
      </section>
    );
  }

  if (!challenge) {
    return error ? (
      <section className={styles.shell}><div className={styles.card}><p className={styles.error}>{error}</p></div></section>
    ) : null;
  }

  return (
    <section className={styles.shell} aria-labelledby="monthly-challenge-heading">
      <div className={styles.card}>
        <div className={styles.hero}>
          <div>
            <p className={styles.kicker}>Monthly Creator Challenge · {challenge.periodKey}</p>
            <h2 id="monthly-challenge-heading">{challenge.title}</h2>
            <p>{challenge.description}</p>
          </div>
          <div className={challenge.bonusCompleted ? styles.completeBadge : styles.xpBadge}>
            <span>{challenge.bonusCompleted ? "Challenge complete" : "Monthly XP"}</span>
            <strong>{formatNumber(challenge.xpEarned)} / {formatNumber(challenge.xpAvailable)}</strong>
          </div>
        </div>

        <div className={styles.summary}>
          <div>
            <strong>{challenge.completedCount} / {challenge.totalCount}</strong>
            <span>objectives complete</span>
          </div>
          <div className={styles.track} aria-label={`${Math.round(completionPercent)}% of monthly challenge complete`}>
            <div className={styles.fill} style={{ width: `${completionPercent}%` }} />
          </div>
          <div className={styles.reset}><span>Resets</span><strong>{formatDate(challenge.endsAt)}</strong></div>
        </div>

        <div className={`${styles.bonus} ${challenge.bonusCompleted ? styles.bonusComplete : ""}`}>
          <div>
            <span>All-objectives bonus</span>
            <strong>Complete all 4 objectives</strong>
            <small>{challenge.bonusCompleted ? "Bonus awarded automatically" : `${formatNumber(challenge.bonusProgress)} / ${formatNumber(challenge.bonusTarget)} objectives complete`}</small>
          </div>
          <div className={styles.bonusReward}>+{formatNumber(challenge.completionBonusXp)} XP</div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.objectives}>
          {challenge.objectives.map((objective) => {
            const progress = Math.min(Number(objective.progress || 0), Number(objective.target || 0));
            const objectivePercent = objective.target > 0
              ? Math.max(0, Math.min(100, progress / objective.target * 100))
              : 0;
            return (
              <article className={`${styles.objective} ${objective.completed ? styles.completed : ""}`} key={objective.code}>
                <div className={styles.objectiveTop}>
                  <span className={styles.slot}>{objective.slotLabel}</span>
                  <span className={styles.reward}>+{formatNumber(objective.rewardXp)} XP</span>
                </div>
                <h3>{objective.title}</h3>
                <p>{objective.description}</p>
                <div className={styles.objectiveTrack}><div style={{ width: `${objective.completed ? 100 : objectivePercent}%` }} /></div>
                <div className={styles.objectiveFooter}>
                  <strong>{objective.completed ? "✓ Completed" : `${formatNumber(progress)} / ${formatNumber(objective.target)}`}</strong>
                  {!objective.completed && objective.href && <a href={objective.href}>{objective.cta || "Continue"}</a>}
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.footer}>
          <span>Progress resets on the first day of each month at 12:00 AM Philippine time.</span>
          <button type="button" onClick={() => void load()}>Refresh progress</button>
        </div>
      </div>
    </section>
  );
}
