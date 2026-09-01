"use client";

import { ArrowRight, Check, ChevronDown, Layers, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "../components/fluxora/badge";
import { Button } from "../components/fluxora/button";
import { PageContainer } from "../components/fluxora/page-container";
import { SectionHeading } from "../components/fluxora/section-heading";
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
  const fallbackPrices: Record<string, number> = { tool: 249, premium: 599, creator: 1999 };
  return `₱${Number(plan.price_php ?? fallbackPrices[plan.id] ?? 0).toLocaleString("en-PH")}`;
}

export default function PricingClient() {
  const [accessPlans, setAccessPlans] = useState<AccessPlan[]>(fallbackAccessPlans);
  const [pricingResources, setPricingResources] = useState<PricingResource[]>([]);
  const [pricingFaqs, setPricingFaqs] = useState<PricingFaq[]>(fallbackPricingFaqs);
  const [pricingPageSettings, setPricingPageSettings] = useState<PricingPageSettings>(fallbackPricingPageSettings);
  const [selectedPlanId, setSelectedPlanId] = useState("tool");
  const [selectedResource, setSelectedResource] = useState<PricingResource | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [mainCtaVisible, setMainCtaVisible] = useState(true);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const mainCtaRef = useRef<HTMLDivElement>(null);

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
  const checkoutEnabled = selectedPlan?.checkout_enabled !== false;
  const checkoutHref = selectedPlan ? `/checkout?plan=${encodeURIComponent(selectedPlan.id)}` : "/checkout";

  useEffect(() => {
    const target = mainCtaRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setMainCtaVisible(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [selectedPlan?.id]);

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

  function choosePlan(planId: string) {
    setSelectedPlanId(planId);
    setSelectedResource(null);
  }

  function handleTabKeys(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!pricingPlans.length || !["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? pricingPlans.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + pricingPlans.length) % pricingPlans.length;
    choosePlan(pricingPlans[nextIndex].id);
    document.getElementById(`pricing-tab-${pricingPlans[nextIndex].id}`)?.focus();
  }

  function closePreview() {
    setSelectedResource(null);
    triggerRef.current?.focus();
  }

  return (
    <div className={`${styles.pricingPage} fluxora-theme`}>
      <SiteHeader
        links={[{ href: "/start", label: "Guide" }, { href: "/prompts", label: "Prompts" }, { href: "/tools", label: "Tools" }, { href: "/member", label: "Member" }]}
        cta={{ href: "/refer", label: "Refer & Earn" }}
      />
      <main className={styles.main}>
        <PageContainer>
          <section className={styles.intro} aria-labelledby="pricing-heading">
            <p className={styles.eyebrow}>Fluxora access</p>
            <h1 id="pricing-heading">Choose the access that fits how you create.</h1>
            <p>Compare Fluxora tiers, see exactly what each one includes, and choose the level that matches your workflow.</p>
          </section>

          {selectedPlan ? <>
            <section className={styles.selectorSection} aria-label="Choose a Fluxora access tier">
              <div className={styles.tierTabs} role="tablist" aria-label="Fluxora access tiers">
                {pricingPlans.map((plan, index) => <button
                  className={plan.id === selectedPlan.id ? styles.tierTabActive : styles.tierTab}
                  id={`pricing-tab-${plan.id}`}
                  type="button"
                  role="tab"
                  aria-selected={plan.id === selectedPlan.id}
                  aria-controls="selected-plan"
                  key={plan.id}
                  onClick={() => choosePlan(plan.id)}
                  onKeyDown={(event) => handleTabKeys(event, index)}
                >{planTabLabel(plan)}</button>)}
              </div>
            </section>

            <section className={styles.planCard} id="selected-plan" role="tabpanel" aria-labelledby={`pricing-tab-${selectedPlan.id}`}>
              <div className={styles.planTopline}>
                <Badge variant="brand">{selectedPlan.badge || `${planTabLabel(selectedPlan)} access`}</Badge>
                <span className={styles.planTier}>{planTabLabel(selectedPlan)}</span>
              </div>
              <div className={styles.planContent}>
                <div>
                  <h2>{selectedPlan.title}</h2>
                  {selectedPlan.show_description !== false && selectedPlan.description ? <p className={styles.planDescription}>{selectedPlan.description}</p> : null}
                  {planFeatures(selectedPlan).length ? <ul className={styles.featureList}>{planFeatures(selectedPlan).map((feature) => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}</ul> : null}
                </div>
                <aside className={styles.purchasePanel} aria-label={`${planTabLabel(selectedPlan)} purchase details`}>
                  <span>One-time access</span>
                  <strong>{priceLabel(selectedPlan)}</strong>
                  <div className={styles.countList}>{resourceCounts.map(({ type, count }) => <span key={type}><b>{count}</b> {categoryLabel(type)}</span>)}</div>
                  {checkoutEnabled ? <div ref={mainCtaRef}><Button href={checkoutHref} variant="primary" fullWidth>Buy access <ArrowRight size={16} aria-hidden="true" /></Button></div> : <p className={styles.unavailable}>Checkout is currently unavailable for this plan.</p>}
                </aside>
              </div>
            </section>

            <section className={styles.resourcesSection} aria-label="Included resources">
              <SectionHeading eyebrow="Included resources" title="See what comes with your access." description="Resources are shown according to the selected Fluxora tier." />
              <div className={styles.resourceGroups}>
                {categoryOrder(selectedTier).map((type) => {
                  const resources = selectedResources.filter((resource) => resource.tool_type === type);
                  if (!resources.length) return null;
                  return <section className={styles.resourceGroup} key={type}>
                    <div className={styles.resourceHeading}><h3>{categoryLabel(type)}</h3><Badge>{resources.length}</Badge></div>
                    <div className={styles.resourceGrid}>{resources.map((resource) => <button className={styles.resourceCard} type="button" key={resource.slug} onClick={(event) => { triggerRef.current = event.currentTarget; setSelectedResource(resource); }}>
                      <div className={styles.resourceImage}>{resource.image_url ? <img src={resource.image_url} alt="" /> : <Layers size={24} aria-hidden="true" />}</div>
                      <span className={styles.resourceType}>{resource.tool_type}</span>
                      <strong>{resource.title}</strong>
                      {resource.short_description ? <small>{resource.short_description}</small> : null}
                      <em>View preview <ArrowRight size={14} aria-hidden="true" /></em>
                    </button>)}</div>
                  </section>;
                })}
                {!selectedResources.length ? <p className={styles.emptyState}>Included resources will appear here when the pricing catalog is available.</p> : null}
              </div>
            </section>
          </> : null}

          {pricingPageSettings.faq_enabled && pricingFaqs.length ? <section className={styles.faqSection} aria-labelledby="faq-heading">
            <SectionHeading eyebrow="Questions" title="Pricing FAQ" description="Everything you need to know before choosing access." />
            <div className={styles.faqList}>{pricingFaqs.map((faq) => {
              const open = openFaqId === faq.id;
              return <article className={styles.faqItem} key={faq.id}><h3><button type="button" aria-expanded={open} aria-controls={`faq-answer-${faq.id}`} onClick={() => setOpenFaqId(open ? null : faq.id)}><span>{faq.question}</span><ChevronDown size={18} aria-hidden="true" /></button></h3>{open ? <div id={`faq-answer-${faq.id}`} className={styles.faqAnswer}><p>{faq.answer}</p></div> : null}</article>;
            })}</div>
          </section> : null}
        </PageContainer>
      </main>
      <SiteFooter links={[{ href: "/start", label: "Guide" }, { href: "/prompts", label: "Prompts" }, { href: "/tools", label: "Tools" }, { href: "/member", label: "Member" }, { href: "/refer", label: "Refer & Earn" }]} meta={<>© 2026 Fluxora</>} />

      {selectedResource && selectedPlan ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePreview(); }}>
        <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="resource-preview-title" aria-describedby="resource-preview-description">
          <button className={styles.modalClose} ref={closeButtonRef} type="button" onClick={closePreview} aria-label="Close resource preview"><X size={18} aria-hidden="true" /></button>
          <div className={styles.modalImage}>{selectedResource.image_url ? <img src={selectedResource.image_url} alt="" /> : <Layers size={30} aria-hidden="true" />}</div>
          <div className={styles.modalBody}><Badge variant="brand">Included with {planTabLabel(selectedPlan)}</Badge><h2 id="resource-preview-title">{selectedResource.title}</h2><p id="resource-preview-description">{selectedResource.short_description || "Included with this Fluxora access tier."}</p>{checkoutEnabled ? <Button href={checkoutHref} variant="primary">Buy {planTabLabel(selectedPlan)} access <ArrowRight size={16} aria-hidden="true" /></Button> : <p className={styles.unavailable}>Checkout is currently unavailable for this plan.</p>}</div>
        </section>
      </div> : null}

      {selectedPlan && checkoutEnabled && !mainCtaVisible ? <aside className={styles.mobileDock} aria-label="Purchase selected Fluxora access"><div><span>{planTabLabel(selectedPlan)}</span><strong>{priceLabel(selectedPlan)}</strong></div><Button href={checkoutHref} variant="primary">Buy access</Button></aside> : null}
    </div>
  );
}
