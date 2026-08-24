import type { Metadata } from "next";
import ReferClient from "./refer-client";
import MilestonesPanel from "./milestones-panel";
import RewardWalletPanel from "./reward-wallet-panel";

export const metadata: Metadata = {
  title: "Refer & Earn | Fluxora",
  description: "Share your Fluxora referral link, track qualified referrals, earn Premium access days, unlock milestone bonuses, and manage rewards in your wallet.",
};

export default function ReferPage() {
  return (
    <>
      <ReferClient />
      <MilestonesPanel />
      <div id="reward-wallet">
        <RewardWalletPanel />
      </div>
    </>
  );
}
