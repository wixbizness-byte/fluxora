import type { Metadata } from "next";
import { SiteFooter } from "../components/fluxora/site-footer";
import { SiteHeader } from "../components/fluxora/site-header";
import MembersPortal from "../members/members-portal";
import ResourceUsagePortal from "../members/resource-usage-portal";
import ActiveAccessPortal from "../members/active-access-portal";
import TrialAdmin from "./trial-admin";
import CommunityProfilePortal from "./community-profile-portal";
import SmartExpiryRetentionPanel from "./smart-expiry-retention-panel";
import ProgressHub from "./progress-hub";
import MemberAuthGate from "./member-auth-gate";
import MemberOverview from "./member-overview";
import MemberSectionTabs from "./member-section-tabs";

export const metadata: Metadata = {
  title: "Member Hub | Fluxora",
  description: "Manage your Fluxora access, progress, creator profile, rewards, and registered devices from one member hub.",
};

export default function MemberPage() {
  return (
    <div className="fluxora-theme">
      <SiteHeader
        links={[
          { href: "/start", label: "Guide" },
          { href: "/prompts", label: "Prompts", target: "_blank" },
          { href: "/tools", label: "Tools", target: "_blank" },
        ]}
        cta={{ href: "/member", label: "Member" }}
      />

      <MemberAuthGate>
        <MemberSectionTabs
          overview={<MemberOverview />}
          progress={<ProgressHub />}
          profile={
            <div id="community-profile">
              <CommunityProfilePortal />
            </div>
          }
          access={
            <div id="membership">
              <SmartExpiryRetentionPanel />
              <MembersPortal />
              <ResourceUsagePortal />
              <ActiveAccessPortal />
              <TrialAdmin />
            </div>
          }
        />
      </MemberAuthGate>

      <SiteFooter meta="Create. Ideate. Generate." />
    </div>
  );
}
