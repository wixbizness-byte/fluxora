import type { Metadata } from "next";
import { ArrowUpRight, FileText, GraduationCap, Store, UsersRound, Wrench } from "lucide-react";
import { Badge } from "./components/fluxora/badge";
import { Button } from "./components/fluxora/button";
import { Card } from "./components/fluxora/card";
import { PageContainer } from "./components/fluxora/page-container";
import { SectionHeading } from "./components/fluxora/section-heading";
import { SiteFooter } from "./components/fluxora/site-footer";
import { SiteHeader } from "./components/fluxora/site-header";
import { MESSENGER_COMMUNITY_URL, TELEGRAM_COMMUNITY_URL } from "./lib/community-links";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "Fluxora — Create. Ideate. Generate.",
  description: "Explore Fluxora tools, prompts, learning resources, community, and related creator products.",
};

const destinations = [
  { title: "Fluxora Community", description: "Connect with creators sharing useful workflows, resources, experiments, and practical feedback.", href: TELEGRAM_COMMUNITY_URL, icon: UsersRound, community: true },
  { title: "Fluxora Tools", description: "Access creator-focused tools and systems built to make ideas faster to execute.", href: "/tools", icon: Wrench },
  { title: "Prompt Gallery", description: "Browse, study, copy, and adapt community-driven prompts for your next idea.", href: "/prompts", icon: FileText },
  { title: "AI Course", description: "Learn practical AI content workflows through structured lessons built for creators and online sellers.", href: "https://curzzo.com/communities/ai-content-creation-academy", icon: GraduationCap },
  { title: "Karousel", description: "Discover curated clothing finds, outfit inspiration, and affiliate shopping recommendations.", href: "https://karousel.shop", icon: Store },
] as const;

export default function HomePage() {
  return <main className={`fluxora-theme ${styles.page}`}>
    <SiteHeader
      links={[
        { href: "/start", label: "Guide" },
        { href: "/prompts", label: "Prompts", target: "_blank" },
        { href: "/tools", label: "Tools", target: "_blank" },
        { href: "/member", label: "Member", target: "_blank" },
      ]}
      cta={{ href: "/start", label: "Start with Fluxora" }}
    />

    <section className={styles.hero}>
      <PageContainer className={styles.heroContent}>
        <Badge variant="brand">Fluxora for creators</Badge>
        <h1>A focused home for ideas that move.</h1>
        <p>Explore practical tools, prompts, learning resources, community, and related products built around better creative momentum.</p>
        <div className={styles.heroActions}>
          <Button href="/start">Start with Fluxora <ArrowUpRight size={16} /></Button>
          <Button href={MESSENGER_COMMUNITY_URL} target="_blank" rel="noopener noreferrer" variant="secondary">Messenger <ArrowUpRight size={16} /></Button>
          <Button href={TELEGRAM_COMMUNITY_URL} target="_blank" rel="noopener noreferrer" variant="secondary">Telegram <ArrowUpRight size={16} /></Button>
        </div>
      </PageContainer>
    </section>

    <PageContainer>
      <section className={styles.destinations}>
        <SectionHeading eyebrow="Explore Fluxora" title="Find the right place for your next idea." description="Start with the destination that best matches what you want to make, learn, or share." />
        <div className={styles.destinationGrid}>
          {destinations.map((destination) => {
            const Icon = destination.icon;

            if ("community" in destination) {
              return <div className={styles.destinationLink} key={destination.title}>
                <Card className={styles.destinationCard}>
                  <Icon className={styles.destinationIcon} size={22} strokeWidth={1.8} aria-hidden="true" />
                  <h2>{destination.title}</h2>
                  <p>{destination.description}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "auto", paddingTop: "24px" }}>
                    <Button href={MESSENGER_COMMUNITY_URL} target="_blank" rel="noopener noreferrer" variant="secondary">Messenger <ArrowUpRight size={16} /></Button>
                    <Button href={TELEGRAM_COMMUNITY_URL} target="_blank" rel="noopener noreferrer">Telegram <ArrowUpRight size={16} /></Button>
                  </div>
                </Card>
              </div>;
            }

            return <a className={styles.destinationLink} href={destination.href} key={destination.title} target="_blank" rel="noopener noreferrer">
              <Card className={styles.destinationCard}>
                <Icon className={styles.destinationIcon} size={22} strokeWidth={1.8} aria-hidden="true" />
                <h2>{destination.title}</h2>
                <p>{destination.description}</p>
                <span className={styles.cardAction}>Open <ArrowUpRight size={16} /></span>
              </Card>
            </a>;
          })}
        </div>
      </section>
    </PageContainer>

    <SiteFooter meta="Create. Ideate. Generate." />
  </main>;
}
