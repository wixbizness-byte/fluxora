"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./milestones.module.css";

type Milestone = {
  code: string;
  title: string;
  threshold: number;
  bonusDays: number;
  progress: number;
  remaining: number;
  completed: boolean;
  rewardGranted: boolean;
};

type NextMilestone = {
  code: string;
  title: string;
  threshold: number;
  bonusDays: number;
  progress: number;
  remaining: number;
};

type ResponseBody = {
  referrer?: { id: string } | null;
  dashboard?: {
    milestones?: Milestone[];
    nextMilestone?: NextMilestone | null;
  } | null;
};

export default function MilestonesPanel() {
  const [data, setData] = useState<ResponseBody | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/prompts/api/public-referrer", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as ResponseBody;
      })
      .then((body) => {
        if (!cancelled) setData(body);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const milestones = data?.dashboard?.milestones || [];
  const next = data?.dashboard?.nextMilestone || null;
  const progressPercent = useMemo(() => {
    if (!next || next.threshold <= 0) return 100;
    return Math.max(0, Math.min(100, (next.progress / next.threshold) * 100));
  }, [next]);

  if (!data?.referrer || !milestones.length) return null;

  return (
    <section className={styles.wrap} aria-label="Referral milestones">
      <div className={styles.card}>
        <div className={styles.heading}>
          <div>
            <p className={styles.kicker}>Referral milestones</p>
            <h2>Earn bonus access</h2>
          </div>
          {next ? (
            <span className={styles.nextPill}>{next.remaining} to next reward</span>
          ) : (
            <span className={styles.completePill}>All milestones complete</span>
          )}
        </div>

        {next ? (
          <div className={styles.nextCard}>
            <div className={styles.nextTop}>
              <div>
                <span>Next milestone</span>
                <strong>{next.threshold} qualified referrals</strong>
              </div>
              <div className={styles.bonus}>
                <span>Bonus</span>
                <strong>+{next.bonusDays} days</strong>
              </div>
            </div>
            <div className={styles.progressMeta}>
              <span>{next.progress} / {next.threshold} qualified</span>
              <span>{next.remaining} remaining</span>
            </div>
            <div className={styles.track}>
              <div className={styles.fill} style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        ) : (
          <div className={styles.allDone}>
            You reached every active referral milestone. Future milestone tiers can be added without changing your referral link.
          </div>
        )}

        <div className={styles.grid}>
          {milestones.map((milestone) => (
            <article
              className={`${styles.milestone} ${milestone.completed ? styles.unlocked : ""}`}
              key={milestone.code}
            >
              <div className={styles.milestoneTop}>
                <span>{milestone.threshold} referrals</span>
                <strong>+{milestone.bonusDays} days</strong>
              </div>
              <div className={styles.miniTrack}>
                <div
                  className={styles.miniFill}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, (milestone.progress / milestone.threshold) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className={styles.state}>
                {milestone.completed && milestone.rewardGranted
                  ? "✓ Reward unlocked"
                  : milestone.completed
                    ? "Milestone reached"
                    : `${milestone.remaining} more to unlock`}
              </div>
            </article>
          ))}
        </div>

        <p className={styles.note}>
          Milestone bonuses are awarded once per tier. When timed access can be extended safely, the bonus is applied automatically; otherwise it stays in your reward balance.
        </p>
      </div>
    </section>
  );
}
