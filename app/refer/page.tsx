import type { Metadata } from "next";
import ReferClient from "./refer-client";
import MilestonesPanel from "./milestones-panel";
import ReferralTiersPanel from "./referral-tiers-panel";
import RewardWalletPanel from "./reward-wallet-panel";

export const metadata: Metadata = {
  title: "Refer & Earn | Fluxora",
  description: "Share your Fluxora referral link, climb permanent referral ranks, track qualified referrals, earn Premium access days, unlock milestone bonuses, and manage rewards in your wallet.",
};

export default function ReferPage() {
  return (
    <>
      <ReferClient />
      <MilestonesPanel />
      <ReferralTiersPanel />
      <div id="reward-wallet">
        <RewardWalletPanel />
      </div>
    </>
  );
}
