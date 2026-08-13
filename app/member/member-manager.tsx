"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import styles from "./member.module.css";
import layout from "./member-manager-layout.module.css";

type Member = {
  id: string;
  access_code: string;
  gmail: string;
  tier: "Tool" | "Premium" | "Creator";
  status: string;
  max_uses: number | null;
  use_count: number | null;
  max_devices: number;
  device_count?: number;
  canvas_count?: number;
  canvas_limit?: number | null;
  expires_at: string | null;
  notes: string | null;
  account_link: string | null;
  is_affiliate?: boolean;
};

type Activity = {
  member_id: string;
  access_code: string;
  gmail: string;
  tier: "Tool" | "Premium" | "Creator";
  status: string;
  uses: number;
  last_used_at: string;
  canvas_devices: number;
};

type ApiResponse = {
  members?: Member[];
  member?: Member;
  activity?: Activity[];
  activityTimezone?: string;
  adminEmail?: string;
  message?: string;
  error?: string;
};

type MemberFilter = "all" | "trial" | "members" | "tool" | "premium" | "creator" | "affiliate";

const PAGE_SIZE = 10;
const MEMBER_STATUSES = [
  "active", "3 hours", "1 day", "1 week", "1 month", "3 months", "6 months", "1 year",
  "inactive", "blocked",
];

function formatLocalDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function displayDate(value: string | null) {
  if (!value) return "No expiry";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No expiry" : date.toLocaleString();
}

function phTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function payloadFromForm(form: HTMLFormElement) {
  const data = new FormData(form);
  const tier = String(data.get("tier") || "Premium");
  return {
    access_code: String(data.get("access_code") || "").trim(),
    gmail: String(data.get("gmail") || "").trim(),
    tier,
    status: String(data.get("status") || "active"),
    max_uses: String(data.get("max_uses") || "").trim() || null,
    max_devices: tier === "Tool" ? "2" : (String(data.get("max_devices") || "5").trim() || "5"),
    expires_at: String(data.get("expires_at") || "").trim() || null,
    notes: String(data.get("notes") || "").trim() || null,
    account_link: String(data.get("account_link") || "").trim() || null,
  };
}

function MemberFields({ member }: { member?: Member }) {
  return (
    <div className={styles.formGrid}>
      <label className={styles.field}>
        <span>Access code *</span>
        <input name="access_code" type="password" required defaultValue={member?.access_code || ""} placeholder="member123" autoComplete="off" />
      </label>
      <label className={styles.field}>
        <span>Gmail *</span>
        <input name="gmail" type="email" required defaultValue={member?.gmail || ""} placeholder="member@gmail.com" />
      </label>
      <label className={styles.field}>
        <span>Tier *</span>
        <select name="tier" defaultValue={member?.tier || "Premium"}><option value="Tool">Tool</option><option value="Premium">Premium</option><option value="Creator">Creator</option></select>
      </label>
      <label className={styles.field}>
        <span>Status *</span>
        <select name="status" defaultValue={member?.status || "active"}>
          {member?.status === "google_trial" && <option value="google_trial">Google Trial</option>}
          {MEMBER_STATUSES.map((status) => <option value={status} key={status}>{status}</option>)}
        </select>
      </label>
      <label className={styles.field}>
        <span>Max uses</span>
        <input name="max_uses" type="number" min="1" defaultValue={member?.max_uses ?? ""} placeholder="Blank = unlimited" />
      </label>
      <label className={styles.field}>
        <span>Max web devices</span>
        <input name="max_devices" type="number" min="1" max="20" required defaultValue={member?.tier === "Tool" ? 2 : (member?.max_devices ?? 5)} />
        <small>Tool tier is always limited to 2 web devices.</small>
      </label>
      <label className={styles.field}>
        <span>Expires at</span>
        <input name="expires_at" type="datetime-local" defaultValue={formatLocalDate(member?.expires_at || null)} />
      </label>
      <label className={`${styles.field} ${styles.full}`}><span>Notes</span><textarea name="notes" rows={3} defaultValue={member?.notes || ""} /></label>
      <label className={`${styles.field} ${styles.full}`}><span>Account link</span><input name="account_link" type="url" defaultValue={member?.account_link || ""} placeholder="https://..." /></label>
    </div>
  );
}

export default function MemberManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [adminEmail, setAdminEmail] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MemberFilter>("all");
  const [page, setPage] = useState(1);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [busy, setBusy] = useState("");

  async function loadMembers() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/prompts/api/members", { cache: "no-store", credentials: "include" });
      const body = (await response.json()) as ApiResponse;
      if (response.status === 401 || response.status === 403) {
        setUnauthorized(true);
        setMembers([]);
        return;
      }
      if (!response.ok) throw new Error(body.error || "Could not load members.");
      setUnauthorized(false);
      setMembers(body.members || []);
      setActivity(body.activity || []);
      setAdminEmail(body.adminEmail || "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load members.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMembers(); }, []);

  const filterCounts = useMemo(() => ({
    all: members.length,
    trial: members.filter((m) => m.status.toLowerCase() === "google_trial").length,
    members: members.filter((m) => m.status.toLowerCase() !== "google_trial" && (m.tier === "Premium" || m.tier === "Creator")).length,
    tool: members.filter((m) => m.status.toLowerCase() !== "google_trial" && m.tier === "Tool").length,
    premium: members.filter((m) => m.status.toLowerCase() !== "google_trial" && m.tier === "Premium").length,
    creator: members.filter((m) => m.status.toLowerCase() !== "google_trial" && m.tier === "Creator").length,
    affiliate: members.filter((m) => m.is_affiliate).length,
  }), [members]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members.filter((member) => {
      const status = member.status.toLowerCase();
      const matchesFilter =
        filter === "all" ? true :
        filter === "trial" ? status === "google_trial" :
        filter === "members" ? status !== "google_trial" && (member.tier === "Premium" || member.tier === "Creator") :
        filter === "tool" ? status !== "google_trial" && member.tier === "Tool" :
        filter === "premium" ? status !== "google_trial" && member.tier === "Premium" :
        filter === "creator" ? status !== "google_trial" && member.tier === "Creator" :
        Boolean(member.is_affiliate);
      if (!matchesFilter) return false;
      if (!needle) return true;
      return [member.gmail, member.access_code, member.tier, member.status, member.notes || "", member.account_link || ""].some((value) => value.toLowerCase().includes(needle));
    });
  }, [filter, members, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [query, filter]);

  function replaceMember(member: Member) {
    setMembers((current) => current.map((item) => item.id === member.id ? { ...item, ...member } : item));
  }

  async function mutate(body: Record<string, unknown>, method: "POST" | "PATCH") {
    const response = await fetch("/prompts/api/members", { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = (await response.json()) as ApiResponse;
    if (response.status === 401 || response.status === 403) {
      setUnauthorized(true);
      throw new Error("Your admin session has expired. Please sign in again.");
    }
    if (!response.ok) throw new Error(result.error || "Member update failed.");
    return result;
  }

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("create"); setError(""); setNotice("");
    const form = event.currentTarget;
    try {
      const result = await mutate(payloadFromForm(form), "POST");
      if (result.member) setMembers((current) => [result.member!, ...current]);
      setNotice("Member added successfully."); form.reset();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not add member."); }
    finally { setBusy(""); }
  }

  async function updateMember(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault(); setBusy(`update-${id}`); setError(""); setNotice("");
    try {
      const result = await mutate({ id, action: "update", ...payloadFromForm(event.currentTarget) }, "PATCH");
      if (result.member) replaceMember(result.member);
      setNotice(result.message || "Member updated.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update member."); }
    finally { setBusy(""); }
  }

  async function toggleStatus(member: Member) {
    setBusy(`toggle-${member.id}`); setError(""); setNotice("");
    try {
      const result = await mutate({ id: member.id, action: "toggle", current_status: member.status }, "PATCH");
      if (result.member) replaceMember(result.member);
      setNotice(result.message || "Member status updated.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update member status."); }
    finally { setBusy(""); }
  }

  function toggleReveal(id: string) {
    setRevealed((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  async function copyCode(code: string) { await navigator.clipboard.writeText(code); setNotice("Access code copied."); }

  function focusActivity(item: Activity) {
    const isTrial = item.status.toLowerCase() === "google_trial";
    setFilter("all");
    setQuery(isTrial ? item.access_code : item.gmail);
    window.scrollTo({ top: 180, behavior: "smooth" });
  }

  if (loading) return <main className={styles.page}><section className={styles.centerCard}><p>Loading members…</p></section></main>;

  if (unauthorized) {
    return <main className={styles.page}><section className={styles.centerCard}>
      <p className={styles.kicker}>Fluxora member manager</p><h1>Admin sign-in required</h1>
      <p>This page uses the same protected Google admin session as Prompt Gallery.</p>
      <a className={styles.primaryButton} href="/prompts/member-login">Login with Google</a><a className={styles.textLink} href="/">Return to Fluxora</a>
    </section></main>;
  }

  const filterOptions: Array<{ key: MemberFilter; label: string }> = [
    { key: "all", label: "All" },
    { key: "trial", label: "Trial" },
    { key: "members", label: "Members" },
    { key: "tool", label: "Tool" },
    { key: "premium", label: "Premium" },
    { key: "creator", label: "Creator" },
    { key: "affiliate", label: "Affiliate" },
  ];

  return <main className={styles.page}>
    <header className={styles.header}><div><p className={styles.kicker}>Fluxora access control</p><h1>Member Manager</h1><p className={styles.adminEmail}>{adminEmail}</p></div>
      <div className={styles.headerActions}><a className={styles.secondaryButton} href="/">Home</a><a className={styles.secondaryButton} href="/prompts/admin?tab=members">Prompt Admin</a></div>
    </header>

    {(notice || error) && <div className={error ? styles.errorNotice : styles.successNotice}>{error || notice}</div>}
    <section className={styles.summaryGrid}><article><span>Total members</span><strong>{members.length}</strong></article><article><span>Active</span><strong>{members.filter((m) => m.status === "active").length}</strong></article><article><span>Creator</span><strong>{members.filter((m) => m.tier === "Creator" && m.status.toLowerCase() !== "google_trial").length}</strong></article></section>

    <div className={layout.managerLayout}>
      <aside className={layout.filterRail} aria-label="Member filters">
        {filterOptions.map((option) => <button key={option.key} type="button" className={filter === option.key ? layout.filterActive : ""} onClick={() => setFilter(option.key)}><span>{option.label}</span><small>{filterCounts[option.key]}</small></button>)}
      </aside>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><div><p className={styles.kicker}>Access control</p><h2>Members</h2></div><span className={styles.count}>{filtered.length}</span></div>
        <div className={styles.searchBar}><label><span>Search members</span><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search Gmail, code, tier, status, or notes..." /></label>{query && <button type="button" className={styles.secondaryButton} onClick={() => setQuery("")}>Clear</button>}</div>

        <details className={styles.createPanel}><summary>Add a new member</summary><form className={styles.form} onSubmit={createMember}><MemberFields /><button className={styles.primaryButton} disabled={busy === "create"} type="submit">{busy === "create" ? "Adding…" : "Add Member"}</button></form></details>

        <div className={styles.list}>{visible.map((member) => {
          const isRevealed = revealed.has(member.id);
          const canvasLimit = member.canvas_limit === null ? "unlimited" : String(member.canvas_limit ?? (member.status === "google_trial" ? 6 : member.tier === "Tool" ? 3 : 8));
          const activeLike = member.status === "active" || member.status === "google_trial";
          const isTrial = member.status.toLowerCase() === "google_trial";
          return <article className={styles.item} key={member.id}>
            <div className={styles.itemTop}><div className={styles.identity}><strong>{member.gmail}</strong><span>{member.tier}{member.is_affiliate ? " • Affiliate" : ""}</span></div><span className={`${styles.status} ${activeLike ? styles.active : styles.inactive}`}>{member.status}</span></div>
            <div className={styles.secretRow}><div><span className={styles.secretLabel}>Access code</span><button type="button" className={styles.secretButton} onClick={() => toggleReveal(member.id)} aria-expanded={isRevealed}>{isRevealed ? member.access_code : "••••••••••"}</button></div>{isRevealed && <button type="button" className={styles.copyButton} onClick={() => copyCode(member.access_code)}>Copy</button>}</div>
            <div className={styles.metaRow}><span>Uses: {member.use_count ?? 0}{member.max_uses ? ` / ${member.max_uses}` : " / unlimited"}</span><span>Web devices: {member.device_count ?? 0} / {member.max_devices ?? (member.tier === "Tool" ? 2 : 5)}</span><span>Canvas: {member.canvas_count ?? 0} / {canvasLimit}</span><span>{displayDate(member.expires_at)}</span></div>
            {member.notes && <p className={styles.notes}>{member.notes}</p>}
            {member.account_link && <a className={styles.accountLink} href={member.account_link} target="_blank" rel="noopener noreferrer">Open account link ↗</a>}
            <div className={styles.quickActions}>
              {!isTrial && <button type="button" className={styles.smallButton} disabled={busy === `toggle-${member.id}`} onClick={() => toggleStatus(member)}>{busy === `toggle-${member.id}` ? "Saving…" : member.status === "active" ? "Disable" : "Activate"}</button>}
              <details className={styles.editPanel}><summary>Edit</summary><form className={styles.form} onSubmit={(event) => updateMember(event, member.id)}><MemberFields member={member} /><button className={styles.primaryButton} disabled={busy === `update-${member.id}`} type="submit">{busy === `update-${member.id}` ? "Saving…" : "Save Member"}</button></form></details>
            </div>
          </article>;
        })}{!visible.length && <div className={styles.emptyState}>No members match this filter.</div>}</div>

        {pageCount > 1 && <nav className={styles.pagination} aria-label="Member pages">{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button key={number} type="button" className={number === safePage ? styles.pageActive : ""} onClick={() => setPage(number)}>{number}</button>)}</nav>}
      </section>

      <aside className={layout.activityRail}>
        <div className={layout.activityHeading}><p className={styles.kicker}>Since 12:00 AM PH</p><h2>Active access today</h2></div>
        <div className={layout.activityList}>
          {activity.map((item) => {
            const isTrial = item.status.toLowerCase() === "google_trial";
            return <button type="button" key={item.member_id} className={layout.activityItem} onClick={() => focusActivity(item)}>
              <span className={layout.activityCode}>{isTrial ? item.access_code : item.gmail}</span>
              <strong>{item.uses} {item.uses === 1 ? "use" : "uses"}</strong>
              <small>{isTrial ? "Trial" : item.tier} • Last {phTime(item.last_used_at)}</small>
              {item.canvas_devices >= 4 && <em>{item.canvas_devices} Canvas registrations today{item.canvas_devices >= 6 ? " • Check" : ""}</em>}
            </button>;
          })}
          {!activity.length && <p className={layout.activityEmpty}>No successful code authorizations yet today.</p>}
        </div>
      </aside>
    </div>
  </main>;
}
