import type { Metadata } from "next";
import ReferralSectionTabs from "./referral-section-tabs";

export const metadata: Metadata = {
  title: "Refer & Earn | Fluxora",
  description: "Share your Fluxora referral link, manage Premium-day rewards, use referral tools, and climb permanent referral ranks.",
};

export default function ReferPage() {
  return <ReferralSectionTabs />;
}
