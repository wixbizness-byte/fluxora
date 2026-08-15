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
};

type PortalResponse = {
  role?: "admin" | "member" | "none";
  email?: string;
  member?: Member;
  registered_devices?: Device[];
  registered_limit?: number | null;
  access_code?: string;
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
    setData(body);
    if (!response.ok && response.status !== 401 && response.status !== 403) setError(body.error || "Could not load member portal.");
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
    const response = await fetch("/prompts/api/member-portal", {
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

  const registeredDevices = data?.registered_devices || [];
  const member = data?.member;
  const registeredLimit = data?.registered_limit ?? member?.max_devices ?? 1;
  const remaining = useMemo(() => Math.max(0, registeredLimit - registeredDevices.length), [registeredLimit, registeredDevices.length]);

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

  const atLimit = registeredDevices.length >= registeredLimit;

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
        <article><span>Registered devices</span><strong>{registeredDevices.length} / {registeredLimit}</strong></article>
        <article><span>Expires</span><strong className={styles.smallStrong}>{formatDate(member.expires_at)}</strong></article>
      </section>

      {atLimit && <div className={styles.warning}>Your registered-device limit is full. Remove a device below before authorizing a different browser or phone.</div>}

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div><p className={styles.kicker}>Access security</p><h2>Access code</h2></div>
        </div>
        <div className={styles.codeBox}>
          <button type="button" onClick={() => setRevealed((value) => !value)}>{revealed ? member.access_code : "••••••••"}</button>
          {revealed && <button className={styles.secondaryButton} type="button" onClick={() => navigator.clipboard.writeText(member.access_code).then(() => setNotice("Access code copied."))}>Copy</button>}
        </div>
        <p className={styles.help}>Changing your code disables the old code immediately. Your registered-device list is kept unless you remove devices below.</p>
        <button className={styles.dangerButton} type="button" disabled={busy === "reset_code"} onClick={() => {
          if (window.confirm("Generate a new access code? The old code will stop working immediately.")) act("reset_code");
        }}>{busy === "reset_code" ? "Changing…" : "Change access code"}</button>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.kicker}>Device security</p>
            <h2>Registered Devices</h2>
            <p>{remaining} slot{remaining === 1 ? "" : "s"} available · Multiple Fluxora Canvases in the same registered browser use one device slot.</p>
          </div>
          {registeredDevices.length > 0 && <button className={styles.secondaryButton} type="button" disabled={busy === "reset_registered_devices"} onClick={() => {
            if (window.confirm("Remove every registered Fluxora device? Each browser or phone will need to pass device verification again.")) act("reset_registered_devices");
          }}>{busy === "reset_registered_devices" ? "Removing…" : "Remove all"}</button>}
        </div>

        <div className={styles.deviceList}>
          {registeredDevices.map((device) => {
            const busyKey = `remove-registered-${device.id}`;
            const label = [device.browser || "Browser", device.platform || "Unknown platform"].join(" · ");
            return (
              <article className={styles.device} key={device.id}>
                <div>
                  <strong>{device.device_name || "Fluxora Device"}</strong>
                  <span>{label}</span>
                  <small>First registered {formatDate(device.first_seen_at)} · Last active {formatDate(device.last_seen_at)}</small>
                </div>
                <button type="button" className={styles.removeButton} disabled={busy === busyKey} onClick={() => {
                  if (window.confirm(`Remove ${label}?`)) act("remove_registered_device", { device_id: device.id }, busyKey);
                }}>{busy === busyKey ? "Removing…" : "Remove"}</button>
              </article>
            );
          })}
          {!registeredDevices.length && <div className={styles.empty}>No registered Fluxora devices yet. Your next successful secure device check will register one.</div>}
        </div>
      </section>

      <section className={styles.infoPanel}>
        <strong>What counts as a registered device?</strong>
        <p>A browser profile or phone with its own Fluxora secure device key counts once. Opening multiple Fluxora Gemini Canvases in the same registered browser does not consume additional device slots. A different browser profile, another phone, private browsing, or cleared Fluxora site data may count as a different device.</p>
      </section>
    </main>
  );
}
