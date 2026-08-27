"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./weekly-missions.module.css";

type Mission = {
  code: string;
  title: string;
  description: string;
  taskType: string;
  progress: number;
  target: number;
  status: string;
  completed: boolean;
  completedAt: string | null;
  rewardType: string | null;
  rewardAmount: number | null;
  cta: string | null;
  href: string | null;
  progressMode: string;
  claimCapReached: boolean;
  startsAt: string | null;
  endsAt: string | null;
  adminBuilt: boolean;
};

type MissionGroup = {
  completedCount: number;
  totalCount: number;
  missions: Mission[];
};

type MissionsPayload = {
  weekly: MissionGroup & {
    enabled: boolean;
    periodKey: string;
    rotation: number;
    startsAt: string;
    endsAt: string;
    allComplete: boolean;
  };
  special: MissionGroup;
  generatedAt: string;
};

type LegacyWeeklyMission = {
  code: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  status: string;
  completed: boolean;
  completedAt: string | null;
  rewardXp: number;
  cta: string;
  href: string;
};

type LegacyWeeklyMissions = {
  periodKey: string;
  rotation: number;
  startsAt: string;
  endsAt: string;
  completedCount: number;
  totalCount: number;
  allComplete: boolean;
  missions: LegacyWeeklyMission[];
  generatedAt: string;
};

type ResponseBody = {
  missions?: MissionsPayload | null;
  weeklyMissions?: LegacyWeeklyMissions | null;
  error?: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
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

function rewardText(mission: Mission) {
  const amount = Number(mission.rewardAmount || 0);
  if (!amount || !mission.rewardType) return "Reward";
  if (mission.rewardType === "xp") return `+${formatNumber(amount)} XP`;
  if (mission.rewardType === "premium_days") return `+${formatNumber(amount)} Premium day${amount === 1 ? "" : "s"}`;
  return `+${formatNumber(amount)} ${mission.rewardType.replaceAll("_", " ")}`;
}

function legacyToPayload(legacy: LegacyWeeklyMissions): MissionsPayload {
  return {
    weekly: {
      enabled: true,
      periodKey: legacy.periodKey,
      rotation: legacy.rotation,
      startsAt: legacy.startsAt,
      endsAt: legacy.endsAt,
      completedCount: legacy.completedCount,
      totalCount: legacy.totalCount,
      allComplete: legacy.allComplete,
      missions: legacy.missions.map((mission) => ({
        code: mission.code,
        title: mission.title,
        description: mission.description,
        taskType: "weekly",
        progress: mission.progress,
        target: mission.target,
        status: mission.status,
        completed: mission.completed,
        completedAt: mission.completedAt,
        rewardType: "xp",
        rewardAmount: mission.rewardXp,
        cta: mission.cta,
        href: mission.href,
        progressMode: "event_count",
        claimCapReached: false,
        startsAt: null,
        endsAt: null,
        adminBuilt: false,
      })),
    },
    special: { completedCount: 0, totalCount: 0, missions: [] },
    generatedAt: legacy.generatedAt,
  };
}

function MissionCard({ mission, special = false }: { mission: Mission; special?: boolean }) {
  const progress = Math.min(Number(mission.progress || 0), Number(mission.target || 0));
  const percent = mission.target > 0
    ? Math.max(0, Math.min(100, progress / mission.target * 100))
    : 0;
  const closed = mission.status === "closed" || mission.claimCapReached;

  return (
    <article className={`${styles.mission} ${mission.completed ? styles.completed : ""}`}>
      <div className={styles.missionTop}>
        <span className={styles.slot}>{special ? "Special Mission" : mission.adminBuilt ? "Bonus Weekly" : "Weekly Mission"}</span>
        <span className={styles.reward}>{rewardText(mission)}</span>
      </div>
      <h3>{mission.title}</h3>
      <p>{mission.description}</p>
      {special && mission.endsAt ? <p className={styles.deadline}>Ends {formatDate(mission.endsAt)}</p> : null}
      {mission.progressMode === "distinct_tool" ? <p className={styles.ruleNote}>Different tools only — repeats do not count.</p> : null}
      <div className={styles.missionTrack}><div style={{ width: `${mission.completed ? 100 : percent}%` }} /></div>
      <div className={styles.missionFooter}>
        <strong>{mission.completed ? "✓ Completed" : closed ? "Claim limit reached" : `${formatNumber(progress)} / ${formatNumber(mission.target)}`}</strong>
        {!mission.completed && !closed && mission.href ? <a href={mission.href}>{mission.cta || "Continue"}</a> : null}
      </div>
    </article>
  );
}

export default function WeeklyMissionsPanel() {
  const [missions, setMissions] = useState<MissionsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/prompts/api/weekly-missions", {
        cache: "no-store",
        credentials: "include",
      });
      if (response.status === 401) {
        setMissions(null);
        setError("");
        setLoading(false);
        return;
      }
      const body = (await response.json().catch(() => ({}))) as ResponseBody;
      if (!response.ok) throw new Error(body.error || "Could not load missions.");
      const next = body.missions || (body.weeklyMissions ? legacyToPayload(body.weeklyMissions) : null);
      setMissions(next);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load missions.");
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
    if (!missions?.weekly?.totalCount) return 0;
    return Math.max(0, Math.min(100, missions.weekly.completedCount / missions.weekly.totalCount * 100));
  }, [missions]);

  if (loading) {
    return (
      <section className={styles.shell} aria-label="Fluxora Missions">
        <div className={styles.card}><p className={styles.loading}>Loading missions…</p></div>
      </section>
    );
  }

  if (!missions) {
    return error ? (
      <section className={styles.shell}><div className={styles.card}><p className={styles.error}>{error}</p></div></section>
    ) : null;
  }

  const weekly = missions.weekly;
  const special = missions.special;

  return (
    <section className={styles.shell} aria-labelledby="weekly-missions-heading">
      <div className={styles.card}>
        <div className={styles.hero}>
          <div>
            <p className={styles.kicker}>Weekly Missions · {weekly.periodKey}</p>
            <h2 id="weekly-missions-heading">{weekly.allComplete ? "Weekly missions complete" : "Goals for this week"}</h2>
            <p>
              {weekly.allComplete
                ? `You completed all ${weekly.totalCount} weekly missions.`
                : "Complete verified Fluxora actions before the weekly reset. Rewards are awarded automatically."}
            </p>
          </div>
          <div className={weekly.allComplete ? styles.completeBadge : styles.xpBadge}>
            <span>{weekly.allComplete ? "Completed" : "Weekly progress"}</span>
            <strong>{weekly.completedCount} / {weekly.totalCount}</strong>
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
          <div className={styles.reset}><span>Resets</span><strong>{formatDate(weekly.endsAt)}</strong></div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.missions}>
          {weekly.missions.map((mission) => <MissionCard key={mission.code} mission={mission} />)}
        </div>

        <div className={styles.footer}>
          <span>Weekly missions reset Monday at 12:00 AM PHT — no extra daily grind required.</span>
          <button type="button" onClick={() => void load()}>Refresh progress</button>
        </div>
      </div>

      {special.totalCount > 0 ? <div className={`${styles.card} ${styles.specialCard}`}>
        <div className={styles.hero}>
          <div>
            <p className={styles.kicker}>Special Missions</p>
            <h2>Limited campaigns</h2>
            <p>Launches and special workflows can appear here for a limited time. Each campaign has its own verified goal, eligibility, reward, and claim limit.</p>
          </div>
          <div className={special.completedCount === special.totalCount ? styles.completeBadge : styles.xpBadge}>
            <span>Special progress</span>
            <strong>{special.completedCount} / {special.totalCount}</strong>
          </div>
        </div>
        <div className={styles.missions}>
          {special.missions.map((mission) => <MissionCard key={mission.code} mission={mission} special />)}
        </div>
      </div> : null}
    </section>
  );
}
