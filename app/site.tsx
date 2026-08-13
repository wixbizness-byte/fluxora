"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fallbackAccessPlans,
  fallbackCollectionCards,
  fallbackGalleryImages,
  fallbackPaymentSettings,
  fallbackPricingFaqs,
  fallbackPricingPageSettings,
  type AccessPlan,
  type CollectionCard,
  type GalleryImage,
  type GalleryRow,
  type PaymentSettings,
  type PricingFaq,
  type PricingPageSettings,
  type PricingResource,
} from "./content";
import { isSupabaseConfigured, queryRows } from "./lib/supabase";

const homeFaqs: PricingFaq[] = [
  {
    id: "home-faq-1",
    question: "What is included in each access plan?",
    answer: "Explorer includes premium prompts, tools, Custom GPTs, and courses. Creator adds the complete workflows collection and the expanded vault.",
    sort_order: 1,
    is_active: true,
  },
  { id: "home-faq-2", question: "Who is behind Fluxora?", answer: "Meimei Digitals is the owner of Fluxora.", sort_order: 2, is_active: true },
  { id: "home-faq-3", question: "Do I need technical experience?", answer: "No. Fluxora is structured around clear outcomes and guided steps rather than technical complexity.", sort_order: 3, is_active: true },
  { id: "home-faq-4", question: "Can the library keep growing?", answer: "Yes. The library is continuously growing. Established since December 2025", sort_order: 4, is_active: true },
  { id: "home-faq-5", question: "Where does the community live?", answer: "The Fluxora creator community is currently hosted on Telegram.", sort_order: 5, is_active: true },
];

function MoonMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M31.8 6.8A17.8 17.8 0 1 0 41.2 34C29 38 17.2 25.6 22.5 13.7c1.9-4.2 5.4-6.1 9.3-6.9Z" />
    </svg>
  );
}

function ImageSurface({ imageUrl, alt }: { imageUrl: string; alt: string }) {
  if (!imageUrl) return <span className="media-placeholder" aria-label={`${alt} placeholder`} />;
  return <img src={imageUrl} alt={alt} loading="lazy" />;
}

function canonicalFluxoraUrl(url: string) {
  const normalized = url.trim().replace(/\/+$/, "");

  if (normalized === "https://fluxora-prompt-gallery.vercel.app") {
    return "/prompts";
  }

  if (normalized === "https://tool-directory-ochre.vercel.app") {
    return "/tools";
  }

  return url;
}

function CardButton({ label, url, className }: { label: string; url: string; className: string }) {
  if (!url) return <span className={`${className} disabled`}>{label}</span>;
  const resolvedUrl = canonicalFluxoraUrl(url);
  const internal = resolvedUrl.startsWith("#") || resolvedUrl.startsWith("/");
  return (
    <a className={className} href={resolvedUrl} target={internal ? undefined : "_blank"} rel={internal ? undefined : "noopener noreferrer"}>
      {label}
    </a>
  );
}

function fillGalleryRow(images: GalleryImage[], row: GalleryRow) {
  const fallback = fallbackGalleryImages.filter((image) => image.row_position === row);
  const source = images.length ? images.slice(0, 6) : fallback;
  return Array.from({ length: 6 }, (_, index) => source[index % source.length]);
}

function GalleryStrip({ images, direction, label }: { images: GalleryImage[]; direction: "left" | "right"; label: string }) {
  const repeatedSet = Array.from({ length: 3 }, (_, cycle) =>
    images.map((image, index) => ({ image, key: `${cycle}-${index}-${image.id}` })),
  ).flat();

  return (
    <div className="gallery-window" aria-label={label}>
      <div className={`gallery-track scroll-${direction}`}>
        {[0, 1].map((group) => (
          <div className="gallery-group" aria-hidden={group === 1} key={group}>
            {repeatedSet.map(({ image, key }, index) => {
              const item = (
                <div className="gallery-image">
                  <ImageSurface imageUrl={image.image_url} alt={image.alt_text || `${label} image ${(index % 6) + 1}`} />
                </div>
              );
              return image.target_url ? (
                <a href={image.target_url} target="_blank" rel="noopener noreferrer" key={`${group}-${key}`}>{item}</a>
              ) : (
                <div key={`${group}-${key}`}>{item}</div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function QrBox({ settings }: { settings: PaymentSettings }) {
  const content = settings.qr_image_url ? (
    <img src={settings.qr_image_url} alt={settings.qr_alt_text || "Fluxora GCash payment QR code"} loading="lazy" />
  ) : (
    <span className="qr-placeholder"><i /><b>QR</b><small>Add your Cloudinary QR image in Admin</small></span>
  );

  if (!settings.qr_target_url) return <div className="qr-image-box">{content}</div>;
  return (
    <a className="qr-image-box" href={settings.qr_target_url} target="_blank" rel="noopener noreferrer" aria-label="Open Fluxora payment link">
      {content}
    </a>
  );
}

function planFeatures(plan: AccessPlan) {
  return plan.features
    .split("\n")
    .map((feature) => feature.trim())
    .filter(Boolean);
}

function planTier(plan: AccessPlan): "Tool" | "Premium" | "Creator" {
  if (plan.member_tier === "Tool" || plan.id === "tool") return "Tool";
  if (plan.member_tier === "Creator" || plan.id === "creator") return "Creator";
  return "Premium";
}

function planTabLabel(plan: AccessPlan) {
  const tier = planTier(plan);
  return tier === "Tool" ? "Tools" : tier;
}

function resourceAllowed(resource: PricingResource, tier: "Tool" | "Premium" | "Creator") {
  if (tier === "Tool") return resource.tool_type === "Tool";
  if (tier === "Creator") return true;
  return resource.access_level === "All" || resource.access_level === "Premium";
}

function categoryLabel(category: PricingResource["tool_type"]) {
  if (category === "CustomGPT") return "CustomGPTs";
  if (category === "Workflow") return "Workflows";
  return "Tools";
}

export default function Site({ pricingMode = false }: { pricingMode?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [collectionCards, setCollectionCards] = useState<CollectionCard[]>(fallbackCollectionCards);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(fallbackGalleryImages);
  const [accessPlans, setAccessPlans] = useState<AccessPlan[]>(fallbackAccessPlans);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(fallbackPaymentSettings);
  const [pricingResources, setPricingResources] = useState<PricingResource[]>([]);
  const [pricingFaqs, setPricingFaqs] = useState<PricingFaq[]>(fallbackPricingFaqs);
  const [pricingPageSettings, setPricingPageSettings] = useState<PricingPageSettings>(fallbackPricingPageSettings);
  const [selectedPricingPlanId, setSelectedPricingPlanId] = useState("tool");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;

    async function loadContent() {
      const [collectionResult, galleryResult, plansResult, paymentResult] = await Promise.all([
        queryRows<CollectionCard>("collection_cards", "select=*&is_active=eq.true&order=sort_order.asc"),
        queryRows<GalleryImage>("gallery_images", "select=*&is_active=eq.true&sort_order=lte.6&order=row_position.asc,sort_order.asc"),
        queryRows<AccessPlan>("access_plans", "select=*&is_active=eq.true&order=sort_order.asc"),
        queryRows<PaymentSettings>("payment_settings", "select=*&is_active=eq.true&id=eq.main&limit=1"),
      ]);

      if (cancelled) return;
      if (!collectionResult.error && collectionResult.data?.length) setCollectionCards(collectionResult.data);
      if (!galleryResult.error) setGalleryImages(galleryResult.data?.length ? galleryResult.data : fallbackGalleryImages);
      if (!plansResult.error && plansResult.data?.length) setAccessPlans(plansResult.data);
      if (!paymentResult.error && paymentResult.data?.[0]) setPaymentSettings(paymentResult.data[0]);
    }

    loadContent().catch((error) => console.warn("Fluxora fallback content is being used.", error));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!pricingMode || !isSupabaseConfigured()) return;
    let cancelled = false;

    async function loadPricingCatalog() {
      const [resourcesResult, faqResult, settingsResult] = await Promise.all([
        queryRows<PricingResource>("pricing_resources_public", "select=*&order=sort_order.asc,title.asc"),
        queryRows<PricingFaq>("pricing_faqs", "select=*&is_active=eq.true&order=sort_order.asc"),
        queryRows<PricingPageSettings>("pricing_page_settings", "select=*&id=eq.main&limit=1"),
      ]);

      if (cancelled) return;
      if (!resourcesResult.error && resourcesResult.data) setPricingResources(resourcesResult.data);
      if (!faqResult.error) setPricingFaqs(faqResult.data?.length ? faqResult.data : []);
      if (!settingsResult.error && settingsResult.data?.[0]) setPricingPageSettings(settingsResult.data[0]);
    }

    loadPricingCatalog().catch((error) => console.warn("Fluxora pricing catalog fallback is being used.", error));
    return () => { cancelled = true; };
  }, [pricingMode]);

  const galleryRows = useMemo(() => {
    const rows: Record<GalleryRow, GalleryImage[]> = { top: [], middle: [], bottom: [] };
    galleryImages.forEach((image) => {
      const row = image.row_position || "top";
      if (rows[row].length < 6) rows[row].push(image);
    });
    return {
      top: fillGalleryRow(rows.top, "top"),
      middle: fillGalleryRow(rows.middle, "middle"),
      bottom: fillGalleryRow(rows.bottom, "bottom"),
    };
  }, [galleryImages]);

  const pricingPlans = useMemo(
    () => accessPlans.filter((plan) => ["tool", "premium", "creator"].includes(plan.id)).sort((a, b) => a.sort_order - b.sort_order),
    [accessPlans],
  );
  const selectedPlan = pricingPlans.find((plan) => plan.id === selectedPricingPlanId) || pricingPlans[0];
  const selectedTier = selectedPlan ? planTier(selectedPlan) : "Tool";
  const selectedResources = useMemo(
    () => pricingResources.filter((resource) => resourceAllowed(resource, selectedTier)),
    [pricingResources, selectedTier],
  );
  const categoryOrder: PricingResource["tool_type"][] = selectedTier === "Creator"
    ? ["Workflow", "CustomGPT", "Tool"]
    : selectedTier === "Premium"
      ? ["CustomGPT", "Tool"]
      : ["Tool"];
  const visibleFaqs = pricingMode ? pricingFaqs : homeFaqs;

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <main id="top">
      <header className="nav-shell">
        <a className="brand" href="#top" onClick={closeMenu}>
          <MoonMark />
          <span><b>Fluxora</b><small>Create. Ideate. Generate.</small></span>
        </a>

        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Primary" id="primary-navigation">
          <a href="/prompts" onClick={closeMenu}>Prompts</a>
          <a href="/tools" onClick={closeMenu}>Tools</a>
          <a href="/pricing" onClick={closeMenu}>Pricing</a>
          <a href="#faq" onClick={closeMenu}>FAQ</a>
        </nav>

        <div className="nav-actions">
          <a className="nav-cta" href="/pricing">Get access</a>
          <button
            className="menu-toggle"
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <i /><i />
          </button>
        </div>
      </header>

      <section className="hero section">
        <div className="hero-copy">
          <p className="eyebrow hero-animate hero-animate-1"><span />Digital systems for creators</p>
          <h1 className="hero-animate hero-animate-2">Turn ideas into<br /><em>actual results.</em></h1>
          <p className="hero-lede hero-animate hero-animate-3">Curated tools, practical workflows, and purpose-built GPTs that help you move from possibility to finished work—faster.</p>
          <div className="hero-actions hero-animate hero-animate-4">
            <a className="button primary" href="/prompts">View resources</a>
            <a className="button ghost" href="https://t.me/PHAICommunity" target="_blank" rel="noopener noreferrer">Join community</a>
          </div>
          <div className="hero-proof hero-animate hero-animate-5">
            <div className="avatars"><i>F</i><i>L</i><i>X</i><i>+</i></div>
            <p><b>Built for momentum</b><span>Clear systems. Less trial and error.</span></p>
          </div>
        </div>
      </section>

      <section className="products section" id="products">
        <div className="section-heading text-motion">
          <p className="eyebrow"><span />The collection</p>
          <h2>Everything you need to<br /><em>move with clarity.</em></h2>
        </div>

        <div className="collection-grid">
          {collectionCards.map((card) => (
            <article className={card.is_featured ? "collection-card featured" : "collection-card"} key={card.id}>
              <div className="collection-image">
                <ImageSurface imageUrl={card.image_url} alt={card.title} />
                <div className="image-overlay" />
              </div>
              {card.is_featured && <span className="popular">Most popular</span>}
              <div className="collection-content">
                <span className="card-eyebrow">{card.eyebrow}</span>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <CardButton label={card.button_label} url={card.button_url} className="card-button" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="gallery-section" id="gallery">
        <div className="gallery-heading section text-motion">
          <p className="eyebrow light"><span />Visual archive</p>
          <h2>A moving gallery of<br /><em>what is possible.</em></h2>
        </div>

        <div className="gallery-rows">
          <GalleryStrip images={galleryRows.top} direction="left" label="Top visual archive row" />
          <GalleryStrip images={galleryRows.middle} direction="right" label="Middle visual archive row" />
          <GalleryStrip images={galleryRows.bottom} direction="left" label="Bottom visual archive row" />
        </div>
      </section>

      <section className={pricingMode ? "pricing pricing-catalog section" : "pricing section"} id="pricing">
        {pricingMode ? (
          <div className="pricing-catalog-wrap">
            <div className="pricing-copy pricing-catalog-heading text-motion">
              <p className="eyebrow"><span />Simple access</p>
              <h2>Choose the level that<br /><em>fits your momentum.</em></h2>
              <p>Pick a tier to see exactly which Fluxora resources are included.</p>
            </div>

            <div className="pricing-tier-tabs" role="tablist" aria-label="Fluxora membership tiers">
              {pricingPlans.map((plan) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedPlan?.id === plan.id}
                  className={selectedPlan?.id === plan.id ? "active" : ""}
                  key={plan.id}
                  onClick={() => setSelectedPricingPlanId(plan.id)}
                >
                  {planTabLabel(plan)}
                </button>
              ))}
            </div>

            {selectedPlan && (
              <div className="pricing-tier-summary">
                {selectedPlan.show_description !== false && selectedPlan.description && <p>{selectedPlan.description}</p>}
                {selectedPlan.checkout_enabled !== false && (
                  <a className="pricing-buy-button" href={`/checkout?plan=${encodeURIComponent(selectedPlan.id)}`}>
                    Buy for ₱{Number(selectedPlan.price_php || (selectedPlan.id === "tool" ? 249 : selectedPlan.id === "creator" ? 1999 : 599)).toLocaleString()}
                  </a>
                )}
              </div>
            )}

            <div className="pricing-resource-groups">
              {categoryOrder.map((category) => {
                const categoryResources = selectedResources.filter((resource) => resource.tool_type === category);
                if (!categoryResources.length) return null;
                return (
                  <section className="pricing-resource-group" key={category}>
                    <div className="pricing-resource-heading">
                      <span>{categoryLabel(category)}</span>
                      <strong>{categoryResources.length}</strong>
                    </div>
                    <div className="pricing-resource-grid">
                      {categoryResources.map((resource) => (
                        <article className="pricing-resource-card" key={resource.slug}>
                          <div className="pricing-resource-image">
                            <ImageSurface imageUrl={resource.image_url || ""} alt={resource.title} />
                          </div>
                          <div className="pricing-resource-copy">
                            <h3>{resource.title}</h3>
                            {resource.short_description && <p>{resource.short_description}</p>}
                            <span>Included with {planTabLabel(selectedPlan!)}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pricing-wrap">
            <div className="pricing-copy text-motion">
              <p className="eyebrow"><span />Simple access</p>
              <h2>Choose the level that<br /><em>fits your momentum.</em></h2>
              <p>Explore the offers and choose the access level that fits the way you create.</p>
            </div>

            <div className="price-cards">
              {accessPlans.filter((plan) => plan.id !== "tool").map((plan) => (
                <article className={plan.variant === "creator" ? "access-plan creator-plan" : "access-plan"} key={plan.id}>
                  <div className="plan-header">{plan.badge}</div>
                  <h3>{plan.title}</h3>
                  <p className="plan-description">{plan.description}</p>
                  <ul className="plan-features">
                    {planFeatures(plan).map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                  <CardButton
                    label={plan.button_label}
                    url={plan.button_url}
                    className={plan.variant === "creator" ? "button primary full" : "button ghost full"}
                  />
                </article>
              ))}
            </div>
          </div>
        )}
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

      {(!pricingMode || pricingPageSettings.faq_enabled) && visibleFaqs.length > 0 && (
        <section className="faq section" id="faq">
          <div className="faq-heading text-motion">
            <p className="eyebrow"><span />Questions, answered</p>
            <h2>Everything you need<br />to know.</h2>
            <p>Important details about Fluxora, access, and the creator community.</p>
          </div>

          <div className="faq-list">
            {visibleFaqs.map((faq, index) => (
              <article className={openFaq === index ? "open" : ""} key={faq.id}>
                <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}>
                  <span>{String(index + 1).padStart(2, "0")}</span><b>{faq.question}</b><i>+</i>
                </button>
                <div className="faq-answer"><p>{faq.answer}</p></div>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer>
        <div className="footer-brand">
          <a className="brand" href="#top"><MoonMark /><span><b>Fluxora</b><small>Create. Ideate. Generate.</small></span></a>
          <p>Useful systems for ambitious ideas.</p>
        </div>
        <div><small>Explore</small><a href="/prompts">Prompts</a><a href="/tools">Tools</a><a href="/pricing">Pricing</a></div>
        <div><small>Connect</small><a href="https://t.me/PHAICommunity" target="_blank" rel="noopener noreferrer">Community</a><a href="https://www.facebook.com/meimeidigitalAI" target="_blank" rel="noopener noreferrer">Facebook</a></div>
        <div><small>Manage</small><a href="/admin">Admin panel</a><a href="#faq">FAQ</a></div>
        <p className="copyright">© 2026 Fluxora. All rights reserved.</p>
      </footer>
    </main>
  );
}
