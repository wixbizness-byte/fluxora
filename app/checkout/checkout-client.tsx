"use client";

import { Check, CheckCircle2, Copy, ExternalLink, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "../components/fluxora";
import {
  fallbackAccessPlans,
  fallbackPaymentSettings,
  type AccessPlan,
  type PaymentSettings,
} from "../content";
import { isSupabaseConfigured, queryRows } from "../lib/supabase";
import styles from "./checkout.module.css";

const PURCHASED_URL = "https://t.me/meimeiwix";

type CheckoutPlan = AccessPlan;

type CheckoutClientProps = {
  initialPlans: CheckoutPlan[];
  initialPayment: PaymentSettings;
  initialPlanId: string;
  requestedPlanId: string;
};

function fallbackPrice(planId: string | undefined) {
  if (planId === "tool") return 249;
  if (planId === "creator") return 1999;
  return 599;
}

function planDisplayName(plan: CheckoutPlan | undefined) {
  if (!plan) return "Fluxora access";
  if (plan.id === "tool") return "Tool";
  if (plan.id === "premium") return "Premium";
  if (plan.id === "creator") return "Creator";
  return plan.title.replace(/\s*\(₱?[\d,]+\)\s*$/i, "").trim() || plan.title;
}

function activeCheckoutPlans(plans: CheckoutPlan[]) {
  return plans.filter((plan) => plan.is_active && plan.checkout_enabled !== false);
}

export default function CheckoutClient({
  initialPlans,
  initialPayment,
  initialPlanId,
  requestedPlanId,
}: CheckoutClientProps) {
  const [plans, setPlans] = useState<CheckoutPlan[]>(
    initialPlans.length ? initialPlans : activeCheckoutPlans(fallbackAccessPlans),
  );
  const [payment, setPayment] = useState<PaymentSettings>(
    initialPayment || fallbackPaymentSettings,
  );
  const [selectedId, setSelectedId] = useState(initialPlanId);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    Promise.all([
      queryRows<CheckoutPlan>(
        "access_plans",
        "select=*&is_active=eq.true&checkout_enabled=eq.true&order=sort_order.asc",
      ),
      queryRows<PaymentSettings>(
        "payment_settings",
        "select=*&is_active=eq.true&id=eq.main&limit=1",
      ),
    ])
      .then(([planResult, paymentResult]) => {
        const livePlans = activeCheckoutPlans(planResult.data || []);

        if (!planResult.error && livePlans.length) {
          setPlans(livePlans);
          setSelectedId((current) => {
            const requested = requestedPlanId
              ? livePlans.find((plan) => plan.id.toLowerCase() === requestedPlanId)
              : undefined;
            if (requested) return requested.id;
            if (livePlans.some((plan) => plan.id === current)) return current;
            return livePlans[0]?.id || current;
          });
        }

        if (!paymentResult.error && paymentResult.data?.[0]) {
          setPayment(paymentResult.data[0]);
        }
      })
      .catch(() => undefined);
  }, [requestedPlanId]);

  const selected = useMemo(
    () => plans.find((plan) => plan.id === selectedId) || plans[0],
    [plans, selectedId],
  );
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
    <section className={styles.checkoutWorkspace} aria-label="Checkout purchase">
      <Card elevated className={styles.checkoutCard}>
        <div className={styles.workspaceGrid}>
          <section className={styles.planSection} aria-labelledby="plan-heading">
            <div className={styles.sectionHeader}>
              <span className={styles.stepLabel}>Step 1</span>
              <div>
                <h2 id="plan-heading">Choose your access</h2>
                <p>Select the Fluxora plan you want to purchase.</p>
              </div>
            </div>

            <div className={styles.planGrid} aria-label="Fluxora access plans">
              {plans.map((plan) => {
                const price = plan.price_php || fallbackPrice(plan.id);
                const active = selected?.id === plan.id;

                return (
                  <button
                    type="button"
                    key={plan.id}
                    aria-pressed={active}
                    onClick={() => setSelectedId(plan.id)}
                    className={active ? styles.planActive : styles.plan}
                  >
                    <span className={styles.planName}>{planDisplayName(plan)}</span>
                    <strong>₱{price.toLocaleString()}</strong>
                    <span className={styles.planState}>
                      {active ? <Check size={14} aria-hidden="true" /> : null}
                      {active ? "Selected" : "Choose"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={styles.selectedSummary} aria-live="polite">
              <span>Selected access</span>
              <div>
                <strong>{planDisplayName(selected)}</strong>
                <b>₱{amount.toLocaleString()}</b>
              </div>
            </div>
          </section>

          <section className={styles.paymentSection} aria-labelledby="payment-heading">
            <div className={styles.sectionHeader}>
              <span className={styles.paymentIcon} aria-hidden="true">
                <Smartphone size={18} />
              </span>
              <div>
                <h2 id="payment-heading">GCash payment</h2>
                <p>Use the details below and send the exact selected amount.</p>
              </div>
            </div>

            <div
              className={`${styles.paymentDetails} ${
                payment.qr_image_url ? "" : styles.paymentDetailsNoQr
              }`.trim()}
            >
              <div className={styles.paymentNumberBlock}>
                <span>{payment.payment_label}</span>
                <button
                  type="button"
                  className={styles.copyValue}
                  onClick={copyPaymentNumber}
                  aria-label={`Copy GCash number ${payment.payment_number}`}
                >
                  <strong>{payment.payment_number}</strong>
                  <small aria-live="polite">
                    {copied ? <CheckCircle2 size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {copied ? "Copied" : "Copy number"}
                  </small>
                </button>
              </div>

              {payment.qr_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className={styles.qrImage}
                  src={payment.qr_image_url}
                  alt={payment.qr_alt_text || "Fluxora GCash QR"}
                />
              ) : null}
            </div>

            <div className={styles.amountCallout} aria-live="polite">
              <span>Send this exact amount</span>
              <strong>₱{amount.toLocaleString()}</strong>
              <p>
                Send exactly <b>₱{amount.toLocaleString()}</b> for <b>{planDisplayName(selected)}</b>.
              </p>
            </div>
          </section>
        </div>

        <section className={styles.finishSection} aria-labelledby="finish-heading">
          <div>
            <span className={styles.stepLabel}>Step 2</span>
            <h2 id="finish-heading">Finished paying?</h2>
            <p>
              After sending your GCash payment, message Fluxora with your payment confirmation so your purchase can be processed.
            </p>
          </div>

          <Button
            className={styles.purchaseButton}
            href={PURCHASED_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            I purchased
            <ExternalLink size={16} aria-hidden="true" />
          </Button>
        </section>
      </Card>
    </section>
  );
}
