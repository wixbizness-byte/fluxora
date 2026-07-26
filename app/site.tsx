"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fallbackCollectionCards,
  fallbackGalleryImages,
  fallbackHeroCards,
  fallbackMethodCards,
  fallbackSettings,
  type CollectionCard,
  type GalleryImage,
  type HeroCard,
  type MethodCard,
  type SiteSettings,
} from "./content";
import { isSupabaseConfigured, queryOne, queryRows } from "./lib/supabase";

const faqs = [
  [
    "What is included in each access plan?",
    "Explorer includes premium prompts, tools, Custom GPTs, and courses. Creator adds the complete workflows collection and the expanded vault.",
  ],
  ["Who is behind Fluxora?", "Meimei Digitals is the owner of Fluxora."],
  ["Do I need technical experience?", "No. Fluxora is structured around clear outcomes and guided steps rather than technical complexity."],
  ["Can the library keep growing?", "Yes. The Supabase-powered sections can be updated from the admin panel without rebuilding the website."],
  ["Where does the community live?", "The Fluxora creator community is currently hosted on Telegram."],
];

function MoonMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M31.8 6.8A17.8 17.8 0 1 0 41.2 34C29 38 17.2 25.6 22.5 13.7c1.9-4.2 5.4-6.1 9.3-6.9Z" />
    </svg>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "dark");
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("fluxora-theme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className={theme === "dark" ? "theme-shape diamond" : "theme-shape circle"} />
    </button>
  );
}

function ImageSurface({ imageUrl, alt }: { imageUrl: string; alt: string }) {
  if (!imageUrl) return <span className="media-placeholder" aria-label={`${alt} placeholder`} />;
  return <img src={imageUrl} alt={alt} loading="lazy" />;
}

function HeroMedia({ cards }: { cards: HeroCard[] }) {
  const visibleCards = cards.slice(0, 4);

  return (
    <div className="hero-media-stage" aria-label="Four floating Fluxora image cards">
      <div className="hero-orbit-line orbit-line-one" />
      <div className="hero-orbit-line orbit-line-two" />
      {visibleCards.map((card, index) => {
        const cardBody = <ImageSurface imageUrl={card.image_url} alt={card.alt_text || `Hero image ${index + 1}`} />;
        const className = `hero-media-card hero-card-${index + 1}`;

        return card.target_url ? (
          <a className={className} href={card.target_url} target="_blank" rel="noopener noreferrer" key={card.id}>
            {cardBody}
          </a>
        ) : (
          <div className={className} key={card.id}>{cardBody}</div>
        );
      })}
    </div>
  );
}

function CardButton({ label, url, className }: { label: string; url: string; className: string }) {
  if (!url) return <span className={`${className} disabled`}>{label}</span>;
  const internal = url.startsWith("#") || url.startsWith("/");
  return (
    <a className={className} href={url} target={internal ? undefined : "_blank"} rel={internal ? undefined : "noopener noreferrer"}>
      {label}
    </a>
  );
}

export default function Site() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [settings, setSettings] = useState<SiteSettings>(fallbackSettings);
  const [heroCards, setHeroCards] = useState<HeroCard[]>(fallbackHeroCards);
  const [collectionCards, setCollectionCards] = useState<CollectionCard[]>(fallbackCollectionCards);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(fallbackGalleryImages);
  const [methodCards, setMethodCards] = useState<MethodCard[]>(fallbackMethodCards);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;

    async function loadContent() {
      const [settingsResult, heroResult, collectionResult, galleryResult, methodResult] = await Promise.all([
        queryOne<SiteSettings>("site_settings", "select=*&id=eq.main"),
        queryRows<HeroCard>("hero_media_cards", "select=*&is_active=eq.true&order=sort_order.asc&limit=4"),
        queryRows<CollectionCard>("collection_cards", "select=*&is_active=eq.true&order=sort_order.asc"),
        queryRows<GalleryImage>("gallery_images", "select=*&is_active=eq.true&order=sort_order.asc&limit=10"),
        queryRows<MethodCard>("method_cards", "select=*&is_active=eq.true&order=sort_order.asc"),
      ]);

      if (cancelled) return;
      if (settingsResult.data) setSettings(settingsResult.data);
      if (heroResult.data?.length) setHeroCards(heroResult.data);
      if (collectionResult.data?.length) setCollectionCards(collectionResult.data);
      if (galleryResult.data?.length) setGalleryImages(galleryResult.data);
      if (methodResult.data?.length) setMethodCards(methodResult.data);
    }

    loadContent().catch((error) => console.warn("Fluxora fallback content is being used.", error));
    return () => { cancelled = true; };
  }, []);

  const activeGallery = useMemo(() => galleryImages.slice(0, 10), [galleryImages]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <main id="top">
      <div className="announcement-bar">
        <a
          className="announcement-button"
          href={settings.follow_page_url || "https://www.facebook.com/meimeidigitalAI"}
          target="_blank"
          rel="noopener noreferrer"
        >
          {settings.follow_page_label || "Follow our Page"}
        </a>
      </div>

      <header className="nav-shell">
        <a className="brand" href="#top" onClick={closeMenu}>
          <MoonMark />
          <span><b>Fluxora</b><small>Create. Ideate. Generate.</small></span>
        </a>

        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Primary" id="primary-navigation">
          <a href="#products" onClick={closeMenu}>Products</a>
          <a href="#gallery" onClick={closeMenu}>Gallery</a>
          <a href="#pricing" onClick={closeMenu}>Pricing</a>
          <a href="#faq" onClick={closeMenu}>FAQ</a>
        </nav>

        <div className="nav-actions">
          <a className="nav-cta" href="#pricing">Get access</a>
          <ThemeToggle />
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
          <p className="eyebrow"><span />Digital systems for creators</p>
          <h1>Turn ideas into<br /><em>actual results.</em></h1>
          <p className="hero-lede">Curated tools, practical workflows, and purpose-built GPTs that help you move from possibility to finished work—faster.</p>
          <div className="hero-actions">
            <a className="button primary" href="#products">Browse the vault</a>
            <a className="button ghost" href="https://t.me/PHAICommunity" target="_blank" rel="noopener noreferrer">Join community</a>
          </div>
          <div className="hero-proof">
            <div className="avatars"><i>F</i><i>L</i><i>X</i><i>+</i></div>
            <p><b>Built for momentum</b><span>Clear systems. Less trial and error.</span></p>
          </div>
        </div>

        <div className="hero-visual">
          <HeroMedia cards={heroCards} />
        </div>
      </section>

      <section className="stats-wrap section">
        <div className="stats">
          <div><strong>40<sup>+</sup></strong><span>Curated resources</span></div>
          <div><strong>03</strong><span>Core product types</span></div>
          <div><strong>∞</strong><span>Ways to create</span></div>
          <div><strong>01</strong><span>Organized vault</span></div>
        </div>
      </section>

      <section className="products section" id="products">
        <div className="section-heading">
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
        <div className="gallery-heading section">
          <p className="eyebrow light"><span />Visual archive</p>
          <h2>A moving gallery of<br /><em>what is possible.</em></h2>
        </div>

        <div className="gallery-window">
          <div className="gallery-track">
            {[0, 1].map((group) => (
              <div className="gallery-group" aria-hidden={group === 1} key={group}>
                {activeGallery.map((image, index) => {
                  const item = (
                    <div className="gallery-image">
                      <ImageSurface imageUrl={image.image_url} alt={image.alt_text || `Gallery image ${index + 1}`} />
                    </div>
                  );
                  return image.target_url ? (
                    <a href={image.target_url} target="_blank" rel="noopener noreferrer" key={`${group}-${image.id}`}>{item}</a>
                  ) : (
                    <div key={`${group}-${image.id}`}>{item}</div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="method section">
        <div className="center-heading">
          <p className="eyebrow"><span />The Fluxora method</p>
          <h2>A clear path from idea<br />to <em>finished work.</em></h2>
        </div>

        <div className="method-grid">
          {methodCards.map((card) => (
            <article className="method-card" key={card.id}>
              <div className="method-image">
                <ImageSurface imageUrl={card.image_url} alt={card.title} />
                <div className="image-overlay" />
              </div>
              <div className="method-content">
                <span className="method-number">{card.step_number}</span>
                <span className="card-eyebrow">{card.eyebrow}</span>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <CardButton label={card.button_label} url={card.button_url} className="card-button method-button" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pricing section" id="pricing">
        <div className="pricing-wrap">
          <div className="pricing-copy">
            <p className="eyebrow"><span />Simple access</p>
            <h2>Choose the level that<br /><em>fits your momentum.</em></h2>
            <p>Explore the offers and choose the access level that fits the way you create.</p>
          </div>

          <div className="price-cards">
            <article className="access-plan">
              <div className="plan-header">Starter</div>
              <h3>Explorer</h3>
              <p className="plan-description">Your entry point to premium Fluxora resources.</p>
              <ul className="plan-features"><li>Prompts</li><li>Tools</li><li>Custom GPTs</li><li>Courses</li></ul>
              <a className="button ghost full" href="https://www.facebook.com/meimeidigitalAI" target="_blank" rel="noopener noreferrer">Choose Explorer</a>
            </article>

            <article className="access-plan creator-plan">
              <div className="plan-header">Endgame</div>
              <h3>Creator</h3>
              <p className="plan-description">The full vault for building from idea to finished result.</p>
              <ul className="plan-features"><li>Prompts+</li><li>Tools+</li><li>Custom GPTs+</li><li>Courses+</li><li>Workflows</li></ul>
              <a className="button primary full" href="https://www.facebook.com/meimeidigitalAI" target="_blank" rel="noopener noreferrer">Choose Creator</a>
            </article>
          </div>
        </div>
      </section>

      <section className="faq section" id="faq">
        <div className="faq-heading">
          <p className="eyebrow"><span />Questions, answered</p>
          <h2>Everything you need<br />to know.</h2>
          <p>Important details about Fluxora, access, and the creator community.</p>
        </div>

        <div className="faq-list">
          {faqs.map(([question, answer], index) => (
            <article className={openFaq === index ? "open" : ""} key={question}>
              <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}>
                <span>{String(index + 1).padStart(2, "0")}</span><b>{question}</b><i>+</i>
              </button>
              <div className="faq-answer"><p>{answer}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="final-cta section">
        <div className="cta-mark"><MoonMark /></div>
        <p className="eyebrow light"><span />Make the next move</p>
        <h2>Your ideas deserve<br /><em>a working system.</em></h2>
        <p>Start with the vault. Shape it around your process. Build what comes next.</p>
        <a className="button cream" href="https://www.facebook.com/meimeidigitalAI" target="_blank" rel="noopener noreferrer">Message us</a>
      </section>

      <footer>
        <div className="footer-brand">
          <a className="brand" href="#top"><MoonMark /><span><b>Fluxora</b><small>Create. Ideate. Generate.</small></span></a>
          <p>Useful systems for ambitious ideas.</p>
        </div>
        <div><small>Explore</small><a href="#products">Products</a><a href="#gallery">Gallery</a><a href="#pricing">Pricing</a></div>
        <div><small>Connect</small><a href="https://t.me/PHAICommunity" target="_blank" rel="noopener noreferrer">Community</a><a href={settings.follow_page_url} target="_blank" rel="noopener noreferrer">Facebook</a></div>
        <div><small>Manage</small><a href="/admin">Admin panel</a><a href="#faq">FAQ</a></div>
        <p className="copyright">© 2026 Fluxora. All rights reserved.</p>
      </footer>
    </main>
  );
}
