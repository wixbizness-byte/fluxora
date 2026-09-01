import type { Metadata } from "next";
import { Badge, PageContainer, SiteFooter, SiteHeader } from "../components/fluxora";
import ReferralSectionTabs from "./referral-section-tabs";
import styles from "./referral-section-tabs.module.css";

export const metadata: Metadata = {
  title: "Refer & Earn | Fluxora",
  description: "Share your Fluxora referral link, manage Premium-day rewards, use referral tools, and climb permanent referral ranks.",
};

const NAV_LINKS = [
  { href: "/start", label: "Guide" },
  { href: "/prompts", label: "Prompts" },
  { href: "/tools", label: "Tools" },
  { href: "/member", label: "Member" },
];

const FOOTER_LINKS = [
  ...NAV_LINKS,
  { href: "/refer", label: "Refer & Earn" },
];

export default function ReferPage() {
  return (
    <div className={`fluxora-theme ${styles.page}`}>
      <SiteHeader links={NAV_LINKS} cta={{ href: "/pricing", label: "Pricing" }} />
      <main className={styles.main}>
        <PageContainer>
          <section className={styles.intro} aria-labelledby="refer-heading">
            <Badge variant="brand">Refer & Earn</Badge>
            <h1 id="refer-heading">Share Fluxora. Earn more access.</h1>
            <p>
              Manage your permanent referral link, earned access, product-specific sharing tools, and referral ranks from one place.
            </p>
          </section>
        </PageContainer>
        <ReferralSectionTabs />
      </main>
      <SiteFooter links={FOOTER_LINKS} meta="© 2026 Fluxora" />
    </div>
  );
}
