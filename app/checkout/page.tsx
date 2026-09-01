import type { Metadata } from "next";
import { Badge, PageContainer, SiteFooter, SiteHeader } from "../components/fluxora";
import {
  fallbackAccessPlans,
  fallbackPaymentSettings,
  type AccessPlan,
  type PaymentSettings,
} from "../content";
import { isSupabaseConfigured, queryRows } from "../lib/supabase";
import CheckoutClient from "./checkout-client";
import styles from "./checkout.module.css";

export const metadata: Metadata = {
  title: "Checkout | Fluxora",
  description: "Complete your Fluxora purchase through GCash and continue to payment confirmation.",
};

const NAV_LINKS = [
  { href: "/start", label: "Guide" },
  { href: "/prompts", label: "Prompts" },
  { href: "/tools", label: "Tools" },
  { href: "/member", label: "Member" },
];

const FOOTER_LINKS = [
  ...NAV_LINKS,
  { href: "/pricing", label: "Pricing" },
];

type CheckoutPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizePlanIdentifier(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return "";

  const normalized = candidate.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(normalized) ? normalized : "";
}

function validCheckoutPlans(plans: AccessPlan[]) {
  return plans.filter((plan) => plan.is_active && plan.checkout_enabled !== false);
}

async function loadCheckoutData() {
  const fallbackPlans = validCheckoutPlans(fallbackAccessPlans);
  if (!isSupabaseConfigured()) {
    return { plans: fallbackPlans, payment: fallbackPaymentSettings };
  }

  try {
    const [planResult, paymentResult] = await Promise.all([
      queryRows<AccessPlan>(
        "access_plans",
        "select=*&is_active=eq.true&checkout_enabled=eq.true&order=sort_order.asc",
      ),
      queryRows<PaymentSettings>(
        "payment_settings",
        "select=*&is_active=eq.true&id=eq.main&limit=1",
      ),
    ]);

    const livePlans = validCheckoutPlans(planResult.data || []);
    return {
      plans: !planResult.error && livePlans.length ? livePlans : fallbackPlans,
      payment:
        !paymentResult.error && paymentResult.data?.[0]
          ? paymentResult.data[0]
          : fallbackPaymentSettings,
    };
  } catch {
    return { plans: fallbackPlans, payment: fallbackPaymentSettings };
  }
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const [params, checkoutData] = await Promise.all([searchParams, loadCheckoutData()]);
  const requestedPlanId = normalizePlanIdentifier(params.plan);
  const requestedPlan = checkoutData.plans.find(
    (plan) => plan.id.toLowerCase() === requestedPlanId,
  );
  const initialPlanId = requestedPlan?.id || checkoutData.plans[0]?.id || "";

  return (
    <div className={`fluxora-theme ${styles.page}`}>
      <SiteHeader
        links={NAV_LINKS}
        cta={{ href: "/pricing", label: "Back to Pricing" }}
      />

      <main className={styles.main}>
        <PageContainer>
          <section className={styles.intro} aria-labelledby="checkout-heading">
            <Badge variant="brand">Checkout</Badge>
            <h1 id="checkout-heading">Complete your Fluxora purchase.</h1>
            <p>
              Choose your access, send the exact GCash amount, then message Fluxora with your payment confirmation.
            </p>
          </section>

          <CheckoutClient
            initialPlans={checkoutData.plans}
            initialPayment={checkoutData.payment}
            initialPlanId={initialPlanId}
            requestedPlanId={requestedPlanId}
          />
        </PageContainer>
      </main>

      <SiteFooter links={FOOTER_LINKS} meta="© 2026 Fluxora" />
    </div>
  );
}
