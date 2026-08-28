import type { Metadata } from "next";
import MembersPortal from "../members/members-portal";
import ResourceUsagePortal from "../members/resource-usage-portal";
import ActiveAccessPortal from "../members/active-access-portal";
import TrialAdmin from "./trial-admin";
import CommunityProfilePortal from "./community-profile-portal";
import SmartExpiryRetentionPanel from "./smart-expiry-retention-panel";
import NextBestActionPanel from "./next-best-action-panel";
import ProgressHub from "./progress-hub";

export const metadata: Metadata = {
  title: "Member | Fluxora",
  description: "Manage your Fluxora progress, profile, membership, access, and registered devices from one member hub.",
};

export default function MemberPage() {
  return <>
    <SmartExpiryRetentionPanel />
    <NextBestActionPanel />
    <ProgressHub />
    <div id="community-profile"><CommunityProfilePortal /></div>
    <MembersPortal />
    <ResourceUsagePortal />
    <ActiveAccessPortal />
    <TrialAdmin />
  </>;
}
