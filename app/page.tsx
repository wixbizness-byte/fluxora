import type { Metadata } from "next";
import { ArrowUpRight, FileText, GraduationCap, Store, UsersRound, Wrench } from "lucide-react";
import { Button } from "./components/fluxora/button";
import { Card } from "./components/fluxora/card";
import { PageContainer } from "./components/fluxora/page-container";
import { SectionHeading } from "./components/fluxora/section-heading";
import { SiteFooter } from "./components/fluxora/site-footer";
import { SiteHeader } from "./components/fluxora/site-header";
import { HomeHeroGallery } from "./home-hero-gallery";
import { normalizeHomepageContent, type HomeFaq, type HomeGalleryImage, type HomeToolPreview } from "./home-data";
import { MESSENGER_COMMUNITY_URL, TELEGRAM_COMMUNITY_URL } from "./lib/community-links";
import { queryRows } from "./lib/supabase";
import styles from "./home.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fluxora — Create. Ideate. Generate.",
  description: "Explore Fluxora creator tools, prompts, community resources, and practical AI workflows.",
};

const destinations = [
  { title: "Fluxora Tools", description: "Access creator-focused tools and systems built to make ideas faster to execute.", href: "/tools", icon: Wrench, featured: true },
  { title: "Prompt Gallery", description: "Find supporting prompts and visual directions for the tools you use.", href: "/prompts", icon: FileText },
  { title: "Fluxora Community", description: "Connect with creators, resources, experiments, and practical feedback.", href: TELEGRAM_COMMUNITY_URL, icon: UsersRound, community: true },
  { title: "AI Course", description: "Learn practical AI content workflows through structured creator-first lessons.", href: "https://curzzo.com/communities/ai-content-creation-academy", icon: GraduationCap },
  { title: "Karousel", description: "Discover curated clothing finds, outfit inspiration, and affiliate shopping recommendations.", href: "https://karousel.shop", icon: Store },
] as const;

async function loadHomepageContent() {
  const [galleryResult, toolResult, faqResult] = await Promise.all([
    queryRows<HomeGalleryImage>("gallery_images", "select=*&is_active=eq.true&sort_order=lte.6&order=row_position.asc,sort_order.asc"),
    queryRows<HomeToolPreview>("homepage_tool_previews", "select=*&is_active=eq.true&order=sort_order.asc&limit=3"),
    queryRows<HomeFaq>("homepage_faqs", "select=*&is_active=eq.true&order=sort_order.asc&limit=5"),
  ]);

  return normalizeHomepageContent({
    gallery: galleryResult.data || [],
    tools: toolResult.data || [],
    faqs: faqResult.data || [],
  });
}

export default async function HomePage() {
  const content = await loadHomepageContent();

  return (
    <main className={`fluxora-theme ${styles.page}`}>
      <SiteHeader
        links={[
          { href: "/prompts", label: "Prompts", target: "_blank" },
          { href: "/tools", label: "Tools", target: "_blank" },
        ]}
        cta={{ href: "/start", label: "Start with Fluxora" }}
      />

      <section className={styles.hero}>
        <PageContainer className={styles.heroFrame}>
          <HomeHeroGallery rows={content.gallery} />
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={styles.heroContent}>
            <h1>Creator tools that turn ideas into output.</h1>
            <p>Fluxora gives creators practical AI tools, workflows, and supporting prompts in one clean place — built to help you make more, faster.</p>
            <div className={styles.heroActions}>
              <Button href="/tools">Explore tools <ArrowUpRight size={16} /></Button>
              <Button href="/start" variant="secondary">Start with Fluxora</Button>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer>
        <section className={styles.destinations}>
          <SectionHeading eyebrow="Explore Fluxora" title="Everything in one place." description="Jump straight to the part of Fluxora you need." />
          <div className={styles.destinationGrid}>
            {destinations.map((item) => {
              const Icon = item.icon;
              if ("community" in item && item.community) {
                return (
                  <Card className={styles.destinationCard} key={item.title}>
                    <Icon className={styles.destinationIcon} size={24} strokeWidth={1.8} />
                    <h2>{item.title}</h2>
                    <p>{item.description}</p>
                    <div className={styles.communityActions}>
                      <Button href={MESSENGER_COMMUNITY_URL} target="_blank" rel="noopener noreferrer" variant="secondary">Messenger <ArrowUpRight size={14} /></Button>
                      <Button href={TELEGRAM_COMMUNITY_URL} target="_blank" rel="noopener noreferrer">Telegram <ArrowUpRight size={14} /></Button>
                    </div>
                  </Card>
                );
              }
              return (
                <a className={`${styles.destinationLink} ${"featured" in item && item.featured ? styles.destinationLinkFeatured : ""}`} href={item.href} key={item.title} target={item.href.startsWith("http") ? "_blank" : undefined} rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                  <Card className={styles.destinationCard}>
                    {"featured" in item && item.featured && <span className={styles.startHere}>Start here</span>}
                    <Icon className={styles.destinationIcon} size={24} strokeWidth={1.8} />
                    <h2>{item.title}</h2>
                    <p>{item.description}</p>
                    <span className={styles.cardAction}>{item.title === "Fluxora Tools" ? "Explore tools" : "Open"} <ArrowUpRight size={14} /></span>
                  </Card>
                </a>
              );
            })}
          </div>
        </section>

        <section className={styles.featuredTools}>
          <div className={styles.sectionSplitHead}>
            <SectionHeading eyebrow="Featured Fluxora tools" title="Start with what you want to make." description="Three useful starting points from the Fluxora tool library." />
            <a href="/tools">View all tools <ArrowUpRight size={14} /></a>
          </div>
          <div className={styles.toolPreviewGrid}>
            {content.tools.map((tool, index) => (
              <a className={`${styles.toolPreviewCard} ${index === 0 ? styles.toolPreviewPrimary : ""}`} href={tool.button_url || "/tools"} key={tool.id}>
                <div className={styles.toolPreviewImage}><img src={tool.image_url} alt="" /></div>
                <div className={styles.toolPreviewBody}>
                  <span>{tool.badge}</span>
                  <h2>{tool.title}</h2>
                  <p>{tool.description}</p>
                  <strong>{tool.button_label || "Open tool"} <ArrowUpRight size={14} /></strong>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className={styles.faqSection}>
          <SectionHeading eyebrow="Frequently asked questions" title="What new users usually ask first." description="Quick answers before you jump into the tools." />
          <div className={styles.faqList}>
            {content.faqs.map((faq, index) => (
              <details className={styles.faqItem} key={faq.id} open={index === 0}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.finalCta}>
          <div>
            <span>Ready when you are</span>
            <h2>Make something with Fluxora.</h2>
            <p>Explore the creator tools, choose what you want to make, and move straight from idea to usable output.</p>
            <div className={styles.finalCtaActions}>
              <Button href="/tools">Explore Fluxora Tools <ArrowUpRight size={16} /></Button>
              <Button href="/start" variant="secondary">Start with Fluxora</Button>
            </div>
          </div>
        </section>
      </PageContainer>

      <SiteFooter meta="Create. Ideate. Generate." />
    </main>
  );
}
