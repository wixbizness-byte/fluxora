"use client";

import { ArrowUpRight, BookOpenText, Gift, Sparkles, UserRound, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import NextBestActionPanel from "./next-best-action-panel";
import styles from "./member-overview.module.css";

type MemberPortalResponse = {
  email?: string;
  member?: {
    tier?: string;
    status?: string;
    effective_access?: string;
    expires_at?: string | null;
    creator_preview_active?: boolean;
    creator_preview_expires_at?: string | null;
  };
};

type ProfileResponse = {
  profile?: {
    displayName?: string;
    username?: string;
    avatarUrl?: string;
  };
};

type ProgressionResponse = {
  progression?: {
    xp?: { total?: number };
    level?: { level?: number; name?: string };
  } | null;
};

type ActivityResponse = {
  activity?: { currentStreak?: number } | null;
};

type WalletResponse = {
  wallet?: { availablePremiumDays?: number } | null;
};

type DashboardData = {
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  access: string;
  status: string;
  expiresAt: string | null;
  level: number | null;
  levelName: string;
  xp: number | null;
  streak: number | null;
  rewardDays: number | null;
};

function formatDate(value: string | null) {
  if (!value) return "No expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No expiry";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatNumber(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(value);
}

async function readJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store", credentials: "include" });
    if (!response.ok) return null;
    return (await response.json().catch(() => null)) as T | null;
  } catch {
    return null;
  }
}

export default function MemberOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [memberBody, profileBody, progressionBody, activityBody, walletBody] = await Promise.all([
      readJson<MemberPortalResponse>("/prompts/api/member-portal"),
      readJson<ProfileResponse>("/prompts/api/community-profile"),
      readJson<ProgressionResponse>("/prompts/api/progression-profile"),
      readJson<ActivityResponse>("/prompts/api/daily-activity"),
      readJson<WalletResponse>("/prompts/api/reward-wallet"),
    ]);

    const member = memberBody?.member;
    const profile = profileBody?.profile;
    const progression = progressionBody?.progression;
    const previewActive = Boolean(member?.creator_preview_active);

    setData({
      email: String(memberBody?.email || ""),
      displayName: String(profile?.displayName || "Fluxora member"),
      username: String(profile?.username || ""),
      avatarUrl: String(profile?.avatarUrl || ""),
      access: String(member?.effective_access || member?.tier || "Member"),
      status: String(member?.status || "active"),
      expiresAt: previewActive ? member?.creator_preview_expires_at || member?.expires_at || null : member?.expires_at || null,
      level: typeof progression?.level?.level === "number" ? progression.level.level : null,
      levelName: String(progression?.level?.name || ""),
      xp: typeof progression?.xp?.total === "number" ? progression.xp.total : null,
      streak: typeof activityBody?.activity?.currentStreak === "number" ? activityBody.activity.currentStreak : null,
      rewardDays: typeof walletBody?.wallet?.availablePremiumDays === "number" ? walletBody.wallet.availablePremiumDays : null,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const initials = useMemo(() => {
    const source = data?.displayName || data?.email || "F";
    return source.trim().charAt(0).toUpperCase() || "F";
  }, [data]);

  if (loading || !data) {
    return <section className={styles.loading}>Loading your Fluxora dashboard…</section>;
  }

  const quickLinks = [
    { href: "/tools", label: "Open Tools", note: "Build with Fluxora", icon: Wrench },
    { href: "/prompts", label: "Browse Prompts", note: "Find your next idea", icon: BookOpenText },
    { href: "/refer", label: "Refer & Earn", note: "Earn access and rewards", icon: Gift },
    { href: data.username ? `/prompts/u/${encodeURIComponent(data.username)}` : "/member?section=profile", label: "View Profile", note: "Open your creator identity", icon: UserRound },
  ] as const;

  return (
    <div className={styles.stack}>
      <section className={styles.identityCard}>
        <div className={styles.identityMain}>
          <div className={styles.avatar} aria-hidden="true">
            {data.avatarUrl ? <img src={data.avatarUrl} alt="" /> : <span>{initials}</span>}
          </div>
          <div className={styles.identityCopy}>
            <div className={styles.topline}>
              <span className={styles.accessBadge}>{data.access}</span>
              <span className={styles.statusBadge}>{data.status}</span>
            </div>
            <h2>{data.displayName}</h2>
            <p>{data.email || "Fluxora member account"}</p>
          </div>
        </div>
        <div className={styles.expiry}>
          <span>Access expires</span>
          <strong>{formatDate(data.expiresAt)}</strong>
        </div>
      </section>

      <section className={styles.statsGrid} aria-label="Fluxora account summary">
        <article><span>Level</span><strong>{data.level === null ? "—" : `Lv. ${data.level}`}</strong><small>{data.levelName || "Fluxora progression"}</small></article>
        <article><span>Total XP</span><strong>{formatNumber(data.xp)}</strong><small>Lifetime progression</small></article>
        <article><span>Current streak</span><strong>{data.streak === null ? "—" : `${data.streak}d`}</strong><small>Daily activity</small></article>
        <article><span>Reward days</span><strong>{formatNumber(data.rewardDays)}</strong><small>Premium days available</small></article>
      </section>

      <section className={styles.quickSection}>
        <div className={styles.sectionHeading}>
          <div><span>Quick access</span><h2>Jump back into Fluxora.</h2></div>
          <Sparkles size={20} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div className={styles.quickGrid}>
          {quickLinks.map(({ href, label, note, icon: Icon }) => (
            <a href={href} className={styles.quickCard} key={label}>
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              <div><strong>{label}</strong><span>{note}</span></div>
              <ArrowUpRight size={17} strokeWidth={1.9} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <NextBestActionPanel />
    </div>
  );
}
