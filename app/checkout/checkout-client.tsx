"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { fallbackAccessPlans, fallbackPaymentSettings, type AccessPlan, type PaymentSettings } from "../content";
import { isSupabaseConfigured, queryRows } from "../lib/supabase";
import styles from "./checkout.module.css";

const TELEGRAM_URL = "https://t.me/PHAICommunity";

type CheckoutPlan = AccessPlan & {
  price_php?: number | null;
  member_tier?: "Premium" | "Creator" | null;
  checkout_enabled?: boolean;
};

type OrderResult = {
  order_id: string;
  order_number: string;
  status: string;
  amount_php: number;
  plan_title: string;
  buyer_email: string;
  created_at: string;
};

type StatusResult = {
  order_number: string;
  plan_title: string;
  amount_php: number;
  status: string;
  buyer_email: string;
  access_code: string | null;
  member_tier: "Premium" | "Creator" | null;
  created_at: string;
  approved_at: string | null;
  rejection_reason: string | null;
};

function config() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  };
}

async function rpc<T>(name: string, body: Record<string, unknown>) {
  const { url, key } = config();
  if (!url || !key) throw new Error("Checkout is temporarily unavailable.");
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.error || "Checkout request failed.");
  return data as T;
}

export default function CheckoutClient() {
  const [plans, setPlans] = useState<CheckoutPlan[]>(fallbackAccessPlans as CheckoutPlan[]);
  const [payment, setPayment] = useState<PaymentSettings>(fallbackPaymentSettings);
  const [selectedId, setSelectedId] = useState("premium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [statusEmail, setStatusEmail] = useState("");
  const [statusOrder, setStatusOrder] = useState("");
  const [statusResult, setStatusResult] = useState<StatusResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [copiedKey, setCopiedKey] = useState<"" | "payment" | "order" | "access">("");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("plan");
    if (requested) setSelectedId(requested.toLowerCase());
    if (!isSupabaseConfigured()) return;
    Promise.all([
      queryRows<CheckoutPlan>("access_plans", "select=*&is_active=eq.true&checkout_enabled=eq.true&order=sort_order.asc"),
      queryRows<PaymentSettings>("payment_settings", "select=*&is_active=eq.true&id=eq.main&limit=1"),
    ]).then(([planResult, paymentResult]) => {
      if (!planResult.error && planResult.data?.length) setPlans(planResult.data);
      if (!paymentResult.error && paymentResult.data?.[0]) setPayment(paymentResult.data[0]);
    }).catch(() => undefined);
  }, []);

  const selected = useMemo(() => plans.find((plan) => plan.id === selectedId) || plans[0], [plans, selectedId]);
  const amount = selected?.price_php || (selected?.id === "creator" ? 1999 : 599);

  async function copyValue(value: string, key: "payment" | "order" | "access") {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => current === key ? "" : current), 1600);
    } catch {
      setError("Could not copy automatically. Press and hold the value to copy it.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setOrder(null);
    const data = new FormData(event.currentTarget);
    try {
      const result = await rpc<OrderResult[]>("create_checkout_order", {
        p_plan_id: selected.id,
        p_buyer_name: String(data.get("buyer_name") || ""),
        p_buyer_email: String(data.get("buyer_email") || ""),
        p_buyer_phone: String(data.get("buyer_phone") || ""),
        p_payer_name: String(data.get("payer_name") || ""),
        p_payment_reference: String(data.get("payment_reference") || ""),
        p_payment_proof_url: String(data.get("payment_proof_url") || ""),
      });
      const created = result[0];
      if (!created) throw new Error("Order could not be created.");
      setOrder(created);
      setStatusOrder(created.order_number);
      setStatusEmail(created.buyer_email);
      event.currentTarget.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Order could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  async function checkStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecking(true);
    setError("");
    setStatusResult(null);
    try {
      const result = await rpc<StatusResult[]>("get_checkout_order_status", {
        p_order_number: statusOrder,
        p_buyer_email: statusEmail,
      });
      if (!result[0]) throw new Error("No matching order was found.");
      setStatusResult(result[0]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not check order status.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.brand}>Fluxora</a>
        <a href="/pricing" className={styles.back}>Back to pricing</a>
      </header>

      <section className={styles.hero}>
        <p className={styles.kicker}>GCash checkout</p>
        <h1>Pay with GCash. We’ll activate your Fluxora access after verification.</h1>
        <p>Send the exact amount, submit your GCash reference, then continue to Telegram. Your access is activated only after the payment is verified.</p>
      </section>

      <section className={styles.grid}>
        <div className={styles.card}>
          <h2>1. Pay with GCash</h2>
          <div className={styles.planGrid}>
            {plans.map((plan) => {
              const price = plan.price_php || (plan.id === "creator" ? 1999 : 599);
              return <button type="button" key={plan.id} onClick={() => setSelectedId(plan.id)} className={selected?.id === plan.id ? styles.planActive : styles.plan}>
                <span>{plan.title}</span><strong>₱{price.toLocaleString()}</strong>
              </button>;
            })}
          </div>

          <div className={styles.paymentBox}>
            <div>
              <span>{payment.payment_label}</span>
              <button type="button" className={styles.copyValue} onClick={() => copyValue(payment.payment_number, "payment")}>
                <strong>{payment.payment_number}</strong>
                <small>{copiedKey === "payment" ? "Copied!" : "Tap to copy"}</small>
              </button>
            </div>
            {payment.qr_image_url && <img src={payment.qr_image_url} alt={payment.qr_alt_text || "Fluxora GCash QR"} />}
          </div>
          <p className={styles.note}>Send exactly <strong>₱{amount.toLocaleString()}</strong>. Save the GCash reference number shown after payment—you’ll need it below.</p>
        </div>

        <form className={styles.card} onSubmit={submit}>
          <h2>2. Submit payment details</h2>
          <label>Full name<input name="buyer_name" required /></label>
          <label>Gmail for Fluxora access<input name="buyer_email" type="email" required placeholder="you@gmail.com" /></label>
          <label>Mobile number <span>optional</span><input name="buyer_phone" inputMode="tel" /></label>
          <label>GCash payer name<input name="payer_name" required /></label>
          <label>GCash reference number<input name="payment_reference" required inputMode="numeric" /></label>
          <label>Payment proof link <span>optional</span><input name="payment_proof_url" type="url" placeholder="Cloudinary/Drive image link" /></label>
          <button className={styles.primary} disabled={submitting} type="submit">{submitting ? "Submitting…" : `I paid ₱${amount.toLocaleString()} — Submit`}</button>
          <p className={styles.formHint}>Submitting this form does not activate access by itself. Fluxora verifies the GCash payment first.</p>
          {error && <p className={styles.error}>{error}</p>}
        </form>
      </section>

      {order && <section className={styles.success}>
        <p className={styles.kicker}>Payment details received</p>
        <button type="button" className={styles.orderCopy} onClick={() => copyValue(order.order_number, "order")}>
          <strong>{order.order_number}</strong>
          <small>{copiedKey === "order" ? "Copied!" : "Tap to copy order number"}</small>
        </button>
        <p>Your order is now <strong>Pending Review</strong>. Keep this order number. After Fluxora verifies your GCash payment, your member access will be provisioned automatically.</p>
        <a className={styles.telegramButton} href={TELEGRAM_URL} target="_blank" rel="noreferrer">Continue to Telegram</a>
        <p className={styles.successNote}>For faster assistance, send your order number in Telegram: <strong>{order.order_number}</strong></p>
      </section>}

      <section className={styles.statusCard}>
        <div><p className={styles.kicker}>Already submitted?</p><h2>Check order status</h2><p>Use the order number and Gmail from checkout.</p></div>
        <form onSubmit={checkStatus}>
          <input value={statusOrder} onChange={(e) => setStatusOrder(e.target.value)} required placeholder="Order number" />
          <input value={statusEmail} onChange={(e) => setStatusEmail(e.target.value)} required type="email" placeholder="Gmail" />
          <button type="submit" disabled={checking}>{checking ? "Checking…" : "Check status"}</button>
        </form>
        {statusResult && <div className={styles.statusResult}>
          <strong>{statusResult.status.replaceAll("_", " ")}</strong>
          <span>{statusResult.plan_title} · ₱{statusResult.amount_php.toLocaleString()}</span>
          {statusResult.status === "approved" && statusResult.access_code && <>
            <p>Your Fluxora access is active.</p>
            <button type="button" className={styles.accessCodeCopy} onClick={() => copyValue(statusResult.access_code!, "access")}>
              <code>{statusResult.access_code}</code>
              <small>{copiedKey === "access" ? "Copied!" : "Tap to copy"}</small>
            </button>
            <a href="/members">Open member portal</a>
          </>}
          {statusResult.status === "rejected" && <><p>{statusResult.rejection_reason || "Please contact Fluxora support for payment review."}</p><a href={TELEGRAM_URL} target="_blank" rel="noreferrer">Contact Fluxora on Telegram</a></>}
        </div>}
      </section>
    </main>
  );
}
