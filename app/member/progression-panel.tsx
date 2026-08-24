"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./progression-panel.module.css";

type Achievement = {
  code: string;
  name: string;
  description: string;
  category: string;
  badgeLabel: string;
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt: string | null;
  displayOrder: number;
};

type Level = {
  level: number;
  name: string;
  description: string;
  xpRequired: number;
};

type Progression = {
  xp: {
    total: number;
    currentLevelXp: number;
    nextLevelXp: number | null;
    progressPercent: number;
    xpIntoLevel: number;
    xpToNext: number;
  };
  level: Level;
  nextLevel: Level | null;
  achievements: {
    unlockedCount: number;
    totalCount: number;
    items: Achievement[];
  };
  updatedAt: string;
};

type ProgressionResponse = {
  gmail?: string;
  progression?: Progression | null;
  error?: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

export default function ProgressionPanel() {
  const [progression, setProgression] = useState<Progression | null>(null);
  const [gmail, setGmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([]);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/prompts/api/progression-profile", {
        cache: "no-store",
        credentials: "include",
      });
      if (response.status === 401) {
        setProgression(null);
        setLoading(false);
        return;
      }
      const body = (await response.json().catch(() => ({}))) as ProgressionResponse;
      if (!response.ok) throw new Error(body.error || "Could not load progression.");

      const next = body.progression || null;
      const nextGmail = String(body.gmail || "").trim().toLowerCase();
      setGmail(nextGmail);
      setProgression(next);
      setError("");

      if (next && nextGmail && typeof window !== "undefined") {
        const unlockedCodes = next.achievements.items.filter((item) => item.unlocked).map((item) => item.code);
        const key = `fluxora:achievement-seen:${nextGmail}`;
        const previousRaw = window.localStorage.getItem(key);
        if (previousRaw) {
          let previous: string[] = [];
          try { previous = JSON.parse(previousRaw) as string[]; } catch { previous = []; }
          const previousSet = new Set(previous);
          const fresh = next.achievements.items.filter((item) => item.unlocked && !previousSet.has(item.code));
          if (fresh.length) setNewUnlocks(fresh);
        }
        window.localStorage.setItem(key, JSON.stringify(unlockedCodes));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load progression.");
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

  const achievements = useMemo(() => progression?.achievements.items || [], [progression]);

  if (loading) {
    return (
      <section className={styles.shell} aria-label="Fluxora progression">
        <div className={styles.card}><p className={styles.loading}>Loading your level and achievements…</p></div>
      </section>
    );
  }

  if (!progression) return error ? (
    <section className={styles.shell}><div className={styles.card}><div className={styles.error}>{error}</div></div></section>
  ) : null;

  return (
    <section className={styles.shell} aria-labelledby="progression-heading">
      <div className={styles.card}>
        {newUnlocks.length > 0 && (
          <div className={styles.celebration} role="status">
            <div>
              <span>Achievement unlocked</span>
              <strong>{newUnlocks.map((item) => item.name).join(", ")}</strong>
            </div>
            <button type="button" onClick={() => setNewUnlocks([])}>Dismiss</button>
          </div>
        )}

        <div className={styles.hero}>
          <div>
            <p className={styles.kicker}>Fluxora progression</p>
            <h2 id="progression-heading">Level {progression.level.level} · {progression.level.name}</h2>
            <p>{progression.level.description}</p>
          </div>
          <div className={styles.xpBlock}>
            <span>Total XP</span>
            <strong>{formatNumber(progression.xp.total)}</strong>
            <small>{progression.nextLevel ? `${formatNumber(progression.xp.xpToNext)} XP to ${progression.nextLevel.name}` : "Current max level"}</small>
          </div>
        </div>

        <div className={styles.levelTrackWrap}>
          <div className={styles.levelMeta}>
            <strong>{progression.level.name}</strong>
            <span>{progression.nextLevel ? progression.nextLevel.name : "Max level"}</span>
          </div>
          <div className={styles.track} aria-label={`${progression.xp.progressPercent}% to next level`}>
            <div className={styles.fill} style={{ width: `${Math.max(0, Math.min(100, Number(progression.xp.progressPercent || 0)))}%` }} />
          </div>
          <div className={styles.levelMeta}>
            <span>{formatNumber(progression.xp.xpIntoLevel)} XP earned in this level</span>
            <span>{Math.round(Number(progression.xp.progressPercent || 0))}%</span>
          </div>
        </div>

        <div className={styles.achievementHeading}>
          <div>
            <p className={styles.kicker}>Achievements</p>
            <h3>{progression.achievements.unlockedCount} of {progression.achievements.totalCount} unlocked</h3>
          </div>
          <button type="button" onClick={() => void load()}>Refresh</button>
        </div>

        <div className={styles.grid}>
          {achievements.map((achievement) => {
            const pct = Math.max(0, Math.min(100, achievement.target > 0 ? (achievement.progress / achievement.target) * 100 : 0));
            return (
              <article className={`${styles.achievement} ${achievement.unlocked ? styles.unlocked : styles.locked}`} key={achievement.code}>
                <div className={styles.badge}>{achievement.badgeLabel}</div>
                <div className={styles.achievementCopy}>
                  <span className={styles.category}>{achievement.category}</span>
                  <strong>{achievement.name}</strong>
                  <p>{achievement.description}</p>
                  {achievement.unlocked ? (
                    <small>Unlocked {formatDate(achievement.unlockedAt)}</small>
                  ) : (
                    <>
                      <div className={styles.miniTrack}><div style={{ width: `${pct}%` }} /></div>
                      <small>{formatNumber(achievement.progress)} / {formatNumber(achievement.target)}</small>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <p className={styles.note}>XP comes from real Fluxora actions and is recorded in the same append-only reward ledger as other progression rewards.</p>
        {gmail && <span className={styles.srOnly}>Progression account {gmail}</span>}
      </div>
    </section>
  );
}
