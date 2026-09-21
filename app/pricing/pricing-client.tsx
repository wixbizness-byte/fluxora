"use client";

import { ArrowRight, CalendarDays, Check, ChevronDown, Layers, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { SiteFooter } from "../components/fluxora/site-footer";
import { SiteHeader } from "../components/fluxora/site-header";
import {
  fallbackAccessPlans,
  type AccessPlan,
  type PricingResource,
} from "../content";
import { isSupabaseConfigured, queryRows } from "../lib/supabase";
import styles from "./pricing-page.module.css";

type PlanTier = "Tool" | "Premium" | "Creator";
type PaymentCount = 1 | 2 | 3;

const INTERVAL_DAYS = 30;

const exactPlanCopy = {
  premium: {
    title: "Premium",
    badge: "Starter",
    description: "Everything you need to start creating with AI.",
    price: 999,
    lead: null,
    features: [
      ["Prompts", false],
      ["Tools", false],
      ["Custom GPTs", false],
      ["Courses", false],
      ["Web Access", false],
    ] as const,
  },
  creator: {
    title: "Creator",
    badge: "Endgame",
    description: "The full vault, from idea to finished result.",
    price: 1999,
    lead: "Everything in Premium, expanded",
    features: [
      ["Prompts+", false],
      ["Tools+", false],
      ["Custom GPTs+", false],
      ["Courses+", false],
      ["Web Access+", false],
      ["Workflows", true],
      ["Secret Methods", true],
    ] as const,
  },
} as const;

const toolsOnlyCopy = {
  name: "Tools only",
  monthly: 100,
  description: "Just the Fluxora tools catalog, billed monthly.",
  included: ["Every tool in the Fluxora tools catalog", "New tools as they are added"],
  excluded: ["Prompts", "Custom GPTs", "Courses", "Web Access", "Workflows and Secret Methods"],
  billing: "You pay ₱100 each month to keep access to the tools.",
};

const exactFaqs = [
  ["What is the difference between Premium and Creator?", "Premium includes prompts, tools, Custom GPTs, courses, and web access. Creator expands all of those and adds Workflows and Secret Methods."],
  ["How do installments work?", "Pick 2 or 3 months before checkout. Your first payment unlocks full access right away, and the next payments are due every 30 days. The total is the same as paying in full."],
  ["What happens if I miss a payment?", "Your access pauses until the missed payment is settled. Nothing is deleted, and access returns as soon as you pay."],
  ["Can I start with Premium and upgrade later?", "Yes. Pay the difference between Premium and Creator to upgrade. Message us in the community to arrange it."],
  ["Is this a subscription?", "Premium and Creator are one-time purchases. Installments only split that one price into smaller payments. Tools only is the one monthly plan."],
  ["What is Tools only?", "Access to the Fluxora tools catalog for ₱100 a month. It does not include prompts, Custom GPTs, courses, or anything else in Premium."],
  ["Do I need technical experience?", "No. Fluxora is built around clear outcomes and guided steps rather than technical setup."],
  ["Who is behind Fluxora?", "Meimei Digitals owns and runs Fluxora."],
  ["Where does the community live?", "The Fluxora creator community is on Telegram."],
] as const;

function planTier(plan: AccessPlan): PlanTier {
  if (plan.member_tier === "Tool" || plan.id === "tool") return "Tool";
  if (plan.member_tier === "Creator" || plan.id === "creator") return "Creator";
  return "Premium";
}

function planTabLabel(plan: AccessPlan) {
  return planTier(plan) === "Tool" ? "Tools" : planTier(plan);
}

function resourceAllowed(resource: PricingResource, tier: PlanTier) {
  if (tier === "Tool") return resource.tool_type === "Tool" && resource.access_level === "All";
  if (tier === "Creator") return true;
  return resource.access_level === "All" || resource.access_level === "Premium";
}

function categoryLabel(category: PricingResource["tool_type"]) {
  if (category === "CustomGPT") return "Custom GPTs";
  if (category === "Workflow") return "Workflows";
  return "Tools";
}

function categoryOrder(tier: PlanTier): PricingResource["tool_type"][] {
  if (tier === "Creator") return ["Workflow", "CustomGPT", "Tool"];
  if (tier === "Premium") return ["CustomGPT", "Tool"];
  return ["Tool"];
}

function priceLabel(plan: AccessPlan) {
  const fallbackPrices: Record<string, number> = { tool: 100, premium: 999, creator: 1999 };
  return `₱${Number(plan.price_php ?? fallbackPrices[plan.id] ?? 0).toLocaleString("en-PH")}`;
}

function peso(value: number) {
  return `₱${value.toLocaleString("en-PH")}`;
}

function splitPrice(price: number, count: PaymentCount) {
  const base = Math.floor(price / count);
  const extra = price - base * count;
  return Array.from({ length: count }, (_, index) => base + (index === 0 ? extra : 0));
}

function paymentPriceCopy(price: number, count: PaymentCount) {
  if (count === 1) {
    return {
      amount: peso(price),
      unit: "once",
      note: "Paid once. No renewals.",
    };
  }

  const parts = splitPrice(price, count);
  const even = parts.every((part) => part === parts[0]);
  return {
    amount: peso(parts[0]),
    unit: even ? `/month for ${count} months` : "today",
    note: even
      ? `Total ${peso(price)}, same as paying in full.`
      : `Then ${peso(parts[1])} monthly for ${count - 1} more ${count - 1 === 1 ? "month" : "months"}. Total ${peso(price)}, same as paying in full.`,
  };
}

function dueLabel(index: number) {
  return index === 0 ? "Today" : `Day ${index * INTERVAL_DAYS}`;
}

export default function PricingClient() {
  const [accessPlans, setAccessPlans] = useState<AccessPlan[]>(fallbackAccessPlans);
  const [pricingResources, setPricingResources] = useState<PricingResource[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("tool");
  const [selectedResource, setSelectedResource] = useState<PricingResource | null>(null);
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);
  const [payments, setPayments] = useState<PaymentCount>(1);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const resourcesRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const initial = Number(new URLSearchParams(window.location.search).get("installments") || 1);
    if (initial === 2 || initial === 3) setPayments(initial);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;

    async function loadPricingCatalog() {
      const [plansResult, resourcesResult] = await Promise.all([
        queryRows<AccessPlan>("access_plans", "select=*&is_active=eq.true&order=sort_order.asc"),
        queryRows<PricingResource>("pricing_resources_public", "select=*&order=sort_order.asc,title.asc"),
      ]);

      if (cancelled) return;
      if (!plansResult.error && plansResult.data?.length) setAccessPlans(plansResult.data);
      if (!resourcesResult.error && resourcesResult.data) setPricingResources(resourcesResult.data);
    }

    loadPricingCatalog().catch((error) => console.warn("Fluxora pricing fallback content is being used.", error));
    return () => { cancelled = true; };
  }, []);

  const pricingPlans = useMemo(
    () => accessPlans.filter((plan) => ["tool", "premium", "creator"].includes(plan.id)).sort((a, b) => a.sort_order - b.sort_order),
    [accessPlans],
  );
  const selectedPlan = pricingPlans.find((plan) => plan.id === selectedPlanId) || pricingPlans[0];
  const selectedTier = selectedPlan ? planTier(selectedPlan) : "Tool";
  const selectedResources = useMemo(
    () => pricingResources.filter((resource) => resourceAllowed(resource, selectedTier)),
    [pricingResources, selectedTier],
  );
  const resourceCounts = useMemo(
    () => categoryOrder(selectedTier)
      .map((type) => ({ type, count: selectedResources.filter((resource) => resource.tool_type === type).length }))
      .filter((entry) => entry.count > 0),
    [selectedResources, selectedTier],
  );
  const primaryPlans = pricingPlans.filter((plan) => planTier(plan) !== "Tool");
  const toolPlan = pricingPlans.find((plan) => planTier(plan) === "Tool");

  useEffect(() => {
    if (!selectedResource) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedResource(null);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedResource]);

  function choosePlan(planId: string, scrollToResources = false) {
    setSelectedPlanId(planId);
    setSelectedResource(null);
    if (scrollToResources) {
      window.requestAnimationFrame(() => resourcesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  function handleTabKeys(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!pricingPlans.length || !["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? pricingPlans.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + pricingPlans.length) % pricingPlans.length;
    choosePlan(pricingPlans[nextIndex].id);
    document.getElementById(`pricing-resource-tab-${pricingPlans[nextIndex].id}`)?.focus();
  }

  function closePreview() {
    setSelectedResource(null);
    triggerRef.current?.focus();
  }

  return (
    <div className={`${styles.pricingPage} fluxora-theme`} data-home-theme="gold">
      <SiteHeader
        links={[
          { href: "/start", label: "Guide" },
          { href: "/prompts", label: "Prompts" },
          { href: "/tools", label: "Tools" },
          { href: "/pricing", label: "Pricing" },
          { href: "/member", label: "Member" },
        ]}
        cta={{ href: "/refer", label: "Refer & Earn" }}
      />

      <main className={styles.main}>
        <div className={styles.shell}>
          <section className={styles.intro} aria-labelledby="pricing-heading">
            <h1 id="pricing-heading">One-time access. Pay it all now, or over 3 months.</h1>
            <p>Premium and Creator are one-time purchases. Split either into 2 or 3 monthly payments with no added fees.</p>

            <fieldset className={styles.paymentChoice}>
              <legend>How do you want to pay?</legend>
              <div className={styles.paymentSegments}>
                {([
                  [1, "Pay in full", "One payment"],
                  [2, "2 months", "2 payments"],
                  [3, "3 months", "3 payments"],
                ] as const).map(([count, label, sublabel]) => (
                  <label className={payments === count ? styles.paymentSegmentActive : styles.paymentSegment} key={count}>
                    <input
                      type="radio"
                      name="payment-count"
                      value={count}
                      checked={payments === count}
                      onChange={() => setPayments(count)}
                    />
                    <span>{label}<small>{sublabel}</small></span>
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          {primaryPlans.length ? (
            <section className={styles.planGrid} aria-label="Fluxora access plans">
              {primaryPlans.map((plan) => {
                const tier = planTier(plan);
                if (tier !== "Premium" && tier !== "Creator") return null;

                const isCreator = tier === "Creator";
                const copy = exactPlanCopy[plan.id as "premium" | "creator"];
                const checkoutEnabled = plan.checkout_enabled !== false;
                const display = paymentPriceCopy(copy.price, payments);
                const schedule = splitPrice(copy.price, payments);
                const checkoutUrl = `/checkout?plan=${encodeURIComponent(plan.id)}${payments > 1 ? `&installments=${payments}` : ""}`;
                const cta = payments === 1 ? `Get ${copy.title}` : `Pay ${peso(schedule[0])} and start`;

                return (
                  <article
                    className={[styles.planCard, isCreator ? styles.creatorPlan : styles.premiumPlan].join(" ")}
                    key={plan.id}
                  >
                    <div className={styles.planHead}>
                      <h2>{copy.title}</h2>
                      <span className={styles.planBadge}>{copy.badge}</span>
                    </div>

                    <p className={styles.planDescription}>{copy.description}</p>

                    <div className={styles.priceArea} aria-live="polite">
                      <div className={styles.priceBlock}>
                        <strong>{display.amount}</strong>
                        <span>{display.unit}</span>
                      </div>
                      <p className={styles.priceNote}>{display.note}</p>
                    </div>

                    {payments === 1 ? (
                      <div className={styles.planDivider} aria-hidden="true" />
                    ) : (
                      <ol className={styles.paymentSchedule} aria-label={`${copy.title} payment schedule`}>
                        {schedule.map((part, index) => (
                          <li key={`${copy.title}-payment-${index}`}>
                            <b>{peso(part)}</b>
                            <span>{dueLabel(index)}</span>
                          </li>
                        ))}
                      </ol>
                    )}

                    {copy.lead ? (
                      <div className={styles.creatorLead}>
                        <span aria-hidden="true">+</span>
                        <strong>{copy.lead}</strong>
                      </div>
                    ) : null}

                    <ul className={styles.featureList}>
                      {copy.features.map(([feature, creatorOnly]) => (
                        <li key={feature}>
                          <Check size={16} aria-hidden="true" />
                          <span>{feature}</span>
                          {creatorOnly ? <em className={styles.creatorOnlyPill}>Creator only</em> : null}
                        </li>
                      ))}
                    </ul>

                    {checkoutEnabled ? (
                      <a className={isCreator ? styles.creatorButton : styles.premiumButton} href={checkoutUrl}>
                        {cta}
                      </a>
                    ) : <span className={styles.disabledButton}>Checkout unavailable</span>}

                    {payments > 1 ? (
                      <p className={styles.planFine}>{payments} payments, {INTERVAL_DAYS} days apart. No added fees.</p>
                    ) : null}
                  </article>
                );
              })}
            </section>
          ) : null}

          {toolPlan ? (
            <aside className={styles.toolStrip} aria-labelledby="tool-plan-heading">
              <div className={styles.toolStripInfo}>
                <h2 id="tool-plan-heading">{toolsOnlyCopy.name}</h2>
                <p>{toolsOnlyCopy.description}</p>
                <small>Staying 10 months or more? <b>Premium includes every tool for ₱999 once.</b></small>
              </div>

              <div className={styles.toolStripPrice}>
                <strong>₱100</strong>
                <span>/month</span>
              </div>

              {toolPlan.checkout_enabled !== false ? (
                <a className={styles.toolButton} href="/checkout?plan=tools-monthly">Get Tools only</a>
              ) : <span className={styles.disabledButton}>Checkout unavailable</span>}

              <details className={styles.toolDetails}>
                <summary>What&apos;s in Tools only <ChevronDown size={16} aria-hidden="true" /></summary>
                <div className={styles.toolDetailsGrid}>
                  <div>
                    <h3>Included</h3>
                    <ul>
                      {toolsOnlyCopy.included.map((item) => <li key={item}><Check size={15} aria-hidden="true" /><span>{item}</span></li>)}
                    </ul>
                  </div>
                  <div className={styles.toolExcluded}>
                    <h3>Not included</h3>
                    <ul>
                      {toolsOnlyCopy.excluded.map((item) => <li key={item}><X size={15} aria-hidden="true" /><span>{item}</span></li>)}
                    </ul>
                  </div>
                  <div>
                    <h3>Billing</h3>
                    <p>{toolsOnlyCopy.billing}</p>
                    <a href="/tools">See every tool in the catalog</a>
                  </div>
                </div>
              </details>
            </aside>
          ) : null}

          <p className={styles.installmentTerms}>
            <CalendarDays size={18} aria-hidden="true" />
            <span><b>How installments work:</b> your first payment unlocks full access right away. The next payments are due every 30 days. If a payment is missed, access pauses until it&apos;s settled.</span>
          </p>

          {selectedPlan ? (
            <section className={styles.resourcesSection} ref={resourcesRef} aria-labelledby="resources-heading">
              <div className={styles.sectionIntro}>
                <p className={styles.eyebrow}>Included resources</p>
                <h2 id="resources-heading">See what comes with your access.</h2>
                <p>Switch tiers to compare the live Fluxora catalog before checkout.</p>
              </div>

              <div className={styles.resourceTabs} role="tablist" aria-label="Compare included resources by tier">
                {pricingPlans.map((plan, index) => (
                  <button
                    className={plan.id === selectedPlan.id ? styles.resourceTabActive : styles.resourceTab}
                    id={`pricing-resource-tab-${plan.id}`}
                    type="button"
                    role="tab"
                    aria-selected={plan.id === selectedPlan.id}
                    aria-controls="pricing-resource-panel"
                    key={plan.id}
                    onClick={() => choosePlan(plan.id)}
                    onKeyDown={(event) => handleTabKeys(event, index)}
                  >
                    {planTabLabel(plan)}
                  </button>
                ))}
              </div>

              <div className={styles.resourcePanel} id="pricing-resource-panel" role="tabpanel" aria-labelledby={`pricing-resource-tab-${selectedPlan.id}`}>
                <div className={styles.resourceSummary}>
                  <div>
                    <span>{planTabLabel(selectedPlan)} access</span>
                    <strong>{priceLabel(selectedPlan)}{selectedTier === "Tool" ? "/month" : ""}</strong>
                  </div>
                  <div className={styles.countList}>
                    {resourceCounts.map(({ type, count }) => <span key={type}><b>{count}</b> {categoryLabel(type)}</span>)}
                  </div>
                </div>

                <div className={styles.resourceGroups}>
                  {categoryOrder(selectedTier).map((type) => {
                    const resources = selectedResources.filter((resource) => resource.tool_type === type);
                    if (!resources.length) return null;
                    return (
                      <section className={styles.resourceGroup} key={type}>
                        <div className={styles.resourceHeading}><h3>{categoryLabel(type)}</h3><span>{resources.length}</span></div>
                        <div className={styles.resourceGrid}>
                          {resources.map((resource) => (
                            <button
                              className={styles.resourceCard}
                              type="button"
                              key={resource.slug}
                              onClick={(event) => {
                                triggerRef.current = event.currentTarget;
                                setSelectedResource(resource);
                              }}
                            >
                              <div className={styles.resourceImage}>{resource.image_url ? <img src={resource.image_url} alt="" /> : <Layers size={24} aria-hidden="true" />}</div>
                              <span className={styles.resourceType}>{resource.tool_type}</span>
                              <strong>{resource.title}</strong>
                              {resource.short_description ? <small>{resource.short_description}</small> : null}
                              <em>View preview <ArrowRight size={14} aria-hidden="true" /></em>
                            </button>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                  {!selectedResources.length ? <p className={styles.emptyState}>Included resources will appear here when the pricing catalog is available.</p> : null}
                </div>
              </div>
            </section>
          ) : null}

          <section className={styles.faqSection} aria-labelledby="faq-heading">
            <div className={styles.sectionIntro}>
              <h2 id="faq-heading">Questions before you pay</h2>
              <p>Still unsure? Ask in the community before you buy.</p>
            </div>
            <div className={styles.faqList}>
              {exactFaqs.map(([question, answer], index) => {
                const open = openFaqId === index;
                return (
                  <article className={styles.faqItem} key={question}>
                    <h3>
                      <button type="button" aria-expanded={open} aria-controls={`faq-answer-${index}`} onClick={() => setOpenFaqId(open ? null : index)}>
                        <span>{question}</span>
                        <ChevronDown size={18} aria-hidden="true" />
                      </button>
                    </h3>
                    {open ? <div id={`faq-answer-${index}`} className={styles.faqAnswer}><p>{answer}</p></div> : null}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter
        links={[
          { href: "/start", label: "Guide" },
          { href: "/prompts", label: "Prompts" },
          { href: "/tools", label: "Tools" },
          { href: "/member", label: "Member" },
          { href: "/refer", label: "Refer & Earn" },
        ]}
        meta={<>© 2026 Fluxora. Create, ideate, generate.</>}
      />

      {selectedResource && selectedPlan ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePreview(); }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="resource-preview-title" aria-describedby="resource-preview-description">
            <button className={styles.modalClose} ref={closeButtonRef} type="button" onClick={closePreview} aria-label="Close resource preview"><X size={18} aria-hidden="true" /></button>
            <div className={styles.modalImage}>{selectedResource.image_url ? <img src={selectedResource.image_url} alt="" /> : <Layers size={30} aria-hidden="true" />}</div>
            <div className={styles.modalBody}>
              <span>Included with {planTabLabel(selectedPlan)}</span>
              <h2 id="resource-preview-title">{selectedResource.title}</h2>
              <p id="resource-preview-description">{selectedResource.short_description || "Included with this Fluxora access tier."}</p>
              <a className={styles.primaryButton} href={selectedTier === "Tool" ? "/checkout?plan=tools-monthly" : `/checkout?plan=${encodeURIComponent(selectedPlan.id)}${payments > 1 ? `&installments=${payments}` : ""}`}>
                Buy {planTabLabel(selectedPlan)} access <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
