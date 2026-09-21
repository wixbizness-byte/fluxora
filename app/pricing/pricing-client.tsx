"use client";

import { ArrowRight, Check, ChevronDown, Layers, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { SiteFooter } from "../components/fluxora/site-footer";
import { SiteHeader } from "../components/fluxora/site-header";
import {
  fallbackAccessPlans,
  fallbackPricingFaqs,
  fallbackPricingPageSettings,
  type AccessPlan,
  type PricingFaq,
  type PricingPageSettings,
  type PricingResource,
} from "../content";
import { isSupabaseConfigured, queryRows } from "../lib/supabase";
import styles from "./pricing-page.module.css";

type PlanTier = "Tool" | "Premium" | "Creator";

function planTier(plan: AccessPlan): PlanTier {
  if (plan.member_tier === "Tool" || plan.id === "tool") return "Tool";
  if (plan.member_tier === "Creator" || plan.id === "creator") return "Creator";
  return "Premium";
}

function planTabLabel(plan: AccessPlan) {
  return planTier(plan) === "Tool" ? "Tools" : planTier(plan);
}

function planFeatures(plan: AccessPlan) {
  return plan.features.split("\n").map((feature) => feature.trim()).filter(Boolean);
}

function resourceAllowed(resource: PricingResource, tier: PlanTier) {
  if (tier === "Tool") return resource.tool_type === "Tool" && resource.access_level === "All";
  if (tier === "Creator") return true;
  return resource.access_level === "All" || resource.access_level === "Premium";
}

function categoryLabel(category: PricingResource["tool_type"]) {
  if (category === "CustomGPT") return "CustomGPTs";
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

const exactPlanCopy = {
  premium: {
    title: "Premium",
    badge: "Starter",
    description: "Everything you need to start creating with AI.",
    price: "₱999",
    features: ["Prompts", "Tools", "Custom GPTs", "Courses", "Web Access"],
    button: "Get Premium",
  },
  creator: {
    title: "Creator",
    badge: "Endgame",
    description: "The full vault, from idea to finished result.",
    price: "₱1,999",
    features: ["Prompts+", "Tools+", "Custom GPTs+", "Courses+", "Web Access+", "Workflows", "Secret Methods"],
    button: "Get Creator",
  },
} as const;

export default function PricingClient() {
  const [accessPlans, setAccessPlans] = useState<AccessPlan[]>(fallbackAccessPlans);
  const [pricingResources, setPricingResources] = useState<PricingResource[]>([]);
  const [pricingFaqs, setPricingFaqs] = useState<PricingFaq[]>(fallbackPricingFaqs);
  const [pricingPageSettings, setPricingPageSettings] = useState<PricingPageSettings>(fallbackPricingPageSettings);
  const [selectedPlanId, setSelectedPlanId] = useState("tool");
  const [selectedResource, setSelectedResource] = useState<PricingResource | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const resourcesRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;

    async function loadPricingCatalog() {
      const [plansResult, resourcesResult, faqResult, settingsResult] = await Promise.all([
        queryRows<AccessPlan>("access_plans", "select=*&is_active=eq.true&order=sort_order.asc"),
        queryRows<PricingResource>("pricing_resources_public", "select=*&order=sort_order.asc,title.asc"),
        queryRows<PricingFaq>("pricing_faqs", "select=*&is_active=eq.true&order=sort_order.asc"),
        queryRows<PricingPageSettings>("pricing_page_settings", "select=*&id=eq.main&limit=1"),
      ]);

      if (cancelled) return;
      if (!plansResult.error && plansResult.data?.length) setAccessPlans(plansResult.data);
      if (!resourcesResult.error && resourcesResult.data) setPricingResources(resourcesResult.data);
      if (!faqResult.error) setPricingFaqs(faqResult.data?.length ? faqResult.data : []);
      if (!settingsResult.error && settingsResult.data?.[0]) setPricingPageSettings(settingsResult.data[0]);
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
    () => categoryOrder(selectedTier).map((type) => ({ type, count: selectedResources.filter((resource) => resource.tool_type === type).length })).filter((entry) => entry.count > 0),
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
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? pricingPlans.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + pricingPlans.length) % pricingPlans.length;
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
        links={[{ href: "/start", label: "Guide" }, { href: "/prompts", label: "Prompts" }, { href: "/tools", label: "Tools" }, { href: "/member", label: "Member" }]}
        cta={{ href: "/refer", label: "Refer & Earn" }}
      />

      <main className={styles.main}>
        <div className={styles.shell}>
          <section className={styles.intro} aria-labelledby="pricing-heading">
            <p className={styles.eyebrow}>Fluxora access</p>
            <h1 id="pricing-heading">Choose the access that fits how you create.</h1>
            <p>One clean pricing page for Fluxora tools, Premium access, and the complete Creator vault.</p>
          </section>

          {primaryPlans.length ? (
            <section className={styles.planGrid} aria-label="Fluxora access plans">
              {primaryPlans.map((plan) => {
                const tier = planTier(plan);
                if (tier !== "Premium" && tier !== "Creator") return null;

                const isCreator = tier === "Creator";
                const copy = exactPlanCopy[plan.id as "premium" | "creator"];
                const checkoutEnabled = plan.checkout_enabled !== false;

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

                    <div className={styles.priceBlock}>
                      <strong>{copy.price}</strong>
                      <span>once</span>
                    </div>
                    <p className={styles.priceNote}>Paid once. No renewals.</p>

                    <div className={styles.planDivider} aria-hidden="true" />

                    {isCreator ? (
                      <div className={styles.creatorLead}>
                        <span aria-hidden="true">+</span>
                        <strong>Everything in Premium, expanded</strong>
                      </div>
                    ) : null}

                    <ul className={styles.featureList}>
                      {copy.features.map((feature) => {
                        const creatorOnly = isCreator && (feature === "Workflows" || feature === "Secret Methods");
                        return (
                          <li key={feature}>
                            <Check size={16} aria-hidden="true" />
                            <span>{feature}</span>
                            {creatorOnly ? <em className={styles.creatorOnlyPill}>Creator only</em> : null}
                          </li>
                        );
                      })}
                    </ul>

                    {checkoutEnabled ? (
                      <a className={isCreator ? styles.creatorButton : styles.premiumButton} href={`/checkout?plan=${encodeURIComponent(plan.id)}`}>
                        {copy.button}
                      </a>
                    ) : <span className={styles.disabledButton}>Checkout unavailable</span>}
                  </article>
                );
              })}
            </section>
          ) : null}

          {toolPlan ? (
            <aside className={styles.toolStrip} aria-labelledby="tool-plan-heading">
              <div className={styles.toolStripInfo}>
                <div>
                  <h2 id="tool-plan-heading">Tools only</h2>
                  <p>Just the Fluxora tools catalog, billed monthly.</p>
                </div>
              </div>
              <div className={styles.toolStripPrice}>
                <strong>₱100</strong>
                <span>/month</span>
              </div>
              {toolPlan.checkout_enabled !== false ? (
                <a className={styles.toolButton} href={`/checkout?plan=${encodeURIComponent(toolPlan.id)}`}>Get Tools only</a>
              ) : <span className={styles.disabledButton}>Checkout unavailable</span>}
            </aside>
          ) : null}

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
                    <strong>{priceLabel(selectedPlan)}</strong>
                  </div>
                  <div className={styles.countList}>{resourceCounts.map(({ type, count }) => <span key={type}><b>{count}</b> {categoryLabel(type)}</span>)}</div>
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

          {pricingPageSettings.faq_enabled && pricingFaqs.length ? (
            <section className={styles.faqSection} aria-labelledby="faq-heading">
              <div className={styles.sectionIntro}>
                <p className={styles.eyebrow}>Questions</p>
                <h2 id="faq-heading">Questions before you pay.</h2>
                <p>Everything you need to know before choosing Fluxora access.</p>
              </div>
              <div className={styles.faqList}>
                {pricingFaqs.map((faq) => {
                  const open = openFaqId === faq.id;
                  return (
                    <article className={styles.faqItem} key={faq.id}>
                      <h3>
                        <button type="button" aria-expanded={open} aria-controls={`faq-answer-${faq.id}`} onClick={() => setOpenFaqId(open ? null : faq.id)}>
                          <span>{faq.question}</span>
                          <ChevronDown size={18} aria-hidden="true" />
                        </button>
                      </h3>
                      {open ? <div id={`faq-answer-${faq.id}`} className={styles.faqAnswer}><p>{faq.answer}</p></div> : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <SiteFooter
        links={[{ href: "/start", label: "Guide" }, { href: "/prompts", label: "Prompts" }, { href: "/tools", label: "Tools" }, { href: "/member", label: "Member" }, { href: "/refer", label: "Refer & Earn" }]}
        meta={<>© 2026 Fluxora</>}
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
              {selectedPlan.checkout_enabled !== false ? (
                <a className={styles.primaryButton} href={`/checkout?plan=${encodeURIComponent(selectedPlan.id)}`}>
                  Buy {planTabLabel(selectedPlan)} access <ArrowRight size={16} aria-hidden="true" />
                </a>
              ) : <p className={styles.unavailable}>Checkout is currently unavailable for this plan.</p>}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
