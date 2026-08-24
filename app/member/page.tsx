import type { Metadata } from "next";
import MembersPortal from "../members/members-portal";
import ResourceUsagePortal from "../members/resource-usage-portal";
import ActiveAccessPortal from "../members/active-access-portal";
import TrialAdmin from "./trial-admin";
import CommunityProfilePortal from "./community-profile-portal";
import NextBestActionPanel from "./next-best-action-panel";
import ProgressionPanel from "./progression-panel";
import StarterJourneyPanel from "./starter-journey-panel";
import FirstWinPanel from "./first-win-panel";

export const metadata: Metadata = {
  title: "Member | Fluxora",
  description: "See your Next Best Action, level, XP, achievements, Starter Journey, First Win, profile, membership, and registered devices.",
};

export default function MemberPage() {
  return <>
    <NextBestActionPanel />
    <ProgressionPanel />
    <StarterJourneyPanel />
    <FirstWinPanel />
    <CommunityProfilePortal />
    <MembersPortal />
    <ResourceUsagePortal />
    <ActiveAccessPortal />
    <TrialAdmin />
  </>;
}
