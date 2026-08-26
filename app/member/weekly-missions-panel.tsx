"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./weekly-missions.module.css";

type WeeklyMission = {
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

type WeeklyMissions = {
  periodKey: string;
  rotation: number;
  startsAt: string;
  endsAt: string;
  completedCount: number;
  totalCount: number;
  allComplete: boolean;
  xpEarned: number;
  xpAvailable: number;
  missions: WeeklyMission[];
  generatedAt: string;
};

type ResponseBody = {
  weeklyMissions?: WeeklyMissions | null;
  error?: string;
};

function formatReset(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Monday, 12:00 AM PHT";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
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

export default function WeeklyMissionsPanel() {
  const [weekly, setWeekly] = useState<WeeklyMissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/prompts/api/weekly-missions", {
        cache: "no-store",
        credentials: "include",
      });
      if (response.status === 401) {
        setWeekly(null);
        setError("");
        setLoading(false);
        return;
      }
      const body = (await response.json().catch(() => ({}))) as ResponseBody;
      if (!response.ok) throw new Error(body.error || "Could not load weekly missions.");
      setWeekly(body.weeklyMissions || null);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load weekly missions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const delayed = window.setTimeout(() => void load(), 2000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(delayed);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const completionPercent = useMemo(() => {
    if (!weekly?.totalCount) return 0;
    return Math.max(0, Math.min(100, weekly.completedCount / weekly.totalCount * 100));
  }, [weekly]);

  if (loading) {
    return (
      <section className={styles.shell} aria-label="Fluxora Weekly Missions">
        <div className={styles.card}><p className={styles.loading}>Loading this week’s missions…</p></div>
      </section>
    );
  }

  if (!weekly) {
    return error ? (
      <section className={styles.shell}><div className={styles.card}><p className={styles.error}>{error}</p></div></section>
    ) : null;
  }

  return (
    <section className={styles.shell} aria-labelledby="weekly-missions-heading">
      <div className={styles.card}>
        <div className={styles.hero}>
          <div>
            <p className={styles.kicker}>Weekly Missions · {weekly.periodKey}</p>
            <h2 id="weekly-missions-heading">{weekly.allComplete ? "Weekly missions complete" : "Three goals for this week"}</h2>
            <p>
              {weekly.allComplete
                ? `You completed all ${weekly.totalCount} missions and earned ${formatNumber(weekly.xpEarned)} XP.`
                : "Complete verified Fluxora actions before the weekly reset. XP is awarded automatically."}
            </p>
          </div>
          <div className={weekly.allComplete ? styles.completeBadge : styles.xpBadge}>
            <span>{weekly.allComplete ? "Completed" : "Weekly XP"}</span>
            <strong>{formatNumber(weekly.xpEarned)} / {formatNumber(weekly.xpAvailable)}</strong>
          </div>
        </div>

        <div className={styles.summary}>
          <div>
            <strong>{weekly.completedCount} / {weekly.totalCount}</strong>
            <span>missions complete</span>
          </div>
          <div className={styles.track} aria-label={`${Math.round(completionPercent)}% of weekly missions complete`}>
            <div className={styles.fill} style={{ width: `${completionPercent}%` }} />
          </div>
          <div className={styles.reset}><span>Resets</span><strong>{formatReset(weekly.endsAt)}</strong></div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.missions}>
          {weekly.missions.map((mission) => {
            const progress = Math.min(Number(mission.progress || 0), Number(mission.target || 0));
            const missionPercent = mission.target > 0
              ? Math.max(0, Math.min(100, progress / mission.target * 100))
              : 0;
            return (
              <article className={`${styles.mission} ${mission.completed ? styles.completed : ""}`} key={mission.code}>
                <div className={styles.missionTop}>
                  <span className={styles.slot}>{mission.slotLabel}</span>
                  <span className={styles.reward}>+{formatNumber(mission.rewardXp)} XP</span>
                </div>
                <h3>{mission.title}</h3>
                <p>{mission.description}</p>
                <div className={styles.missionTrack}><div style={{ width: `${mission.completed ? 100 : missionPercent}%` }} /></div>
                <div className={styles.missionFooter}>
                  <strong>{mission.completed ? "✓ Completed" : `${formatNumber(progress)} / ${formatNumber(mission.target)}`}</strong>
                  {!mission.completed && mission.href && <a href={mission.href}>{mission.cta || "Continue"}</a>}
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.footer}>
          <span>Missions rotate every Monday at 12:00 AM Philippine time.</span>
          <button type="button" onClick={() => void load()}>Refresh progress</button>
        </div>
      </div>
    </section>
  );
}
