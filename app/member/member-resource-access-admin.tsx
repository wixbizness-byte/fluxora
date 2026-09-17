"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import styles from "./member-resource-access-admin.module.css";

type MemberOption = {
  id: string;
  gmail: string;
  tier: "Member" | "Tool" | "Premium" | "Creator" | "Admin";
  base_tier?: "Member" | "Tool" | "Premium" | "Creator";
  status: string;
};

type CustomGptResource = {
  id: string;
  slug: string;
  title: string;
  access_level: "Premium" | "Creator";
  tool_type: "CustomGPT";
  status: string;
};

type ResourceEntitlement = {
  id: string;
  member_id: string;
  resource_id: string;
  source: string;
  granted_at: string;
  granted_by: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  notes: string | null;
  resource: CustomGptResource | null;
};

type MemberResponse = {
  members?: MemberOption[];
  error?: string;
};

type EntitlementResponse = {
  customGptResources?: CustomGptResource[];
  resourceEntitlements?: ResourceEntitlement[];
  entitlement?: ResourceEntitlement | null;
  message?: string;
  error?: string;
};

function displayDate(value: string | null) {
  if (!value) return "Permanent";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Permanent";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function memberTier(member: MemberOption) {
  return member.tier === "Admin" ? "Admin" : (member.base_tier || member.tier);
}

export default function MemberResourceAccessAdmin() {
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [customGptResources, setCustomGptResources] = useState<CustomGptResource[]>([]);
  const [resourceEntitlements, setResourceEntitlements] = useState<ResourceEntitlement[]>([]);
  const [memberId, setMemberId] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [expiryMode, setExpiryMode] = useState<"permanent" | "custom">("permanent");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [membersResponse, accessResponse] = await Promise.all([
        fetch("/prompts/api/members", { cache: "no-store", credentials: "include" }),
        fetch("/prompts/api/member-resource-entitlements", { cache: "no-store", credentials: "include" }),
      ]);
      const membersBody = (await membersResponse.json()) as MemberResponse;
      const accessBody = (await accessResponse.json()) as EntitlementResponse;
      if (!membersResponse.ok) throw new Error(membersBody.error || "Could not load members.");
      if (!accessResponse.ok) throw new Error(accessBody.error || "Could not load individual CustomGPT access.");

      const nextMembers = membersBody.members || [];
      const nextResources = accessBody.customGptResources || [];
      setMembers(nextMembers);
      setCustomGptResources(nextResources);
      setResourceEntitlements(accessBody.resourceEntitlements || []);
      setMemberId((current) => nextMembers.some((member) => member.id === current) ? current : "");
      setResourceId((current) => current || nextResources[0]?.id || "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load individual CustomGPT access.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === memberId) || null,
    [memberId, members],
  );

  const memberMatches = useMemo(() => {
    const needle = memberQuery.trim().toLowerCase();
    if (!needle) return [];
    return members
      .filter((member) => member.gmail.toLowerCase().includes(needle))
      .slice(0, 10);
  }, [memberQuery, members]);

  const selectedEntitlements = useMemo(
    () => resourceEntitlements.filter((entitlement) => entitlement.member_id === memberId),
    [memberId, resourceEntitlements],
  );

  const activeResourceIds = useMemo(
    () => new Set(selectedEntitlements
      .filter((entitlement) => !entitlement.expires_at || new Date(entitlement.expires_at).getTime() > Date.now())
      .map((entitlement) => entitlement.resource_id)),
    [selectedEntitlements],
  );

  async function mutateAccess(body: Record<string, unknown>) {
    const response = await fetch("/prompts/api/member-resource-entitlements", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as EntitlementResponse;
    if (!response.ok) throw new Error(result.error || "Could not update individual CustomGPT access.");
    return result;
  }

  async function grantAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!memberId || !resourceId) return;
    setBusy("grant");
    setError("");
    setNotice("");
    try {
      const result = await mutateAccess({
        action: "grant_resource_entitlement",
        member_id: memberId,
        resource_id: resourceId,
        expires_at: expiryMode === "custom" ? expiresAt || null : null,
        notes: notes.trim() || null,
      });
      setNotice(result.message || "CustomGPT access granted.");
      setNotes("");
      setExpiresAt("");
      setExpiryMode("permanent");
      await loadData();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not grant CustomGPT access.");
    } finally {
      setBusy("");
    }
  }

  async function revokeAccess(entitlement: ResourceEntitlement) {
    if (!window.confirm(`Revoke ${entitlement.resource?.title || "this CustomGPT"} access?`)) return;
    setBusy(`revoke-${entitlement.id}`);
    setError("");
    setNotice("");
    try {
      const result = await mutateAccess({
        action: "revoke_resource_entitlement",
        member_id: entitlement.member_id,
        resource_id: entitlement.resource_id,
      });
      setNotice(result.message || "CustomGPT access revoked.");
      await loadData();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not revoke CustomGPT access.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="individual-customgpt-access-heading">
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>Per-item access</p>
          <h3 id="individual-customgpt-access-heading">Individual CustomGPT Access</h3>
          <p>Grant one CustomGPT without changing the member&apos;s base Tool, Premium, Creator, trial, or device settings.</p>
        </div>
        <button type="button" className={styles.refreshButton} onClick={loadData} disabled={loading || Boolean(busy)}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {(notice || error) && <div className={error ? styles.errorNotice : styles.successNotice}>{error || notice}</div>}

      <div className={styles.memberPicker}>
        <div className={styles.memberSearch}>
          <label htmlFor="resource-member-search">Member Gmail</label>
          <input
            id="resource-member-search"
            type="search"
            value={memberQuery}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setMemberQuery(nextQuery);
              if (selectedMember?.gmail !== nextQuery) setMemberId("");
            }}
            placeholder="Search Gmail..."
            autoComplete="off"
            disabled={loading || !members.length}
            aria-controls="resource-member-search-results"
            aria-expanded={Boolean(memberQuery.trim() && !selectedMember)}
          />
          {memberQuery.trim() && !selectedMember && (
            <div className={styles.memberSearchResults} id="resource-member-search-results" role="listbox" aria-label="Matching members">
              {memberMatches.map((member) => (
                <button
                  type="button"
                  className={styles.memberSearchResult}
                  key={member.id}
                  role="option"
                  aria-selected="false"
                  onClick={() => {
                    setMemberId(member.id);
                    setMemberQuery(member.gmail);
                  }}
                >
                  <strong>{member.gmail}</strong>
                  <span>{memberTier(member)} · {member.status}</span>
                </button>
              ))}
              {!memberMatches.length && <p className={styles.noMemberMatches}>No matching Gmail found.</p>}
            </div>
          )}
        </div>
        {selectedMember
          ? <div className={styles.memberSummary}><strong>{selectedMember.gmail}</strong><span>Base access: {memberTier(selectedMember)} · {selectedMember.status}</span></div>
          : <div className={styles.memberSummary}><strong>No member selected</strong><span>Search and select a Gmail to manage per-item access.</span></div>}
      </div>

      <div className={styles.grantList}>
        <div className={styles.subheading}><h4>Current individual access</h4><span>{selectedEntitlements.length}</span></div>
        {selectedEntitlements.map((entitlement) => {
          const expired = Boolean(entitlement.expires_at) && new Date(String(entitlement.expires_at)).getTime() <= Date.now();
          return (
            <article className={styles.grantItem} key={entitlement.id}>
              <div>
                <strong>{entitlement.resource?.title || entitlement.resource_id}</strong>
                <span>{entitlement.resource?.access_level || "CustomGPT"} · {expired ? "Expired" : displayDate(entitlement.expires_at)}</span>
                {entitlement.granted_by && <small>Granted by {entitlement.granted_by}</small>}
                {entitlement.notes && <small>{entitlement.notes}</small>}
              </div>
              <button type="button" className={styles.revokeButton} onClick={() => revokeAccess(entitlement)} disabled={busy === `revoke-${entitlement.id}`}>
                {busy === `revoke-${entitlement.id}` ? "Revoking…" : "Revoke"}
              </button>
            </article>
          );
        })}
        {!memberId
          ? <p className={styles.empty}>Select a member to view individual CustomGPT access.</p>
          : !selectedEntitlements.length && <p className={styles.empty}>No individual CustomGPT access grants for this member.</p>}
      </div>

      <form className={styles.grantForm} onSubmit={grantAccess}>
        <div className={styles.subheading}><h4>Grant access</h4></div>
        <label>
          <span>CustomGPT</span>
          <select value={resourceId} onChange={(event) => setResourceId(event.target.value)} required disabled={!customGptResources.length}>
            {!customGptResources.length && <option value="">No active Premium/Creator CustomGPTs</option>}
            {customGptResources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.title} · {resource.access_level}{activeResourceIds.has(resource.id) ? " · Already active" : ""}
              </option>
            ))}
          </select>
        </label>

        <fieldset className={styles.expiryFieldset}>
          <legend>Expiry</legend>
          <label><input type="radio" name="entitlement-expiry" checked={expiryMode === "permanent"} onChange={() => setExpiryMode("permanent")} /> Permanent</label>
          <label><input type="radio" name="entitlement-expiry" checked={expiryMode === "custom"} onChange={() => setExpiryMode("custom")} /> Custom expiry</label>
        </fieldset>

        {expiryMode === "custom" && <label>
          <span>Expires at</span>
          <input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} required />
        </label>}

        <label className={styles.notesField}>
          <span>Note</span>
          <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional purchase/order note" />
        </label>

        <button type="submit" className={styles.grantButton} disabled={busy === "grant" || !memberId || !resourceId}>
          {busy === "grant" ? "Granting…" : "Grant Access"}
        </button>
      </form>
    </section>
  );
}
