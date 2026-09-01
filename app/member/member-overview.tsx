"use client";

import Link from "next/link";
import { ArrowUpRight, FileText, Gift, UserRound, Wrench } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import NextBestActionPanel from "./next-best-action-panel";
import styles from "./member-overview.module.css";

type Member = {
  tier?: string;
  status?: string;
  expires_at?: string | null;
  creator_preview_active?: boolean;
  creator_preview_expires_at?: string | null;
  effective_access?: string;
};

type MemberPortalResponse = {
  role?: "admin" | "member" | "none";
  email?: string;
  member?: Member;
};

type CommunityProfile = {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
};

type ProfileResponse = { profile?: CommunityProfile };

type ProgressionResponse = {
  progression?: {
    xp?: { total?: number };
    level?: { level?: number; name?: string };
  } | null;
};

type ActivityResponse = {
  activity?: { currentStreak?: number } | null;
};

type MemberOverviewData = {
  memberPortal: MemberPortalResponse | null;
  profile: CommunityProfile | null;
  progression: ProgressionResponse["progression"] | null;
  activity: ActivityResponse["activity"] | null;
  loading: boolean;
};

const MemberOverviewContext = createContext<MemberOverviewData | null>(null);

function useMemberOverviewData() {
  const context = useContext(MemberOverviewContext);
  if (!context) throw new Error("Member overview must be rendered inside MemberOverviewProvider.");
  return context;
}

async function responseBody<T>(url: string, signal: AbortSignal): Promise<T | null> {
  const response = await fetch(url, { cache: "no-store", credentials: "include", signal });
  if (!response.ok) return null;
  return (await response.json().catch(() => null)) as T | null;
}

function formatNumber(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(value);
}

function formatExpiry(value: string | null | undefined) {
  if (!value) return "No expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function MemberOverviewProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MemberOverviewData>({
    memberPortal: null,
    profile: null,
    progression: null,
    activity: null,
    loading: true,
  });

  const load = useCallback((signal: AbortSignal) => {
    void Promise.allSettled([
      responseBody<MemberPortalResponse>("/prompts/api/member-portal", signal),
      responseBody<ProfileResponse>("/prompts/api/community-profile", signal),
      responseBody<ProgressionResponse>("/prompts/api/progression-profile", signal),
      responseBody<ActivityResponse>("/prompts/api/daily-activity", signal),
    ]).then((results) => {
      if (signal.aborted) return;
      const valueAt = <T,>(index: number) => results[index].status === "fulfilled" ? results[index].value as T | null : null;
      const profile = valueAt<ProfileResponse>(1)?.profile || null;
      const progression = valueAt<ProgressionResponse>(2)?.progression || null;
      const activity = valueAt<ActivityResponse>(3)?.activity || null;
      setData({
        memberPortal: valueAt<MemberPortalResponse>(0),
        profile,
        progression,
        activity,
        loading: false,
      });
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const onFocus = () => load(controller.signal);
    window.addEventListener("focus", onFocus);
    return () => {
      controller.abort();
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  return <MemberOverviewContext.Provider value={data}>{children}</MemberOverviewContext.Provider>;
}

function Avatar({ profile, email }: { profile: CommunityProfile | null; email?: string }) {
  const initial = (profile?.displayName || profile?.username || email || "F").trim().charAt(0).toUpperCase() || "F";
  return <div className={styles.avatar} aria-label="Member avatar">
    {profile?.avatarUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={profile.avatarUrl} alt="" />
    ) : <span aria-hidden="true">{initial}</span>}
  </div>;
}

function AccountHeroLoading() {
  return <section className={`${styles.accountHero} ${styles.accountLoading}`} aria-label="Loading your account summary">
    <div className={styles.identityBlock}><div className={styles.avatarSkeleton} /><div><span className={styles.lineWide} /><span className={styles.lineShort} /></div></div>
    <div className={styles.summaryList}>{[0, 1, 2].map((item) => <span className={styles.summarySkeleton} key={item} />)}</div>
  </section>;
}

export function MemberAccountHero() {
  const { memberPortal, profile, loading } = useMemberOverviewData();
  if (loading) return <AccountHeroLoading />;

  const member = memberPortal?.member;
  const email = memberPortal?.email || "";
  const isAdmin = memberPortal?.role === "admin";
  const displayName = profile?.displayName || profile?.username || email || (isAdmin ? "Fluxora admin" : "Fluxora member");
  const username = profile?.username || "";
  const expiry = member?.creator_preview_active ? member.creator_preview_expires_at : member?.expires_at;
  const access = member?.effective_access || member?.tier || (isAdmin ? "Admin" : "—");

  return <section className={styles.accountHero} aria-labelledby="member-account-heading">
    <div className={styles.identityBlock}>
      <Avatar profile={profile} email={email} />
      <div className={styles.identityCopy}>
        <p className={styles.kicker}>Your Fluxora account is ready.</p>
        <h2 id="member-account-heading">{displayName}</h2>
        {username ? <p className={styles.username}>@{username}</p> : null}
        {email ? <p className={styles.email}>{email}</p> : null}
      </div>
    </div>

    <dl className={styles.accountSummary}>
      <div><dt>Current access</dt><dd>{access}</dd></div>
      <div><dt>Status</dt><dd>{member?.status || (isAdmin ? "Active" : "—")}</dd></div>
      <div><dt>{member?.creator_preview_active ? "Preview ends" : "Expires"}</dt><dd>{formatExpiry(expiry)}</dd></div>
    </dl>

    <div className={styles.accountActions} aria-label="Account quick actions">
      <Link href="/tools" target="_blank" rel="noopener noreferrer"><Wrench size={15} aria-hidden="true" />Open Tools</Link>
      <Link href="/prompts" target="_blank" rel="noopener noreferrer"><FileText size={15} aria-hidden="true" />Browse Prompts</Link>
      <Link href="/refer"><Gift size={15} aria-hidden="true" />Refer &amp; Earn</Link>
      <Link href={username ? `/prompts/u/${encodeURIComponent(username)}` : "/member?section=profile#community-profile"} target={username ? "_blank" : undefined} rel={username ? "noopener noreferrer" : undefined}><UserRound size={15} aria-hidden="true" />View Profile</Link>
    </div>
  </section>;
}

type MetricProps = { label: string; value: string; note?: string };
function Metric({ label, value, note }: MetricProps) {
  return <article className={styles.metric}><span>{label}</span><strong>{value}</strong>{note ? <small>{note}</small> : null}</article>;
}

export function MemberOverview() {
  const { memberPortal, progression, activity, loading } = useMemberOverviewData();
  const member = memberPortal?.member;
  const level = progression?.level?.level;
  const access = member?.effective_access || member?.tier || (memberPortal?.role === "admin" ? "Admin" : "—");
  const metrics = useMemo(() => [
    { label: "Current access", value: access, note: member?.status || undefined },
    { label: "Level", value: typeof level === "number" ? `Level ${level}` : "—", note: progression?.level?.name },
    { label: "Total XP", value: formatNumber(progression?.xp?.total) },
    { label: "Current streak", value: typeof activity?.currentStreak === "number" ? `${activity.currentStreak} ${activity.currentStreak === 1 ? "day" : "days"}` : "—" },
  ], [access, activity?.currentStreak, level, member?.status, progression?.level?.name, progression?.xp?.total]);

  return <div className={styles.overview}>
    <section className={styles.sectionIntro} aria-labelledby="overview-heading">
      <div><p className={styles.kicker}>Overview</p><h2 id="overview-heading">A clear view of your Fluxora.</h2></div>
      <p>Your access, progress, and the next worthwhile action—without repeating the full dashboard.</p>
    </section>

    <section className={styles.metrics} aria-label="Member account at a glance">
      {loading
        ? [0, 1, 2, 3].map((item) => <article className={`${styles.metric} ${styles.metricLoading}`} key={item}><span /><strong /><small /></article>)
        : metrics.map((metric) => <Metric key={metric.label} {...metric} />)}
    </section>

    <NextBestActionPanel />

    <section className={styles.destinations} aria-labelledby="quick-destinations-heading">
      <div className={styles.destinationHeading}><div><p className={styles.kicker}>Quick destinations</p><h2 id="quick-destinations-heading">Keep moving.</h2></div><p>Open the part of Fluxora you need without leaving the member hub to hunt for it.</p></div>
      <div className={styles.destinationGrid}>
        <Link href="/tools" target="_blank" rel="noopener noreferrer"><Wrench size={19} aria-hidden="true" /><span><strong>Tools</strong><small>Open creator tools</small></span><ArrowUpRight size={17} aria-hidden="true" /></Link>
        <Link href="/prompts" target="_blank" rel="noopener noreferrer"><FileText size={19} aria-hidden="true" /><span><strong>Prompts</strong><small>Browse community prompts</small></span><ArrowUpRight size={17} aria-hidden="true" /></Link>
        <Link href="/refer"><Gift size={19} aria-hidden="true" /><span><strong>Refer &amp; Earn</strong><small>Grow your reward days</small></span><ArrowUpRight size={17} aria-hidden="true" /></Link>
        <Link href="/member?section=profile#community-profile"><UserRound size={19} aria-hidden="true" /><span><strong>Public Profile</strong><small>Manage your creator identity</small></span><ArrowUpRight size={17} aria-hidden="true" /></Link>
      </div>
    </section>
  </div>;
}
