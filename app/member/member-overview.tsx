"use client";

import Link from "next/link";
import { ArrowUpRight, FileText, Gift, UserRound, Wrench } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import NextBestActionPanel from "./next-best-action-panel";
import { useMemberSession, type MemberPortalResponse } from "./member-auth-gate";
import { visibleOptionalMemberData, type OptionalMemberData } from "./member-overview-state";
import { createRequestCoordinator } from "./request-coordinator";
import styles from "./member-overview.module.css";

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
  profileLoading: boolean;
  progressionLoading: boolean;
  activityLoading: boolean;
};

type MemberOptionalData = OptionalMemberData<
  CommunityProfile,
  ProgressionResponse["progression"],
  ActivityResponse["activity"]
>;

const MemberOverviewContext = createContext<MemberOverviewData | null>(null);

function useMemberOverviewData() {
  const context = useContext(MemberOverviewContext);
  if (!context) throw new Error("Member overview must be rendered inside MemberOverviewProvider.");
  return context;
}

export function useMemberIsAdmin() {
  return useMemberOverviewData().memberPortal?.role === "admin";
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
  const { account } = useMemberSession();
  const accountKey = `${account.role || "none"}:${account.email || ""}`;
  const [optionalData, setOptionalData] = useState<MemberOptionalData>({
    ownerKey: accountKey,
    profile: null,
    progression: null,
    activity: null,
    profileLoading: true,
    progressionLoading: true,
    activityLoading: true,
  });

  const coordinators = useMemo(() => ({
    profile: createRequestCoordinator((signal) => responseBody<ProfileResponse>("/prompts/api/community-profile", signal)),
    progression: createRequestCoordinator((signal) => responseBody<ProgressionResponse>("/prompts/api/progression-profile", signal)),
    activity: createRequestCoordinator((signal) => responseBody<ActivityResponse>("/prompts/api/daily-activity", signal)),
  }), [accountKey]);

  const load = useCallback(() => {
    void coordinators.profile.run().then((outcome) => {
      if (!outcome.current) return;
      setOptionalData((current) => ({
        ...current,
        profile: outcome.status === "fulfilled" ? outcome.value?.profile || null : null,
        profileLoading: false,
      }));
    });
    void coordinators.progression.run().then((outcome) => {
      if (!outcome.current) return;
      setOptionalData((current) => ({
        ...current,
        progression: outcome.status === "fulfilled" ? outcome.value?.progression || null : null,
        progressionLoading: false,
      }));
    });
    void coordinators.activity.run().then((outcome) => {
      if (!outcome.current) return;
      setOptionalData((current) => ({
        ...current,
        activity: outcome.status === "fulfilled" ? outcome.value?.activity || null : null,
        activityLoading: false,
      }));
    });
  }, [coordinators]);

  useEffect(() => {
    setOptionalData({
      ownerKey: accountKey,
      profile: null,
      progression: null,
      activity: null,
      profileLoading: true,
      progressionLoading: true,
      activityLoading: true,
    });
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      coordinators.profile.cancel();
      coordinators.progression.cancel();
      coordinators.activity.cancel();
      window.removeEventListener("focus", onFocus);
    };
  }, [accountKey, coordinators, load]);

  const visibleData = visibleOptionalMemberData(accountKey, optionalData);
  return <MemberOverviewContext.Provider value={{ memberPortal: account, ...visibleData }}>{children}</MemberOverviewContext.Provider>;
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

export function MemberAccountHero() {
  const { memberPortal, profile, profileLoading } = useMemberOverviewData();

  const member = memberPortal?.member;
  const email = memberPortal?.email || "";
  const isAdmin = memberPortal?.role === "admin";
  const isFree = memberPortal?.role === "free";
  const displayName = profile?.displayName || profile?.username || email || (isAdmin ? "Fluxora admin" : "Fluxora member");
  const username = profile?.username || "";
  const expiry = member?.creator_preview_active ? member.creator_preview_expires_at : member?.expires_at;
  const access = member?.effective_access || member?.tier || (isAdmin ? "Admin" : isFree ? "Free" : "—");
  const status = member?.status || (isAdmin ? "Active" : isFree ? "Free account" : "—");

  return <section className={styles.accountHero} aria-labelledby="member-account-heading">
    <div className={styles.identityBlock}>
      {profileLoading && !profile ? <div className={styles.avatarSkeleton} /> : <Avatar profile={profile} email={email} />}
      <div className={styles.identityCopy}>
        <p className={styles.kicker}>Your Fluxora account is ready.</p>
        <h2 id="member-account-heading">{displayName}</h2>
        {username ? <p className={styles.username}>@{username}</p> : null}
        {email ? <p className={styles.email}>{email}</p> : null}
      </div>
    </div>

    <dl className={styles.accountSummary}>
      <div><dt>Current access</dt><dd>{access}</dd></div>
      <div><dt>Status</dt><dd>{status}</dd></div>
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

type MetricProps = { label: string; value: string; note?: string; loading?: boolean };
function Metric({ label, value, note, loading }: MetricProps) {
  if (loading) return <article className={`${styles.metric} ${styles.metricLoading}`}><span /><strong /><small /></article>;
  return <article className={styles.metric}><span>{label}</span><strong>{value}</strong>{note ? <small>{note}</small> : null}</article>;
}

export function MemberOverview() {
  const { memberPortal, progression, activity, progressionLoading, activityLoading } = useMemberOverviewData();
  const member = memberPortal?.member;
  const level = progression?.level?.level;
  const isFree = memberPortal?.role === "free";
  const access = member?.effective_access || member?.tier || (memberPortal?.role === "admin" ? "Admin" : isFree ? "Free" : "—");
  const status = member?.status || (isFree ? "Free account" : undefined);
  const metrics = useMemo(() => [
    { label: "Current access", value: access, note: status },
    { label: "Level", value: typeof level === "number" ? `Level ${level}` : "—", note: progression?.level?.name, loading: progressionLoading },
    { label: "Total XP", value: formatNumber(progression?.xp?.total), loading: progressionLoading },
    { label: "Current streak", value: typeof activity?.currentStreak === "number" ? `${activity.currentStreak} ${activity.currentStreak === 1 ? "day" : "days"}` : "—", loading: activityLoading },
  ], [access, activity?.currentStreak, activityLoading, level, progression?.level?.name, progression?.xp?.total, progressionLoading, status]);

  return <div className={styles.overview}>
    <section className={styles.sectionIntro} aria-labelledby="overview-heading">
      <div><p className={styles.kicker}>Overview</p><h2 id="overview-heading">A clear view of your Fluxora.</h2></div>
      <p>Your access, progress, and the next worthwhile action—without repeating the full dashboard.</p>
    </section>

    <section className={styles.metrics} aria-label="Member account at a glance">
      {metrics.map((metric) => <Metric key={metric.label} {...metric} />)}
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
