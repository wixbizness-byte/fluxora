"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import styles from "./trial-admin.module.css";

type Resource = {
  id: string;
  slug: string;
  title: string;
  access_level: "All" | "Premium" | "Creator";
  tool_type: "Tool" | "CustomGPT" | "Workflow";
  status: string;
};

type Campaign = {
  id: string;
  slug: string;
  name: string;
  resource_id: string;
  duration_minutes: number;
  max_claims: number | null;
  starts_at: string | null;
  ends_at: string | null;
  enabled: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  resource: Resource | null;
  claims: { total: number; active: number };
};

type Payload = {
  campaigns?: Campaign[];
  resources?: Resource[];
  message?: string;
  error?: string;
};

type DurationUnit = "minutes" | "hours" | "days";

function formatPht(value: string | null) {
  if (!value) return "No limit";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDuration(minutes: number) {
  if (minutes % 1440 === 0) {
    const value = minutes / 1440;
    return `${value} day${value === 1 ? "" : "s"}`;
  }
  if (minutes % 60 === 0) {
    const value = minutes / 60;
    return `${value} hour${value === 1 ? "" : "s"}`;
  }
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function durationParts(minutes: number): { value: string; unit: DurationUnit } {
  if (minutes % 1440 === 0) return { value: String(minutes / 1440), unit: "days" };
  if (minutes % 60 === 0) return { value: String(minutes / 60), unit: "hours" };
  return { value: String(minutes), unit: "minutes" };
}

function durationMinutes(value: string, unit: DurationUnit) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) throw new Error("Duration must be a positive whole number.");
  const multiplier = unit === "days" ? 1440 : unit === "hours" ? 60 : 1;
  return number * multiplier;
}

function manilaInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function manilaIso(value: string) {
  if (!value) return null;
  const date = new Date(`${value}:00+08:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Enter a valid Philippine-time date.");
  return date.toISOString();
}

export default function TrialAdmin() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [durationValue, setDurationValue] = useState("48");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("hours");
  const [maxClaims, setMaxClaims] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/prompts/api/trial-campaigns", {
        cache: "no-store",
        credentials: "include",
      });
      const body = (await response.json().catch(() => ({}))) as Payload;
      if (response.status === 401 || response.status === 403) {
        setUnauthorized(true);
        return;
      }
      if (!response.ok) throw new Error(body.error || "Could not load custom trial campaigns.");
      setUnauthorized(false);
      setCampaigns(body.campaigns || []);
      setResources(body.resources || []);
      setResourceId((current) => current || body.resources?.[0]?.id || "");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load custom trial campaigns.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const summary = useMemo(() => ({
    total: campaigns.length,
    enabled: campaigns.filter((campaign) => campaign.enabled).length,
    claims: campaigns.reduce((sum, campaign) => sum + Number(campaign.claims?.total || 0), 0),
  }), [campaigns]);

  function clearForm() {
    setName("");
    setSlug("");
    setResourceId(resources[0]?.id || "");
    setDurationValue("48");
    setDurationUnit("hours");
    setMaxClaims("");
    setStartsAt("");
    setEndsAt("");
    setEditingId("");
  }

  function editCampaign(campaign: Campaign) {
    const duration = durationParts(campaign.duration_minutes);
    setEditingId(campaign.id);
    setName(campaign.name);
    setSlug(campaign.slug);
    setResourceId(campaign.resource_id);
    setDurationValue(duration.value);
    setDurationUnit(duration.unit);
    setMaxClaims(campaign.max_claims ? String(campaign.max_claims) : "");
    setStartsAt(manilaInput(campaign.starts_at));
    setEndsAt(manilaInput(campaign.ends_at));
    document.getElementById("custom-trial-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(editingId ? `edit-${editingId}` : "create");
    setNotice("");
    setError("");

    try {
      const payload = {
        ...(editingId ? { id: editingId, action: "update" } : {}),
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        resource_id: resourceId,
        duration_minutes: durationMinutes(durationValue, durationUnit),
        max_claims: maxClaims.trim() ? Number(maxClaims) : null,
        starts_at: manilaIso(startsAt),
        ends_at: manilaIso(endsAt),
      };
      const response = await fetch("/prompts/api/trial-campaigns", {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => ({}))) as Payload;
      if (!response.ok) throw new Error(body.error || "Could not save trial campaign.");
      setNotice(body.message || (editingId ? "Trial campaign updated." : "Trial link created."));
      clearForm();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save trial campaign.");
    } finally {
      setBusy("");
    }
  }

  async function toggleCampaign(campaign: Campaign) {
    setBusy(`toggle-${campaign.id}`);
    setNotice("");
    setError("");
    try {
      const response = await fetch("/prompts/api/trial-campaigns", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: campaign.id,
          action: "set_enabled",
          enabled: !campaign.enabled,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as Payload;
      if (!response.ok) throw new Error(body.error || "Could not update trial campaign.");
      setNotice(body.message || "Trial campaign updated.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update trial campaign.");
    } finally {
      setBusy("");
    }
  }

  async function copyLink(campaign: Campaign) {
    const url = `${window.location.origin}/trial/${campaign.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice(`Copied ${url}`);
      setError("");
    } catch {
      setError("Could not copy the trial link. Copy it manually from the campaign card.");
    }
  }

  if (unauthorized) return null;

  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <div>
          <p>Resource-specific access</p>
          <h2>Custom Trial Links</h2>
          <span>Create one-time trial links for a specific Tool, GPT, or Workflow. These trials never change the member&apos;s normal tier.</span>
        </div>
        <div className={styles.headingActions}>
          <button type="button" onClick={() => void load()} disabled={loading || Boolean(busy)}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {(notice || error) && <div className={error ? styles.error : styles.notice}>{error || notice}</div>}

      <div className={styles.summaryGrid}>
        <article><span>Campaigns</span><strong>{summary.total}</strong></article>
        <article><span>Enabled</span><strong>{summary.enabled}</strong></article>
        <article><span>Total claims</span><strong>{summary.claims}</strong></article>
      </div>

      <form className={styles.form} id="custom-trial-form" onSubmit={saveCampaign}>
        <div className={styles.formHeading}>
          <div>
            <p>{editingId ? "Edit campaign" : "New campaign"}</p>
            <h3>{editingId ? "Update trial link" : "Create Trial Link"}</h3>
          </div>
          {editingId ? <button type="button" className={styles.ghostButton} onClick={clearForm}>Cancel edit</button> : null}
        </div>

        <div className={styles.formGrid}>
          <label>
            <span>Trial name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="AI Drama September Trial" required maxLength={120} />
          </label>
          <label>
            <span>Trial URL slug</span>
            <input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="ai-drama-sept" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
            <small>fluxora.wiki/trial/{slug || "your-link"}</small>
          </label>
          <label className={styles.wide}>
            <span>Give access to</span>
            <select value={resourceId} onChange={(event) => setResourceId(event.target.value)} required>
              <option value="" disabled>Select a resource</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.title} · {resource.tool_type} · {resource.access_level}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Duration</span>
            <div className={styles.inlineFields}>
              <input type="number" min="1" value={durationValue} onChange={(event) => setDurationValue(event.target.value)} required />
              <select value={durationUnit} onChange={(event) => setDurationUnit(event.target.value as DurationUnit)}>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </label>
          <label>
            <span>Maximum claims</span>
            <input type="number" min="1" value={maxClaims} onChange={(event) => setMaxClaims(event.target.value)} placeholder="Unlimited" />
          </label>
          <label>
            <span>Campaign starts (PHT)</span>
            <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
          </label>
          <label>
            <span>Campaign ends (PHT)</span>
            <input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
          </label>
        </div>

        <div className={styles.formActions}>
          <button className={styles.primaryButton} type="submit" disabled={Boolean(busy) || !resourceId}>
            {busy === "create" || busy === `edit-${editingId}` ? "Saving…" : editingId ? "Save changes" : "Create Trial Link"}
          </button>
        </div>
      </form>

      <div className={styles.listHeading}>
        <div>
          <p>Campaign library</p>
          <h3>Trial links</h3>
        </div>
        <span>{campaigns.length}</span>
      </div>

      <div className={styles.list}>
        {campaigns.map((campaign) => {
          const url = `https://fluxora.wiki/trial/${campaign.slug}`;
          return (
            <article className={styles.row} key={campaign.id}>
              <div className={styles.identity}>
                <strong>{campaign.name}</strong>
                <code>{url}</code>
                <span>{campaign.resource?.title || "Unavailable resource"} · {campaign.resource?.tool_type || "Resource"} · {formatDuration(campaign.duration_minutes)}</span>
              </div>
              <div className={styles.metrics}>
                <span>Claims</span>
                <strong>{campaign.claims?.total || 0}{campaign.max_claims ? ` / ${campaign.max_claims}` : ""}</strong>
                <small>{campaign.claims?.active || 0} active now</small>
              </div>
              <div className={styles.window}>
                <span>{campaign.starts_at ? `Starts ${formatPht(campaign.starts_at)}` : "Starts immediately"}</span>
                <span>{campaign.ends_at ? `Ends ${formatPht(campaign.ends_at)}` : "No campaign end"}</span>
              </div>
              <div className={styles.meta}>
                <b className={campaign.enabled ? styles.active : styles.expired}>{campaign.enabled ? "ACTIVE" : "DISABLED"}</b>
              </div>
              <div className={styles.rowActions}>
                <button type="button" onClick={() => void copyLink(campaign)}>Copy Link</button>
                <button type="button" onClick={() => editCampaign(campaign)} disabled={Boolean(busy)}>Edit</button>
                <button
                  type="button"
                  className={campaign.enabled ? styles.dangerButton : styles.enableButton}
                  onClick={() => void toggleCampaign(campaign)}
                  disabled={Boolean(busy)}
                >
                  {busy === `toggle-${campaign.id}` ? "Saving…" : campaign.enabled ? "Disable" : "Enable"}
                </button>
              </div>
            </article>
          );
        })}
        {!loading && !campaigns.length ? <div className={styles.empty}>No custom trial links yet. Create the first campaign above.</div> : null}
      </div>
    </section>
  );
}
