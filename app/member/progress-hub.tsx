"use client";

import { useEffect, useMemo, useState } from "react";
import ProgressionPanel from "./progression-panel";
import CreatorSeasonPanel from "./creator-season-panel";
import WeeklyMissionsPanel from "./weekly-missions-panel";
import MonthlyChallengePanel from "./monthly-challenge-panel";
import DailyActivityPanel from "./daily-activity-panel";
import StarterJourneyPanel from "./starter-journey-panel";
import FirstWinPanel from "./first-win-panel";
import styles from "./progress-hub.module.css";

type Flags = {
  weeklyMissions: boolean;
  monthlyChallenge: boolean;
  creatorSeason: boolean;
  leaderboard: boolean;
  hallOfFame: boolean;
  legacyBadges: boolean;
};

type FlagsResponse = {
  flags?: Flags;
  canManage?: boolean;
  error?: string;
};

type Tab = "overview" | "missions" | "season" | "getting-started";

const DEFAULT_FLAGS: Flags = {
  weeklyMissions: true,
  monthlyChallenge: true,
  creatorSeason: true,
  leaderboard: true,
  hallOfFame: true,
  legacyBadges: true,
};

const labels: Array<{ key: keyof Flags; label: string; detail: string }> = [
  { key: "weeklyMissions", label: "Weekly Missions", detail: "Stops new weekly mission routing and hides the weekly panel" },
  { key: "monthlyChallenge", label: "Monthly Challenge", detail: "Stops new monthly routing/tool progress and hides the monthly panel" },
  { key: "creatorSeason", label: "Creator Season", detail: "Hides the seasonal progress surface" },
  { key: "leaderboard", label: "Leaderboards", detail: "Hides current/all-time public rankings" },
  { key: "hallOfFame", label: "Hall of Fame", detail: "Hides completed-season Hall of Fame" },
  { key: "legacyBadges", label: "Legacy Badges", detail: "Hides season collectibles without deleting earned records" },
];

function ProgressFixture() {
  const [tab, setTab] = useState<Tab>("overview");
  const fixtureTabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Overview" }, { id: "missions", label: "Missions" }, { id: "season", label: "Season" }, { id: "getting-started", label: "Getting Started" },
  ];
  return <section className={styles.shell} id="progress-hub" aria-labelledby="progress-hub-title">
    <div className={styles.header}>
      <div><p className={styles.kicker}>Fluxora Progress Â· QA fixture</p><h2 id="progress-hub-title">Track your activity, rewards, and milestones.</h2><p>Preview-only mock progression data. No events, rewards, or protected APIs are called.</p></div>
      <span className={styles.fixtureStatus}>Level 7 Â· 2,480 XP</span>
    </div>
    <nav className={styles.tabs} aria-label="Progress fixture sections">
      {fixtureTabs.map((item) => <button key={item.id} type="button" data-active={tab === item.id ? "true" : "false"} onClick={() => setTab(item.id)}>{item.label}</button>)}
    </nav>
    <div className={styles.fixtureContent}>
      {tab === "overview" && <><div className={styles.fixtureMetrics}><article><span>Current level</span><strong>7</strong><small>Momentum Builder</small></article><article><span>Total XP</span><strong>2,480</strong><small>520 XP to Level 8</small></article><article><span>Current streak</span><strong>12 days</strong><small>Active today</small></article></div><section className={styles.fixturePanel}><p className={styles.kicker}>Achievements</p><h3>6 of 12 unlocked</h3><div className={styles.fixtureRows}><div><b>First Win</b><span>Completed</span></div><div><b>Prompt contributor</b><span>4 / 5 prompts</span></div><div><b>Seven-day streak</b><span>Completed</span></div></div></section></>}
      {tab === "missions" && <><section className={styles.fixturePanel}><p className={styles.kicker}>Weekly Missions</p><h3>2 of 3 complete</h3><div className={styles.fixtureRows}><div><b>Open two Fluxora tools</b><span>2 / 2 Â· +40 XP</span></div><div><b>Save community prompts</b><span>3 / 5 Â· +30 XP</span></div><div><b>Share a helpful resource</b><span>Completed Â· +20 XP</span></div></div></section><section className={styles.fixturePanel}><p className={styles.kicker}>Monthly Challenge</p><h3>Creator momentum</h3><div className={styles.fixtureProgress}><span style={{ width: "50%" }} /></div><p>2 of 4 objectives complete Â· +180 XP available</p></section></>}
      {tab === "season" && <section className={styles.fixturePanel}><p className={styles.kicker}>Creator Season</p><h3>Season 3 Â· Rising Creator</h3><p>1,240 Season XP Â· 360 XP to the next rank.</p><div className={styles.fixtureProgress}><span style={{ width: "64%" }} /></div><a href="/prompts/leaderboard">View season leaderboard</a></section>}
      {tab === "getting-started" && <section className={styles.fixturePanel}><p className={styles.kicker}>Starter Journey</p><h3>3 of 4 steps complete</h3><div className={styles.fixtureRows}><div><b>Set up your profile</b><span>Completed</span></div><div><b>Explore a tool</b><span>Completed</span></div><div><b>Save your first prompt</b><span>Completed</span></div><div><b>Create your first useful output</b><span>+3 Premium days</span></div></div></section>}
    </div>
  </section>;
}

export default function ProgressHub({ fixture = false }: { fixture?: boolean }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [flags, setFlags] = useState<Flags>(DEFAULT_FLAGS);
  const [canManage, setCanManage] = useState(false);
  const [saving, setSaving] = useState<keyof Flags | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (fixture) return;
    fetch("/prompts/api/progression-features", { cache: "no-store", credentials: "include" })
      .then(async (response) => ({ response, body: (await response.json().catch(() => ({}))) as FlagsResponse }))
      .then(({ response, body }) => {
        if (response.ok && body.flags) setFlags({ ...DEFAULT_FLAGS, ...body.flags });
        setCanManage(Boolean(body.canManage));
      })
      .catch(() => undefined);
  }, [fixture]);

  const availableTabs = useMemo(() => {
    const result: Array<{ id: Tab; label: string; note: string }> = [
      { id: "overview", label: "Overview", note: "Level, XP & streak" },
      { id: "missions", label: "Missions", note: "Weekly, special & monthly" },
      { id: "season", label: "Season", note: "Season rank & leaderboard" },
      { id: "getting-started", label: "Getting started", note: "Starter Journey & First Win" },
    ];
    return result;
  }, []);

  async function toggleFeature(key: keyof Flags) {
    if (!canManage || saving) return;
    const next = !flags[key];
    setSaving(key);
    setMessage("");
    try {
      const response = await fetch("/prompts/api/progression-features", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next }),
      });
      const body = (await response.json().catch(() => ({}))) as FlagsResponse;
      if (!response.ok || !body.flags) throw new Error(body.error || "Could not update feature flag.");
      setFlags({ ...DEFAULT_FLAGS, ...body.flags });
      setMessage(`${labels.find((item) => item.key === key)?.label || key} ${next ? "enabled" : "disabled"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update feature flag.");
    } finally {
      setSaving(null);
    }
  }

  if (fixture) return <ProgressFixture />;

  return (
    <section className={styles.shell} id="progress-hub" aria-labelledby="progress-hub-title">
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Fluxora Progress</p>
          <h2 id="progress-hub-title">Progress Hub</h2>
          <p>One place for your lifetime progress, missions, season, and onboarding goals.</p>
        </div>
        {flags.leaderboard ? <a className={styles.leaderboardLink} href="/prompts/leaderboard">View leaderboard</a> : null}
      </div>

      <nav className={styles.tabs} aria-label="Progress Hub sections">
        {availableTabs.map((item) => (
          <button key={item.id} type="button" data-active={tab === item.id ? "true" : "false"} onClick={() => setTab(item.id)}>
            <strong>{item.label}</strong><span>{item.note}</span>
          </button>
        ))}
      </nav>

      <div className={styles.content}>
        {tab === "overview" ? <>
          <ProgressionPanel />
          <DailyActivityPanel />
        </> : null}

        {tab === "missions" ? <>
          {flags.weeklyMissions ? <WeeklyMissionsPanel /> : <div className={styles.disabled}>Weekly Missions are currently disabled. Existing progress and rewards are preserved. Active special campaigns remain independently controlled by their publish/pause state.</div>}
          {flags.monthlyChallenge ? <MonthlyChallengePanel /> : <div className={styles.disabled}>Monthly Challenge is currently disabled. Existing progress and rewards are preserved.</div>}
        </> : null}

        {tab === "season" ? <>
          {flags.creatorSeason ? <CreatorSeasonPanel /> : <div className={styles.disabled}>Creator Season is currently disabled. Lifetime XP and levels are unchanged.</div>}
          {flags.leaderboard ? <div className={styles.seasonActions}><a href="/prompts/leaderboard">Open public leaderboard</a><a href="#community-profile">Manage public participation</a></div> : null}
        </> : null}

        {tab === "getting-started" ? <>
          <StarterJourneyPanel />
          <FirstWinPanel />
        </> : null}
      </div>

      {canManage ? <details className={styles.admin}>
        <summary>Admin Â· Progression feature switches</summary>
        <p>Switches preserve existing data. Weekly/Monthly switches also stop new routed mission progress while disabled. Special campaigns are controlled from the Admin Task Builder.</p>
        <div className={styles.flagGrid}>
          {labels.map((item) => <label key={item.key}>
            <span><strong>{item.label}</strong><small>{item.detail}</small></span>
            <button type="button" role="switch" aria-checked={flags[item.key]} data-on={flags[item.key] ? "true" : "false"} disabled={Boolean(saving)} onClick={() => void toggleFeature(item.key)}>
              {saving === item.key ? "Savingâ¦" : flags[item.key] ? "ON" : "OFF"}
            </button>
          </label>)}
        </div>
        {message ? <div className={styles.message}>{message}</div> : null}
      </details> : null}
    </section>
  );
}
