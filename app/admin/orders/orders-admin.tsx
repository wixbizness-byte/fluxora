"use client";

import { useEffect, useMemo, useState } from "react";
import { getSession, isSupabaseConfigured, queryOne, type SupabaseSession } from "../../lib/supabase";
import styles from "./orders.module.css";

type Order = {
  id: string;
  order_number: string;
  plan_id: string;
  plan_title: string;
  tier: "Premium" | "Creator";
  amount_php: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  payer_name: string;
  payment_reference: string;
  payment_proof_url: string | null;
  payment_provider: string;
  status: string;
  access_code?: string | null;
  member_id: string | null;
  rejection_reason: string | null;
  approved_at: string | null;
  created_at: string;
  notification_status: string;
  notification_attempts: number;
  notification_sent_at: string | null;
  notification_last_error: string | null;
};

type ProvisionResult = {
  order_id: string;
  member_id: string;
  access_code: string;
  order_status: string;
};

type EmailSettings = {
  enabled: boolean;
  sender_email: string | null;
  recipients: string[];
  configured: boolean;
  updated_at: string;
};

function config() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  };
}

async function adminFetch<T>(session: SupabaseSession, path: string, init?: RequestInit) {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.error || `Request failed (${response.status})`);
  return data as T;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function OrdersAdmin() {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("pending_review");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailSender, setEmailSender] = useState("");
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);

  async function verify() {
    if (!isSupabaseConfigured()) { setChecking(false); return; }
    const stored = await getSession();
    setSession(stored);
    if (!stored) { setChecking(false); return; }
    const admin = await queryOne<{ user_id: string }>("site_admins", `select=user_id&user_id=eq.${encodeURIComponent(stored.user.id)}`, true);
    setAuthorized(Boolean(admin.data) && !admin.error);
    setChecking(false);
  }

  async function load(activeSession = session) {
    if (!activeSession) return;
    setError("");
    const data = await adminFetch<Order[]>(activeSession, "orders?select=*&order=created_at.desc&limit=100");
    setOrders(data);
  }

  async function loadEmailSettings(activeSession = session) {
    if (!activeSession) return;
    const rows = await adminFetch<EmailSettings[]>(activeSession, "rpc/get_order_email_settings", { method: "POST", body: "{}" });
    const settings = rows[0];
    if (!settings) return;
    setEmailEnabled(settings.enabled);
    setEmailSender(settings.sender_email || "");
    setEmailRecipients((settings.recipients || []).join(", "));
    setEmailConfigured(settings.configured);
  }

  useEffect(() => { verify().catch((reason) => { setError(reason instanceof Error ? reason.message : "Could not verify admin access."); setChecking(false); }); }, []);
  useEffect(() => {
    if (!authorized || !session) return;
    Promise.all([load(session), loadEmailSettings(session)]).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load order admin data."));
  }, [authorized, session]);

  const visible = useMemo(() => filter === "all" ? orders : orders.filter((order) => order.status === filter), [orders, filter]);
  const pendingCount = orders.filter((order) => order.status === "pending_review").length;
  const emailBadge = emailConfigured ? (emailEnabled ? "Live" : "Ready · disabled") : "Needs app password";

  async function saveEmailSettings() {
    if (!session) return;
    setEmailSaving(true); setNotice(""); setError("");
    try {
      const recipients = emailRecipients.split(",").map((value) => value.trim()).filter(Boolean);
      const rows = await adminFetch<EmailSettings[]>(session, "rpc/save_order_email_settings", {
        method: "POST",
        body: JSON.stringify({
          p_enabled: emailEnabled,
          p_sender_email: emailSender,
          p_recipients: recipients,
          p_app_password: emailPassword,
        }),
      });
      const settings = rows[0];
      if (settings) {
        setEmailEnabled(settings.enabled);
        setEmailSender(settings.sender_email || "");
        setEmailRecipients((settings.recipients || []).join(", "));
        setEmailConfigured(settings.configured);
      }
      setEmailPassword("");
      setNotice(settings?.enabled ? "Gmail order alerts saved and enabled." : "Gmail order alert settings saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save Gmail alert settings.");
    } finally {
      setEmailSaving(false);
    }
  }

  async function testEmail() {
    if (!session) return;
    const { url, key } = config();
    setEmailTesting(true); setNotice(""); setError("");
    try {
      const response = await fetch(`${url}/functions/v1/order-email-notify`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "test" }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Test email failed.");
      setNotice("Test email sent. Check the configured inboxes.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Test email failed.");
    } finally {
      setEmailTesting(false);
    }
  }

  async function retryEmail(order: Order) {
    if (!session) return;
    setBusy(`email-${order.id}`); setNotice(""); setError("");
    try {
      await adminFetch<number | null>(session, "rpc/retry_order_email", { method: "POST", body: JSON.stringify({ p_order_id: order.id }) });
      setNotice("Email alert retry queued.");
      await load(session);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not retry email alert.");
    } finally {
      setBusy("");
    }
  }

  async function approve(order: Order) {
    if (!session) return;
    if (!window.confirm(`Confirm ₱${order.amount_php.toLocaleString()} payment for ${order.buyer_email}? This will provision access immediately.`)) return;
    setBusy(order.id); setNotice(""); setError("");
    try {
      const result = await adminFetch<ProvisionResult[]>(session, "rpc/confirm_manual_order", { method: "POST", body: JSON.stringify({ p_order_id: order.id }) });
      const provisioned = result[0];
      setNotice(provisioned ? `Approved. Access code: ${provisioned.access_code}` : "Order approved.");
      await load(session);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Approval failed."); }
    finally { setBusy(""); }
  }

  async function reject(order: Order) {
    if (!session) return;
    const reason = window.prompt("Reason for rejection?", "Payment could not be verified.");
    if (reason === null) return;
    setBusy(order.id); setNotice(""); setError("");
    try {
      await adminFetch(session, "rpc/reject_manual_order", { method: "POST", body: JSON.stringify({ p_order_id: order.id, p_reason: reason }) });
      setNotice("Order rejected.");
      await load(session);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Rejection failed."); }
    finally { setBusy(""); }
  }

  if (checking) return <main className={styles.page}><section className={styles.center}>Checking admin access…</section></main>;
  if (!session) return <main className={styles.page}><section className={styles.center}><h1>Admin sign-in required</h1><p>Sign in through the Fluxora Admin panel first.</p><a href="/admin">Open Admin</a></section></main>;
  if (!authorized) return <main className={styles.page}><section className={styles.center}><h1>Not authorized</h1><a href="/admin">Back to Admin</a></section></main>;

  return <main className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.kicker}>Fluxora checkout</p><h1>Orders</h1><p>{pendingCount} awaiting confirmation</p></div>
      <div className={styles.actions}><button onClick={() => load()} type="button">Refresh</button><a href="/admin">Content Admin</a><a href="/members">Member Manager</a></div>
    </header>

    {(notice || error) && <div className={error ? styles.error : styles.notice}>{error || notice}</div>}

    <section className={styles.emailCard}>
      <div className={styles.emailHead}>
        <div><p className={styles.kicker}>Notifications</p><h2>Gmail order alerts</h2><p>Get an email as soon as a buyer submits GCash payment details. The alert is not proof of payment — verify the actual GCash transaction before approving access.</p></div>
        <span className={styles.emailBadge}>{emailBadge}</span>
      </div>
      <div className={styles.emailGrid}>
        <label>Sender Gmail<input type="email" value={emailSender} onChange={(event) => setEmailSender(event.target.value)} placeholder="yourbusiness@gmail.com" /></label>
        <label>Gmail App Password<input type="password" value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} placeholder={emailConfigured ? "Leave blank to keep current password" : "16-character Google app password"} autoComplete="new-password" /></label>
        <label>Alert recipients <span>comma-separated</span><input value={emailRecipients} onChange={(event) => setEmailRecipients(event.target.value)} placeholder="owner@gmail.com, assistant@gmail.com" /></label>
      </div>
      <label className={styles.emailToggle}><input type="checkbox" checked={emailEnabled} onChange={(event) => setEmailEnabled(event.target.checked)} /><span>Enable new-order email alerts</span></label>
      <div className={styles.emailActions}>
        <button type="button" disabled={emailSaving} onClick={saveEmailSettings}>{emailSaving ? "Saving…" : "Save settings"}</button>
        <button type="button" disabled={!emailConfigured || emailTesting} onClick={testEmail}>{emailTesting ? "Sending…" : "Send test email"}</button>
      </div>
      <p className={styles.emailSecurity}>The Gmail app password is encrypted in Supabase Vault and is never displayed again after saving.</p>
    </section>

    <nav className={styles.filters}>
      {["pending_review", "approved", "rejected", "all"].map((value) => <button className={filter === value ? styles.active : ""} key={value} type="button" onClick={() => setFilter(value)}>{value.replaceAll("_", " ")}</button>)}
    </nav>

    <section className={styles.list}>
      {visible.map((order) => <article className={styles.order} key={order.id}>
        <div className={styles.top}><div><span>{order.order_number}</span><strong>{order.buyer_name}</strong><small>{order.buyer_email}</small></div><div className={styles.price}><strong>₱{order.amount_php.toLocaleString()}</strong><span>{order.tier}</span></div></div>
        <div className={styles.meta}>
          <span><b>Status</b>{order.status.replaceAll("_", " ")}</span>
          <span><b>GCash payer</b>{order.payer_name}</span>
          <span><b>Reference</b>{order.payment_reference}</span>
          <span><b>Submitted</b>{formatDate(order.created_at)}</span>
          <span><b>Email alert</b>{(order.notification_status || "pending").replaceAll("_", " ")}{order.notification_sent_at && <small>{formatDate(order.notification_sent_at)}</small>}</span>
          {order.buyer_phone && <span><b>Phone</b>{order.buyer_phone}</span>}
          {order.approved_at && <span><b>Approved</b>{formatDate(order.approved_at)}</span>}
        </div>
        {order.notification_last_error && <p className={styles.emailError}>Email: {order.notification_last_error}</p>}
        {(order.notification_status === "failed" || order.notification_status === "disabled") && <button className={styles.emailRetry} disabled={busy === `email-${order.id}` || !emailConfigured || !emailEnabled} type="button" onClick={() => retryEmail(order)}>{busy === `email-${order.id}` ? "Retrying…" : "Retry email alert"}</button>}
        {order.payment_proof_url && <a className={styles.proof} href={order.payment_proof_url} target="_blank" rel="noopener noreferrer">Open payment proof ↗</a>}
        {order.rejection_reason && <p className={styles.reason}>{order.rejection_reason}</p>}
        {order.status === "pending_review" && <div className={styles.orderActions}><button className={styles.approve} disabled={busy === order.id} type="button" onClick={() => approve(order)}>{busy === order.id ? "Working…" : "Confirm & Provision"}</button><button className={styles.reject} disabled={busy === order.id} type="button" onClick={() => reject(order)}>Reject</button></div>}
      </article>)}
      {!visible.length && <div className={styles.empty}>No orders in this view.</div>}
    </section>
  </main>;
}
