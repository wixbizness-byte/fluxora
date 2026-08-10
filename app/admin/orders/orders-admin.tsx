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
};

type ProvisionResult = {
  order_id: string;
  member_id: string;
  access_code: string;
  order_status: string;
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

  useEffect(() => { verify().catch((reason) => { setError(reason instanceof Error ? reason.message : "Could not verify admin access."); setChecking(false); }); }, []);
  useEffect(() => { if (authorized && session) load(session).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load orders.")); }, [authorized, session]);

  const visible = useMemo(() => filter === "all" ? orders : orders.filter((order) => order.status === filter), [orders, filter]);
  const pendingCount = orders.filter((order) => order.status === "pending_review").length;

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
          {order.buyer_phone && <span><b>Phone</b>{order.buyer_phone}</span>}
          {order.approved_at && <span><b>Approved</b>{formatDate(order.approved_at)}</span>}
        </div>
        {order.payment_proof_url && <a className={styles.proof} href={order.payment_proof_url} target="_blank" rel="noopener noreferrer">Open payment proof ↗</a>}
        {order.rejection_reason && <p className={styles.reason}>{order.rejection_reason}</p>}
        {order.status === "pending_review" && <div className={styles.orderActions}><button className={styles.approve} disabled={busy === order.id} type="button" onClick={() => approve(order)}>{busy === order.id ? "Working…" : "Confirm & Provision"}</button><button className={styles.reject} disabled={busy === order.id} type="button" onClick={() => reject(order)}>Reject</button></div>}
      </article>)}
      {!visible.length && <div className={styles.empty}>No orders in this view.</div>}
    </section>
  </main>;
}
