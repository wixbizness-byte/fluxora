import type { Metadata } from "next";
import MembersPortal from "../members/members-portal";
import CommunityProfilePortal from "./community-profile-portal";
import SmartExpiryRetentionPanel from "./smart-expiry-retention-panel";
import ProgressHub from "./progress-hub";
import MemberAuthGate from "./member-auth-gate";
import MemberSectionTabs from "./member-section-tabs";
import MemberAdmin from "./member-admin";
import { MemberAccountHero, MemberOverview, MemberOverviewProvider } from "./member-overview";
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
            <MemberSectionTabs
              overview={<MemberOverview />}
              profile={
                <div id="community-profile">
                  <CommunityProfilePortal />
                </div>
              }
              progress={<ProgressHub />}
              access={
                <div id="membership">
                  <SmartExpiryRetentionPanel />
                  <MembersPortal />
                </div>
              }
              admin={<MemberAdmin />}
            />
          </MemberOverviewProvider>
        </MemberAuthGate>
      </main>

      <SiteFooter meta="Create. Ideate. Generate." />
    </div>
  );
}
