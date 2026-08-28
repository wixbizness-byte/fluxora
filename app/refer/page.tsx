import type { Metadata } from "next";
import ReferClient from "./refer-client";
import ReferralDeepLinkBuilder from "./referral-deep-link-builder";
import ShareableRewardsPanel from "./shareable-rewards-panel";
import ReferralTrustPanel from "./referral-trust-panel";
import MilestonesPanel from "./milestones-panel";
import ReferralTiersPanel from "./referral-tiers-panel";
import RewardWalletPanel from "./reward-wallet-panel";

export const metadata: Metadata = {
  title: "Refer & Earn | Fluxora",
  description: "Share your Fluxora referral link, verify referral lifecycle status, understand every earned reward, climb referral ranks, and manage Premium days.",
};

export default function ReferPage() {
  return (
    <>
      <ReferClient />
      <ReferralDeepLinkBuilder />
      <ShareableRewardsPanel />
      <ReferralTrustPanel />
      <MilestonesPanel />
      <ReferralTiersPanel />
      <div id="reward-wallet">
        <RewardWalletPanel />
      </div>
    </>
  );
}
