import type { Metadata } from "next";
import MemberAuthGate from "./member-auth-gate";
import MemberSections from "./member-sections";
import { MemberAccountHero, MemberOverviewProvider } from "./member-overview";
import { PageContainer, SiteFooter, SiteHeader } from "../components/fluxora";
import styles from "./member-shell.module.css";

export const metadata: Metadata = {
  title: "Member | Fluxora",
  description: "Manage your Fluxora progress, profile, membership, access, and registered devices from one member hub.",
};

export default function MemberPage() {
  return (
    <div className={`fluxora-theme ${styles.page}`}>
      <SiteHeader
        links={[
          { href: "/start", label: "Guide" },
          { href: "/prompts", label: "Prompts", target: "_blank" },
          { href: "/tools", label: "Tools", target: "_blank" },
          { href: "/member", label: "Member" },
        ]}
        cta={{ href: "/refer", label: "Refer & Earn" }}
      />

      <main>
        <PageContainer className={styles.intro}>
          <p className={styles.eyebrow}>Fluxora Member</p>
          <h1>Your Fluxora, in one place.</h1>
          <p>Manage your access, progress, creator profile, rewards, and the next things worth doing.</p>
        </PageContainer>

        <MemberAuthGate>
          <MemberOverviewProvider>
            <PageContainer>
              <MemberAccountHero />
            </PageContainer>
            <MemberSections />
          </MemberOverviewProvider>
        </MemberAuthGate>
      </main>

      <SiteFooter meta="Create. Ideate. Generate." />
    </div>
  );
}
