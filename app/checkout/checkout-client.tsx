"use client";

import { useEffect, useMemo, useState } from "react";
import { fallbackAccessPlans, fallbackPaymentSettings, type AccessPlan, type PaymentSettings } from "../content";
import { isSupabaseConfigured, queryRows } from "../lib/supabase";
import styles from "./checkout.module.css";

const PURCHASED_URL = "https://t.me/meimeiwix";

type CheckoutPlan = AccessPlan;

function fallbackPrice(planId: string | undefined) {
  if (planId === "tool") return 249;
  if (planId === "creator") return 1999;
  return 599;
}

export default function CheckoutClient() {
  const [plans, setPlans] = useState<CheckoutPlan[]>(fallbackAccessPlans);
  const [payment, setPayment] = useState<PaymentSettings>(fallbackPaymentSettings);
  const [selectedId, setSelectedId] = useState("premium");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("plan");
    if (requested) setSelectedId(requested.toLowerCase());
    if (!isSupabaseConfigured()) return;

    Promise.all([
      queryRows<CheckoutPlan>("access_plans", "select=*&is_active=eq.true&checkout_enabled=eq.true&order=sort_order.asc"),
      queryRows<PaymentSettings>("payment_settings", "select=*&is_active=eq.true&id=eq.main&limit=1"),
    ])
      .then(([planResult, paymentResult]) => {
        if (!planResult.error && planResult.data?.length) setPlans(planResult.data);
        if (!paymentResult.error && paymentResult.data?.[0]) setPayment(paymentResult.data[0]);
      })
      .catch(() => undefined);
  }, []);

  const selected = useMemo(() => plans.find((plan) => plan.id === selectedId) || plans[0], [plans, selectedId]);
  const amount = selected?.price_php || fallbackPrice(selected?.id);

  async function copyPaymentNumber() {
    try {
      await navigator.clipboard.writeText(payment.payment_number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
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
        <h1>Pay with GCash, then message Fluxora to confirm your purchase.</h1>
        <p>Send the exact amount using the details below. Once payment is complete, tap “I purchased” to continue directly to Fluxora on Telegram.</p>
      </section>

      <section className={styles.grid}>
        <div className={styles.card}>
          <h2>1. Pay with GCash</h2>

          <div className={styles.planGrid}>
            {plans.map((plan) => {
              const price = plan.price_php || fallbackPrice(plan.id);
              return (
                <button
                  type="button"
                  key={plan.id}
                  onClick={() => setSelectedId(plan.id)}
                  className={selected?.id === plan.id ? styles.planActive : styles.plan}
                >
                  <span>{plan.title}</span>
                  <strong>₱{price.toLocaleString()}</strong>
                </button>
              );
            })}
          </div>

          <div className={styles.paymentBox}>
            <div>
              <span>{payment.payment_label}</span>
              <button type="button" className={styles.copyValue} onClick={copyPaymentNumber}>
                <strong>{payment.payment_number}</strong>
                <small>{copied ? "Copied!" : "Tap to copy"}</small>
              </button>
            </div>
            {payment.qr_image_url && (
              <img src={payment.qr_image_url} alt={payment.qr_alt_text || "Fluxora GCash QR"} />
            )}
          </div>

          <p className={styles.note}>
            Send exactly <strong>₱{amount.toLocaleString()}</strong> for <strong>{selected?.title || "Fluxora access"}</strong>.
          </p>
        </div>

        <div className={styles.card}>
          <h2>2. Finished paying?</h2>
          <p className={styles.formHint}>Tap the button below and send Fluxora your payment confirmation on Telegram.</p>
          <a className={styles.primary} href={PURCHASED_URL} target="_blank" rel="noreferrer">
            I purchased
          </a>
        </div>
      </section>
    </main>
  );
}
