import type { Metadata } from "next";
import MembersPortal from "../members/members-portal";
import ResourceUsagePortal from "../members/resource-usage-portal";
import ActiveAccessPortal from "../members/active-access-portal";
import TrialAdmin from "./trial-admin";
import CommunityProfilePortal from "./community-profile-portal";
import NextBestActionPanel from "./next-best-action-panel";
import ProgressionPanel from "./progression-panel";
import WeeklyMissionsPanel from "./weekly-missions-panel";
import DailyActivityPanel from "./daily-activity-panel";
import StarterJourneyPanel from "./starter-journey-panel";
import FirstWinPanel from "./first-win-panel";

export const metadata: Metadata = {
  title: "Member | Fluxora",
  description: "See your Next Best Action, level, XP, weekly missions, achievements, daily streak, Starter Journey, First Win, profile, membership, and registered devices.",
};

export default function MemberPage() {
  return <>
    <NextBestActionPanel />
    <ProgressionPanel />
    <WeeklyMissionsPanel />
    <DailyActivityPanel />
    <StarterJourneyPanel />
    <FirstWinPanel />
    <CommunityProfilePortal />
    <MembersPortal />
    <ResourceUsagePortal />
    <ActiveAccessPortal />
    <TrialAdmin />
  </>;
}
