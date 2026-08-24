import type { Metadata } from "next";
import MembersPortal from "../members/members-portal";
import ResourceUsagePortal from "../members/resource-usage-portal";
import ActiveAccessPortal from "../members/active-access-portal";
import TrialAdmin from "./trial-admin";
import CommunityProfilePortal from "./community-profile-portal";
import StarterJourneyPanel from "./starter-journey-panel";

export const metadata: Metadata = {
  title: "Member | Fluxora",
  description: "Manage your Fluxora profile, Starter Journey, submissions, membership, and registered devices.",
};

export default function MemberPage() {
  return <>
    <StarterJourneyPanel />
    <CommunityProfilePortal />
    <MembersPortal />
    <ResourceUsagePortal />
    <ActiveAccessPortal />
    <TrialAdmin />
  </>;
}
