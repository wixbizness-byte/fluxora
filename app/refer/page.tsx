import type { Metadata } from "next";
import ReferClient from "./refer-client";
import MilestonesPanel from "./milestones-panel";

export const metadata: Metadata = {
  title: "Refer & Earn | Fluxora",
  description: "Share your Fluxora referral link, track qualified referrals, earn Premium access days, and unlock referral milestone bonuses.",
};

export default function ReferPage() {
  return (
    <>
      <ReferClient />
      <MilestonesPanel />
    </>
  );
}
