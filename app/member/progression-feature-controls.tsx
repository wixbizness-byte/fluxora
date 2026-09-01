"use client";

import { useEffect, useState } from "react";
import styles from "./progression-feature-controls.module.css";

type Flags = { weeklyMissions: boolean; monthlyChallenge: boolean; creatorSeason: boolean; leaderboard: boolean; hallOfFame: boolean; legacyBadges: boolean };
type FlagsResponse = { flags?: Flags; canManage?: boolean; error?: string };
const defaults: Flags = { weeklyMissions: true, monthlyChallenge: true, creatorSeason: true, leaderboard: true, hallOfFame: true, legacyBadges: true };
const labels: Array<{ key: keyof Flags; label: string; detail: string }> = [
  { key: "weeklyMissions", label: "Weekly Missions", detail: "Stops new weekly mission routing and hides the weekly panel." },
  { key: "monthlyChallenge", label: "Monthly Challenge", detail: "Stops new monthly routing and tool progress." },
  { key: "creatorSeason", label: "Creator Season", detail: "Hides the seasonal progress surface." },
  { key: "leaderboard", label: "Leaderboards", detail: "Hides current and all-time public rankings." },
  { key: "hallOfFame", label: "Hall of Fame", detail: "Hides completed-season Hall of Fame." },
  { key: "legacyBadges", label: "Legacy Badges", detail: "Hides season collectibles without deleting earned records." },
];

export default function ProgressionFeatureControls() {
  const [flags, setFlags] = useState(defaults);
  const [canManage, setCanManage] = useState(false);
  const [saving, setSaving] = useState<keyof Flags | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/prompts/api/progression-features", { cache: "no-store", credentials: "include" })
      .then(async (response) => ({ response, body: (await response.json().catch(() => ({}))) as FlagsResponse }))
      .then(({ response, body }) => {
        if (response.ok && body.flags) setFlags({ ...defaults, ...body.flags });
        setCanManage(Boolean(body.canManage));
      })
      .catch(() => undefined);
  }, []);

  async function toggleFeature(key: keyof Flags) {
    if (!canManage || saving) return;
    const next = !flags[key];
    setSaving(key);
    setMessage("");
    try {
      const response = await fetch("/prompts/api/progression-features", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: next }) });
      const body = (await response.json().catch(() => ({}))) as FlagsResponse;
      if (!response.ok || !body.flags) throw new Error(body.error || "Could not update feature flag.");
      setFlags({ ...defaults, ...body.flags });
      setMessage(`${labels.find((item) => item.key === key)?.label || key} ${next ? "enabled" : "disabled"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update feature flag.");
    } finally { setSaving(null); }
  }

  if (!canManage) return null;
  return <section className={styles.panel} aria-labelledby="progression-feature-controls-heading">
    <p className={styles.kicker}>Progression controls</p><h2 id="progression-feature-controls-heading">Feature switches</h2>
    <p className={styles.description}>Switches preserve existing data. Weekly and monthly switches also stop new routed mission progress while disabled.</p>
    <div className={styles.grid}>{labels.map((item) => <label key={item.key}><span><strong>{item.label}</strong><small>{item.detail}</small></span><button type="button" role="switch" aria-checked={flags[item.key]} data-on={flags[item.key] ? "true" : "false"} disabled={Boolean(saving)} onClick={() => void toggleFeature(item.key)}>{saving === item.key ? "Saving…" : flags[item.key] ? "ON" : "OFF"}</button></label>)}</div>
    {message ? <p className={styles.message} role="status">{message}</p> : null}
  </section>;
}
