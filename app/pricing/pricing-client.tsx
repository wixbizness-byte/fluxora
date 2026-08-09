"use client";

import { useEffect, useState } from "react";
import {
  fallbackAccessPlans,
  fallbackPaymentSettings,
  type AccessPlan,
  type PaymentSettings,
} from "../content";
import { isSupabaseConfigured, queryRows } from "../lib/supabase";

function MoonMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M31.8 6.8A17.8 17.8 0 1 0 41.2 34C29 38 17.2 25.6 22.5 13.7c1.9-4.2 5.4-6.1 9.3-6.9Z" />
    </svg>
  );
}

function planFeatures(plan: AccessPlan) {
  return plan.features
    .split("\n")
    .map((feature) => feature.trim())
    .filter(Boolean);
}

function ActionButton({
  label,
  url,
  className,
}: {
  label: string;
  url: string;
  className: string;
}) {
  if (!url) return <span className={`${className} disabled`}>{label}</span>;

  const internal = url.startsWith("/") || url.startsWith("#");

  return (
    <a
      className={className}
      href={url}
      target={internal ? undefined : "_blank"}
      rel={internal ? undefined : "noopener noreferrer"}
    >
      {label}
    </a>
  );
}

function QrBox({ settings }: { settings: PaymentSettings }) {
  const content = settings.qr_image_url ? (
    <img
      src={settings.qr_image_url}
      alt={settings.qr_alt_text || "Fluxora GCash payment QR code"}
      loading="lazy"
    />
  ) : (
    <span className="qr-placeholder">
      <i />
      <b>QR</b>
      <small>Add your Cloudinary QR image in Admin</small>
    </span>
  );

  if (!settings.qr_target_url) {
    return <div className="qr-image-box">{content}</div>;
  }

  return (
    <a
      className="qr-image-box"
      href={settings.qr_target_url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open Fluxora payment link"
    >
      {content}
    </a>
  );
}

export default function PricingClient() {
  const [accessPlans, setAccessPlans] = useState<AccessPlan[]>(fallbackAccessPlans);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(fallbackPaymentSettings);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;

    async function loadPricing() {
      const [plansResult, paymentResult] = await Promise.all([
        queryRows<AccessPlan>("access_plans", "select=*&is_active=eq.true&order=sort_order.asc"),
        queryRows<PaymentSettings>("payment_settings", "select=*&is_active=eq.true&id=eq.main&limit=1"),
      ]);

      if (cancelled) return;

      if (!plansResult.error && plansResult.data?.length) {
        setAccessPlans(plansResult.data);
      }

      if (!paymentResult.error && paymentResult.data?.[0]) {
        setPaymentSettings(paymentResult.data[0]);
      }
    }

    loadPricing().catch((error) =>
      console.warn("Fluxora pricing fallback content is being used.", error),
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main id="top">
      <header className="nav-shell">
        <a className="brand" href="/">
          <MoonMark />
          <span><b>Fluxora</b><small>Create. Ideate. Generate.</small></span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          <a href="/">Home</a>
          <a href="/prompts">Prompts</a>
          <a href="/tools">Tools</a>
          <a href="/pricing">Pricing</a>
        </nav>

        <div className="nav-actions">
          <a
            className="nav-cta"
            href="https://www.facebook.com/meimeidigitalAI"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get access
          </a>
        </div>
      </header>

      <section className="pricing section" id="pricing" style={{ paddingTop: "112px" }}>
        <div className="pricing-wrap">
          <div className="pricing-copy text-motion">
            <p className="eyebrow"><span />Simple access</p>
            <h2>Choose the level that<br /><em>fits your momentum.</em></h2>
            <p>Explore the offers and choose the access level that fits the way you create.</p>
          </div>

          <div className="price-cards">
            {accessPlans.map((plan) => (
              <article
                className={plan.variant === "creator" ? "access-plan creator-plan" : "access-plan"}
                key={plan.id}
              >
                <div className="plan-header">{plan.badge}</div>
                <h3>{plan.title}</h3>
                <p className="plan-description">{plan.description}</p>
                <ul className="plan-features">
                  {planFeatures(plan).map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <ActionButton
                  label={plan.button_label}
                  url={plan.button_url}
                  className={plan.variant === "creator" ? "button primary full" : "button ghost full"}
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      {paymentSettings.is_active && (
        <section className="easy-payments section" id="payments">
          <div className="optional-wrap">
            <div className="optional-copy text-motion">
              <p className="eyebrow"><span />{paymentSettings.eyebrow}</p>
              <h2>{paymentSettings.heading}</h2>
              {paymentSettings.description && <p>{paymentSettings.description}</p>}
              <div className="payment-point">
                <span>{paymentSettings.payment_label}</span>
                <strong>{paymentSettings.payment_number}</strong>
              </div>
            </div>

            <div className="qr-panel">
              <QrBox settings={paymentSettings} />
            </div>
          </div>
        </section>
      )}

      <footer>
        <div className="footer-brand">
          <a className="brand" href="/"><MoonMark /><span><b>Fluxora</b><small>Create. Ideate. Generate.</small></span></a>
          <p>Useful systems for ambitious ideas.</p>
        </div>
        <div><small>Explore</small><a href="/prompts">Prompts</a><a href="/tools">Tools</a><a href="/pricing">Pricing</a></div>
        <div><small>Connect</small><a href="https://t.me/PHAICommunity" target="_blank" rel="noopener noreferrer">Community</a><a href="https://www.facebook.com/meimeidigitalAI" target="_blank" rel="noopener noreferrer">Facebook</a></div>
        <div><small>Manage</small><a href="/admin">Admin panel</a></div>
        <p className="copyright">© 2026 Fluxora. All rights reserved.</p>
      </footer>
    </main>
  );
}
