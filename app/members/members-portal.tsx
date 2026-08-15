"use client";

import { useMemo, useState, useEffect } from "react";
import MemberManager from "../member/member-manager";
import AffiliateAdmin from "../member/affiliate-admin";
import styles from "./members.module.css";

type Member = {
  id: string;
  access_code: string;
  gmail: string;
  tier: "Tool" | "Premium" | "Creator";
  status: string;
  max_devices: number;
  max_uses: number | null;
  use_count: number | null;
  expires_at: string | null;
  created_at: string;
};

type Device = {
  id: string;
  device_name: string | null;
  browser: string | null;
  platform: string | null;
  first_seen_at: string;
  last_seen_at: string;
  last_tool?: string | null;
  seen_count?: number | null;
  observed_over_limit?: boolean | null;
};

type PortalResponse = {
  role?: "admin" | "member" | "none";
  email?: string;
  member?: Member;
  access_code?: string;
  message?: string;
  error?: string;
  tracked_devices?: Device[];
  tracked_limit?: number;
  tracked_over_limit?: boolean;
};

type TrackedResponse = {
  devices?: Device[];
  limit?: number;
  count?: number;
  over_limit?: boolean;
  message?: string;
  error?: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "No expiry";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No expiry" : date.toLocaleString();
}

export default function MembersPortal() {
  const [data, setData] = useState<PortalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(200);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [revealed, setRevealed] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    const response = await fetch("/prompts/api/member-portal", { cache: "no-store", credentials: "include" });
    const body = (await response.json().catch(() => ({}))) as PortalResponse;
    setStatus(response.status);

    if (!response.ok && response.status !== 401 && response.status !== 403) {
      setData(body);
      setError(body.error || "Could not load member portal.");
      setLoading(false);
      return;
    }

    if (response.ok && body.role === "member") {
      const trackedResponse = await fetch("/prompts/api/tracked-devices", { cache: "no-store", credentials: "include" });
      const tracked = (await trackedResponse.json().catch(() => ({}))) as TrackedResponse;
      if (trackedResponse.ok) {
        body.tracked_devices = tracked.devices || [];
        body.tracked_limit = tracked.limit ?? body.member?.max_devices ?? 1;
        body.tracked_over_limit = Boolean(tracked.over_limit);
      } else if (trackedResponse.status !== 401 && trackedResponse.status !== 403) {
        setError(tracked.error || "Could not load tracked devices.");
      }
    }

    setData(body);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((cause) => {
      setError(cause instanceof Error ? cause.message : "Could not load member portal.");
      setLoading(false);
    });
  }, []);

  async function act(action: string, extra: Record<string, unknown> = {}, busyKey = action) {
    setBusy(busyKey);
    setNotice("");
    setError("");
    const trackedAction = action === "remove_tracked_device" || action === "reset_tracked_devices";
    const response = await fetch(trackedAction ? "/prompts/api/tracked-devices" : "/prompts/api/member-portal", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const body = (await response.json().catch(() => ({}))) as PortalResponse;
    if (!response.ok) {
      setError(body.error || "Action failed.");
      setBusy("");
      return;
    }
    setNotice(body.message || "Updated.");
    if (action === "reset_code" && body.access_code) {
      setData((current) => current?.member ? { ...current, member: { ...current.member, access_code: body.access_code! } } : current);
      setRevealed(true);
    } else {
      await load();
    }
    setBusy("");
  }

  const trackedDevices = data?.tracked_devices || [];
  const member = data?.member;
  const trackedLimit = data?.tracked_limit ?? member?.max_devices ?? 1;
  const remaining = useMemo(() => Math.max(0, trackedLimit - trackedDevices.length), [trackedLimit, trackedDevices.length]);

  if (loading) {
    return <main className={styles.page}><section className={styles.centerCard}><p>Loading your Fluxora membership…</p></section></main>;
  }

  if (data?.role === "admin") {
    return <><MemberManager /><AffiliateAdmin /></>;
  }

  if (status === 401) {
    return (
      <main className={styles.page}><section className={styles.centerCard}>
        <p className={styles.kicker}>Fluxora members</p>
        <h1>Member sign-in</h1>
        <p>Sign in with the Google account connected to your Fluxora membership.</p>
        <a className={styles.primaryButton} href="/prompts/member-login">Login with Google</a>
        <a className={styles.textLink} href="/">Back to Fluxora</a>
      </section></main>
    );
  }

  if (status === 403 || data?.role === "none" || !member) {
    return (
      <main className={styles.page}><section className={styles.centerCard}>
        <p className={styles.kicker}>Access required</p>
        <h1>No membership found</h1>
        <p>{data?.error || "This Google account is not connected to a Fluxora membership."}</p>
        <a className={styles.primaryButton} href="/pricing">View Fluxora access</a>
        <a className={styles.textLink} href="/prompts/member-login">Use another Google account</a>
      </section></main>
    );
  }

  const overLimit = data?.tracked_over_limit ?? trackedDevices.length > trackedLimit;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Fluxora member portal</p>
          <h1>Your Membership</h1>
          <p className={styles.email}>{member.gmail}</p>
        </div>
        <div className={styles.headerActions}>
          <a href="/tools">Tools</a>
          <a href="/prompts">Prompts</a>
          <a href="/">Home</a>
        </div>
      </header>

      {(notice || error) && <div className={error ? styles.error : styles.notice}>{error || notice}</div>}

      <section className={styles.summaryGrid}>
        <article><span>Tier</span><strong>{member.tier}</strong></article>
        <article><span>Status</span><strong>{member.status}</strong></article>
        <article><span>Tracked devices</span><strong>{trackedDevices.length} / {trackedLimit}{overLimit ? " ⚠" : ""}</strong></article>
        <article><span>Expires</span><strong className={styles.smallStrong}>{formatDate(member.expires_at)}</strong></article>
      </section>

      {overLimit && <div className={styles.warning}>Your account is over its tracked-device limit ({trackedDevices.length} / {trackedLimit}). Fluxora access is not blocked immediately, but this usage is flagged for review. Remove old device history below if needed.</div>}

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div><p className={styles.kicker}>Access security</p><h2>Access code</h2></div>
        </div>
        <div className={styles.codeBox}>
          <button type="button" onClick={() => setRevealed((value) => !value)}>{revealed ? member.access_code : "••••••••"}</button>
          {revealed && <button className={styles.secondaryButton} type="button" onClick={() => navigator.clipboard.writeText(member.access_code).then(() => setNotice("Access code copied."))}>Copy</button>}
        </div>
        <p className={styles.help}>Changing your code disables the old code immediately. Tracked-device history is kept unless you clear it below.</p>
        <button className={styles.dangerButton} type="button" disabled={busy === "reset_code"} onClick={() => {
          if (window.confirm("Generate a new access code? The old code will stop working immediately.")) act("reset_code");
        }}>{busy === "reset_code" ? "Changing…" : "Change access code"}</button>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.kicker}>Background device tracking</p>
            <h2>Tracked Devices</h2>
            <p>{remaining} slot{remaining === 1 ? "" : "s"} before the account is flagged · access itself remains instant.</p>
          </div>
          {trackedDevices.length > 0 && <button className={styles.secondaryButton} type="button" disabled={busy === "reset_tracked_devices"} onClick={() => {
            if (window.confirm("Clear all tracked Fluxora devices? Devices will be observed again the next time they use Fluxora.")) act("reset_tracked_devices");
          }}>{busy === "reset_tracked_devices" ? "Clearing…" : "Clear all"}</button>}
        </div>

        <div className={styles.deviceList}>
          {trackedDevices.map((device) => {
            const busyKey = `remove-tracked-${device.id}`;
            const label = [device.browser || "Browser", device.platform || "Unknown platform"].join(" · ");
            return (
              <article className={styles.device} key={device.id}>
                <div>
                  <strong>{device.device_name || "Fluxora Device"}{device.observed_over_limit ? " ⚠" : ""}</strong>
                  <span>{label}{device.last_tool ? ` · ${device.last_tool}` : ""}</span>
                  <small>First seen {formatDate(device.first_seen_at)} · Last active {formatDate(device.last_seen_at)}{device.seen_count ? ` · ${device.seen_count} check${device.seen_count === 1 ? "" : "s"}` : ""}</small>
                </div>
                <button type="button" className={styles.removeButton} disabled={busy === busyKey} onClick={() => {
                  if (window.confirm(`Remove tracked history for ${label}?`)) act("remove_tracked_device", { device_id: device.id }, busyKey);
                }}>{busy === busyKey ? "Removing…" : "Remove"}</button>
              </article>
            );
          })}
          {!trackedDevices.length && <div className={styles.empty}>No Canvas devices have been observed yet. Successful v35 code checks will add them silently in the background.</div>}
        </div>
      </section>

      <section className={styles.infoPanel}>
        <strong>How does device tracking work?</strong>
        <p>Fluxora no longer pauses access for cryptographic verification. After a successful code check, it hashes a small set of stable browser/device characteristics and records that hash in the background. Multiple Canvases with the same browser/device profile should resolve to the same tracked device. Because this is soft fingerprinting, the count is a sharing signal rather than a hardware-identity guarantee.</p>
      </section>
    </main>
  );
}
