"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./referral-tiers.module.css";

type Tier = {
  code: string;
  name: string;
  description: string;
  threshold: number;
  xpBonus: number;
  benefits: string[];
  unlocked?: boolean;
  unlockedAt?: string | null;
  progress?: number;
  remaining?: number;
};

type ReferralTierProfile = {
  qualifiedCount: number;
  currentTier: Tier | null;
  nextTier: Tier | null;
  progressPercent: number;
  tiers: Tier[];
};

type ResponseBody = {
  referralTier?: ReferralTierProfile | null;
  error?: string;
};

function rankInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "R";
}

function unlockDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ReferralTiersPanel() {
  const [profile, setProfile] = useState<ReferralTierProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/prompts/api/referral-tier", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as ResponseBody;
      })
      .then((body) => {
        if (!cancelled) {
          setProfile(body?.referralTier || null);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const current = profile?.currentTier || null;
  const next = profile?.nextTier || null;
  const tiers = profile?.tiers || [];
  const progress = useMemo(
    () => Math.max(0, Math.min(100, Number(profile?.progressPercent || 0))),
    [profile?.progressPercent]
  );

  if (!loaded || !profile || !current || !tiers.length) return null;

  return (
    <section className={styles.wrap} aria-label="Referral ranks">
      <div className={styles.card}>
        <div className={styles.heading}>
          <div>
            <p className={styles.kicker}>Referral rank</p>
            <h2>Climb the Fluxora ranks</h2>
            <p>Your highest unlocked rank is permanent.</p>
          </div>
          <div className={styles.currentBadge}>
            <span className={styles.badgeMark}>{rankInitial(current.name)}</span>
            <div>
              <small>Current rank</small>
              <strong>{current.name}</strong>
            </div>
          </div>
        </div>

        <div className={styles.summaryGrid}>
          <article>
            <span>Qualified referrals</span>
            <strong>{profile.qualifiedCount}</strong>
          </article>
          <article>
            <span>Rank threshold</span>
            <strong>{current.threshold}</strong>
          </article>
          <article>
            <span>This rank bonus</span>
            <strong>+{current.xpBonus} XP</strong>
          </article>
        </div>

        {next ? (
          <div className={styles.nextCard}>
            <div className={styles.nextTop}>
              <div>
                <span>Next rank</span>
                <strong>{next.name}</strong>
              </div>
              <div className={styles.nextMeta}>
                <span>{next.remaining} referrals left</span>
                <strong>+{next.xpBonus} XP</strong>
              </div>
            </div>
            <div className={styles.track}>
              <div className={styles.fill} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.progressMeta}>
              <span>{profile.qualifiedCount} qualified</span>
              <span>{next.threshold} needed for {next.name}</span>
            </div>
          </div>
        ) : (
          <div className={styles.maxed}>You reached the highest active referral rank: {current.name}.</div>
        )}

        <div className={styles.grid}>
          {tiers.map((tier) => {
            const date = unlockDate(tier.unlockedAt);
            return (
              <article
                className={`${styles.tier} ${tier.unlocked ? styles.unlocked : ""}`}
                key={tier.code}
              >
                <div className={styles.tierTop}>
                  <span className={styles.tierMark}>{rankInitial(tier.name)}</span>
                  <div>
                    <strong>{tier.name}</strong>
                    <small>{tier.threshold} qualified referrals</small>
                  </div>
                  <span className={styles.state}>{tier.unlocked ? "Unlocked" : "Locked"}</span>
                </div>
                <p>{tier.description}</p>
                <div className={styles.benefits}>
                  {(tier.benefits || []).map((benefit) => (
                    <span key={benefit}>{benefit}</span>
                  ))}
                </div>
                <footer>
                  {tier.unlocked ? (
                    <span>{date ? `Earned ${date}` : "Permanent rank unlocked"}</span>
                  ) : (
                    <span>{tier.remaining} more referrals</span>
                  )}
                </footer>
              </article>
            );
          })}
        </div>

        <p className={styles.note}>
          Referral ranks grant permanent status, profile flair, and one-time XP. Premium-day bonuses continue to come from Referral Milestones, so rank rewards never double-spend your access-day economy.
        </p>
      </div>
    </section>
  );
}
