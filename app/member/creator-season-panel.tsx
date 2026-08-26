"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./creator-season.module.css";

type SeasonRank = {
  rankOrder: number;
  code: string;
  name: string;
  description: string;
  xpRequired: number;
  badgeLabel: string;
  unlocked?: boolean;
  unlockedAt?: string | null;
};

type SeasonLegacyBadge = {
  badgeType: "season_rank" | "hall_of_fame" | "season_champion";
  badgeCode: string;
  badgeLabel: string;
  title: string;
  description: string;
  placement: number | null;
  seasonXp: number;
  unlockedAt: string;
  season: { code: string; name: string; seasonNumber: number; startsAt: string; endsAt: string };
  rank: null | { code: string; name: string; rankOrder: number; badgeLabel: string };
};

type CreatorSeason = {
  active: boolean;
  season?: {
    code: string;
    name: string;
    description: string;
    startsAt: string;
    endsAt: string;
    seasonNumber: number;
  };
  seasonXp?: number;
  currentRank?: SeasonRank;
  nextRank?: SeasonRank | null;
  progressPercent?: number;
  xpIntoRank?: number;
  xpToNext?: number;
  unlockedCount?: number;
  totalRanks?: number;
  ranks?: SeasonRank[];
  unlockHistory?: Array<{ code: string; name: string; badgeLabel: string; unlockedAt: string }>;
  legacyBadges?: { count: number; items: SeasonLegacyBadge[] };
  generatedAt?: string;
};

type ResponseBody = {
  creatorSeason?: CreatorSeason | null;
  error?: string;
};

function formatNumber(value: number | undefined) {
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatEnds(value: string | undefined) {
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

export default function CreatorSeasonPanel() {
  const [profile, setProfile] = useState<CreatorSeason | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/prompts/api/creator-season", {
        cache: "no-store",
        credentials: "include",
      });
      if (response.status === 401) {
        setProfile(null);
        setError("");
        setLoading(false);
        return;
      }
      const body = (await response.json().catch(() => ({}))) as ResponseBody;
      if (!response.ok) throw new Error(body.error || "Could not load creator season.");
      setProfile(body.creatorSeason || null);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load creator season.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const delayed = window.setTimeout(() => void load(), 2400);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(delayed);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const progress = useMemo(
    () => Math.max(0, Math.min(100, Number(profile?.progressPercent || 0))),
    [profile]
  );

  if (loading) {
    return (
      <section className={styles.shell} aria-label="Fluxora Creator Season">
        <div className={styles.card}><p className={styles.loading}>Loading your creator season…</p></div>
      </section>
    );
  }

  if (!profile?.active || !profile.season || !profile.currentRank) {
    return error ? (
      <section className={styles.shell}><div className={styles.card}><p className={styles.error}>{error}</p></div></section>
    ) : null;
  }

  const maxRank = !profile.nextRank;
  const legacy = profile.legacyBadges?.items || [];

  return (
    <section className={styles.shell} aria-labelledby="creator-season-heading">
      <div className={styles.card}>
        <div className={styles.hero}>
          <div>
            <p className={styles.kicker}>Creator Season · Season {profile.season.seasonNumber}</p>
            <h2 id="creator-season-heading">{profile.season.name}</h2>
            <p>{profile.season.description}</p>
          </div>
          <div className={styles.rankBadge}>
            <span>Current rank</span>
            <strong>{profile.currentRank.name}</strong>
            <small>{profile.currentRank.badgeLabel}</small>
          </div>
        </div>

        <div className={styles.stats}>
          <div><span>Season XP</span><strong>{formatNumber(profile.seasonXp)}</strong></div>
          <div><span>Ranks unlocked</span><strong>{formatNumber(profile.unlockedCount)} / {formatNumber(profile.totalRanks)}</strong></div>
          <div><span>Season ends</span><strong>{formatEnds(profile.season.endsAt)}</strong></div>
        </div>

        <div className={styles.progressBlock}>
          <div className={styles.progressCopy}>
            <div>
              <span>{maxRank ? "Highest seasonal rank reached" : `Progress to ${profile.nextRank?.name}`}</span>
              <strong>{maxRank ? "Apex complete" : `${formatNumber(profile.xpToNext)} XP to go`}</strong>
            </div>
            <b>{Math.round(progress)}%</b>
          </div>
          <div className={styles.track} aria-label={`${Math.round(progress)}% toward next seasonal rank`}>
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.ladder}>
          {(profile.ranks || []).map((rank) => (
            <article
              key={rank.code}
              className={`${styles.rank} ${rank.unlocked ? styles.unlocked : ""} ${rank.code === profile.currentRank?.code ? styles.current : ""}`}
            >
              <span className={styles.badge}>{rank.badgeLabel}</span>
              <div>
                <strong>{rank.name}</strong>
                <small>{formatNumber(rank.xpRequired)} XP</small>
              </div>
              <b>{rank.unlocked ? "✓" : "○"}</b>
            </article>
          ))}
        </div>

        {legacy.length ? <div className={styles.legacySection}>
          <div className={styles.legacyHeading}>
            <div><p className={styles.kicker}>Permanent collection</p><h3>Season Legacy</h3></div>
            <span>{profile.legacyBadges?.count || legacy.length} collectible{(profile.legacyBadges?.count || legacy.length) === 1 ? "" : "s"}</span>
          </div>
          <div className={styles.legacyGrid}>{legacy.map((item) => <article
            key={item.badgeCode}
            className={`${styles.legacyCard} ${item.badgeType === "season_champion" ? styles.legacyChampion : item.badgeType === "hall_of_fame" ? styles.legacyHall : ""}`}
          >
            <div className={styles.legacyTop}><b>{item.badgeLabel}</b><small>{item.season.name}</small></div>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
            <div className={styles.legacyMeta}><span>{formatNumber(item.seasonXp)} XP</span>{item.placement ? <span>#{item.placement} finish</span> : item.rank ? <span>{item.rank.name}</span> : null}</div>
          </article>)}</div>
        </div> : null}

        <div className={styles.footer}>
          <span>Every verified Fluxora XP grant counts toward the season. Seasonal XP resets next season; lifetime XP and levels stay intact.</span>
          <div className={styles.footerActions}>
            <a className={styles.leaderboardLink} href="/prompts/leaderboard">View season leaderboard</a>
            <button type="button" onClick={() => void load()}>Refresh season</button>
          </div>
        </div>
      </div>
    </section>
  );
}
