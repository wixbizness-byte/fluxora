"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./daily-activity-panel.module.css";

type StreakMilestone = {
  code: string;
  title: string;
  description: string;
  thresholdDays: number;
  xpBonus: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  remaining: number;
};

type RecentDay = {
  date: string;
  active: boolean;
  activityCount: number;
};

type ActivityProfile = {
  timezone: string;
  today: string;
  todayActive: boolean;
  currentStreak: number;
  longestStreak: number;
  lastActiveDay?: string | null;
  totalActiveDays: number;
  todayActivityCount: number;
  dailyXpPerDay: number;
  dailyXpEarned: number;
  milestoneXpEarned: number;
  milestones: StreakMilestone[];
  nextMilestone: StreakMilestone | null;
  recentDays: RecentDay[];
};

type ResponseBody = {
  activity?: ActivityProfile | null;
  error?: string;
};

function shortDay(value: string) {
  const date = new Date(`${value}T12:00:00+08:00`);
  return date.toLocaleDateString("en-PH", { weekday: "short" }).slice(0, 2);
}

function shortDate(value: string) {
  const date = new Date(`${value}T12:00:00+08:00`);
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function formatUnlock(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DailyActivityPanel() {
  const [activity, setActivity] = useState<ActivityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (record = false) => {
    try {
      const response = await fetch("/prompts/api/daily-activity", {
        method: record ? "POST" : "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (response.status === 401) {
        setActivity(null);
        setError("");
        return;
      }

      const body = (await response.json().catch(() => ({}))) as ResponseBody;
      if (!response.ok) throw new Error(body.error || "Could not load daily activity.");
      setActivity(body.activity || null);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load daily activity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
    const onFocus = () => void load(false);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const xpTotal = useMemo(
    () => Number(activity?.dailyXpEarned || 0) + Number(activity?.milestoneXpEarned || 0),
    [activity]
  );

  if (loading) {
    return (
      <section className={styles.shell} aria-label="Fluxora daily activity">
        <div className={styles.card}><p className={styles.loading}>Checking your daily streak…</p></div>
      </section>
    );
  }

  if (!activity) {
    return error ? (
      <section className={styles.shell}><div className={styles.card}><div className={styles.error}>{error}</div></div></section>
    ) : null;
  }

  const next = activity.nextMilestone;
  const nextPercent = next?.thresholdDays
    ? Math.max(0, Math.min(100, (activity.currentStreak / next.thresholdDays) * 100))
    : 100;

  return (
    <section className={styles.shell} aria-labelledby="daily-activity-heading">
      <div className={styles.card}>
        <div className={styles.hero}>
          <div>
            <p className={styles.kicker}>Daily activity</p>
            <h2 id="daily-activity-heading">{activity.currentStreak}-day streak</h2>
            <p>One active Philippine calendar day keeps the streak alive and earns +{activity.dailyXpPerDay} XP.</p>
          </div>
          <span className={activity.todayActive ? styles.activePill : styles.riskPill}>
            {activity.todayActive ? "Active today" : "Activity needed today"}
          </span>
        </div>

        <div className={styles.stats}>
          <article><span>Current streak</span><strong>{activity.currentStreak} days</strong></article>
          <article><span>Longest streak</span><strong>{activity.longestStreak} days</strong></article>
          <article><span>Active days</span><strong>{activity.totalActiveDays}</strong></article>
          <article><span>Streak XP earned</span><strong>{xpTotal} XP</strong></article>
        </div>

        <div className={styles.calendarWrap}>
          <div className={styles.sectionTitle}>
            <div>
              <p className={styles.kicker}>Last 14 days</p>
              <h3>Activity calendar</h3>
            </div>
            <button type="button" onClick={() => void load(false)}>Refresh</button>
          </div>
          <div className={styles.calendar}>
            {(activity.recentDays || []).map((day) => (
              <div className={`${styles.day} ${day.active ? styles.dayActive : ""}`} key={day.date} title={`${shortDate(day.date)} · ${day.activityCount} activities`}>
                <small>{shortDay(day.date)}</small>
                <strong>{new Date(`${day.date}T12:00:00+08:00`).getDate()}</strong>
                <span>{day.active ? "Done" : "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {next ? (
          <div className={styles.nextCard}>
            <div className={styles.nextTop}>
              <div>
                <span>Next streak milestone</span>
                <strong>{next.title}</strong>
              </div>
              <div className={styles.reward}><span>Reward</span><strong>+{next.xpBonus} XP</strong></div>
            </div>
            <div className={styles.track}><div className={styles.fill} style={{ width: `${nextPercent}%` }} /></div>
            <div className={styles.progressMeta}>
              <span>{activity.currentStreak} / {next.thresholdDays} consecutive days</span>
              <span>{next.remaining} remaining</span>
            </div>
          </div>
        ) : (
          <div className={styles.maxed}>All active streak milestones are unlocked.</div>
        )}

        <div className={styles.milestones}>
          {(activity.milestones || []).map((milestone) => (
            <article className={`${styles.milestone} ${milestone.unlocked ? styles.unlocked : ""}`} key={milestone.code}>
              <div className={styles.milestoneTop}>
                <strong>{milestone.thresholdDays} days</strong>
                <span>+{milestone.xpBonus} XP</span>
              </div>
              <h4>{milestone.title}</h4>
              <p>{milestone.description}</p>
              <small>
                {milestone.unlocked
                  ? `Unlocked${milestone.unlockedAt ? ` ${formatUnlock(milestone.unlockedAt)}` : ""}`
                  : `${milestone.remaining} consecutive days left`}
              </small>
            </article>
          ))}
        </div>

        <p className={styles.note}>
          A verified tool open, prompt save/like, or signed-in visit to this member page counts as daily activity. Repeating actions on the same PH day increases activity count but never grants the daily XP twice.
        </p>
      </div>
    </section>
  );
}
