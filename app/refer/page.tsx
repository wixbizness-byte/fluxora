import type { Metadata } from "next";
import ReferClient from "./refer-client";
import ReferralSectionTabs from "./referral-section-tabs";

export const metadata: Metadata = {
  title: "Refer & Earn | Fluxora",
  description: "Share your Fluxora referral link, verify referral lifecycle status, understand every earned reward, climb referral ranks, and manage Premium days.",
};

export default function ReferPage() {
  return (
    <>
      <ReferClient />
      <ReferralSectionTabs />
    </>
  );
}
