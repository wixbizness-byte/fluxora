"use client";

import { useEffect, useState } from "react";
import styles from "./referral-trust.module.css";

type LifecycleEvent = {
  stage: "clicked" | "signed_up" | "trial_activated" | "reward_granted" | "expired" | "rejected";
  label: string;
  at: string | null;
  reward?: string;
  reason?: string | null;
};

type Activity = {
  id: string;
  status: string;
  currentStage: string;
  maskedGmail: string | null;
  rejectionReason: string | null;
  trialExpiresAt: string | null;
  rewardApplied: boolean;
  lifecycle: LifecycleEvent[];
};

type RewardExplanation = {
  id: number;
  reason: string;
  exactReward: string;
  amount: number;
  sourceType: string;
  sourceId: string | null;
  earnedAt: string;
  status: string;
};

type Dashboard = {
  recent?: Activity[];
  rewardExplanations?: RewardExplanation[];
};

type ResponseBody = {
  referrer?: unknown;
  dashboard?: Dashboard | null;
};

const stageLabels: Record<string, string> = {
  clicked: "Clicked",
  signed_up: "Signed up",
  trial_activated: "Trial activated",
  reward_granted: "Reward granted",
  expired: "Expired",
  rejected: "Rejected",
  active: "Active",
  rewarded: "Rewarded",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date) + " PHT";
}

function reasonLabel(reason: string | null | undefined) {
  if (reason === "self_referral") return "Self-referral blocked";
  if (reason === "already_claimed_referral") return "Referral trial already used";
  if (reason === "previous_google_trial") return "Free trial already used";
  if (reason === "existing_active_member") return "Already an active member";
  if (reason === "referrer_inactive") return "Referral link inactive";
  return reason ? reason.replaceAll("_", " ") : "Not eligible";
}

export default function ReferralTrustPanel() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);

  useEffect(() => {
    fetch("/prompts/api/public-referrer", { cache: "no-store", credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return null;
        const body = (await response.json().catch(() => ({}))) as ResponseBody;
        return body.referrer ? body.dashboard || null : null;
      })
      .then(setDashboard)
      .catch(() => setDashboard(null));
  }, []);

  if (!dashboard) return null;
  const activities = dashboard.recent || [];
  const rewards = dashboard.rewardExplanations || [];

  return (
    <section className={styles.wrap} aria-label="Referral trust details">
      <div className={styles.card}>
        <div className={styles.heading}>
          <div>
            <p className={styles.kicker}>Referral trust</p>
            <h2>What happened & why you earned it</h2>
            <p>Every referral moves through verified server-side stages. Rewards only appear after the qualifying checks pass.</p>
          </div>
          <span className={styles.safe}>Private Gmail stays masked</span>
        </div>

        <div className={styles.grid}>
          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div><span>Lifecycle</span><h3>Referral verification trail</h3></div>
              <strong>{activities.length}</strong>
            </div>
            <div className={styles.activityList}>
              {activities.map((activity) => (
                <article className={styles.activity} key={activity.id}>
                  <header>
                    <div>
                      <strong>{activity.maskedGmail || "Anonymous visitor"}</strong>
                      <span>Current: {stageLabels[activity.currentStage] || activity.currentStage}</span>
                    </div>
                    <span className={styles.stage} data-stage={activity.currentStage}>{stageLabels[activity.currentStage] || activity.currentStage}</span>
                  </header>
                  <div className={styles.timeline}>
                    {(activity.lifecycle || []).map((event, index) => (
                      <div className={styles.event} key={`${activity.id}:${event.stage}:${index}`}>
                        <span className={styles.dot} />
                        <div>
                          <strong>{event.label}</strong>
                          <small>{formatDate(event.at)}</small>
                          {event.reward ? <em>{event.reward}</em> : null}
                          {event.stage === "rejected" ? <em>{reasonLabel(event.reason || activity.rejectionReason)}</em> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
              {!activities.length ? <div className={styles.empty}>No referral activity yet. Share your permanent link to start the verification trail.</div> : null}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div><span>Rewards</span><h3>Why you earned each reward</h3></div>
              <strong>{rewards.length}</strong>
            </div>
            <div className={styles.rewardList}>
              {rewards.map((reward) => (
                <article className={styles.reward} key={reward.id}>
                  <div>
                    <strong>{reward.exactReward}</strong>
                    <p>{reward.reason}</p>
                    <small>{formatDate(reward.earnedAt)}</small>
                  </div>
                  <span>Earned</span>
                </article>
              ))}
              {!rewards.length ? <div className={styles.empty}>No earned referral rewards yet. When one is granted, the exact reason, amount, and timestamp will appear here.</div> : null}
            </div>
          </section>
        </div>

        <p className={styles.note}>Self-referrals, reused trials, existing active memberships, and other ineligible claims are rejected before a reward is issued. Reward history is append-only and is never silently erased.</p>
      </div>
    </section>
  );
}
