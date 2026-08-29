import type { Metadata } from "next";
import MembersPortal from "../members/members-portal";
import ResourceUsagePortal from "../members/resource-usage-portal";
import ActiveAccessPortal from "../members/active-access-portal";
import TrialAdmin from "./trial-admin";
import CommunityProfilePortal from "./community-profile-portal";
import SmartExpiryRetentionPanel from "./smart-expiry-retention-panel";
import NextBestActionPanel from "./next-best-action-panel";
import ProgressHub from "./progress-hub";
import MemberAuthGate from "./member-auth-gate";
import MemberSectionTabs from "./member-section-tabs";

export const metadata: Metadata = {
  title: "Member | Fluxora",
  description: "Manage your Fluxora progress, profile, membership, access, and registered devices from one member hub.",
};

export default function MemberPage() {
  return (
    <MemberAuthGate>
      <MemberSectionTabs
        profile={
          <div id="community-profile">
            <CommunityProfilePortal />
          </div>
        }
        progress={
          <>
            <NextBestActionPanel />
            <ProgressHub />
          </>
        }
        membership={
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
  );
}
