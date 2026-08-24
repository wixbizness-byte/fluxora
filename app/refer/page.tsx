import type { Metadata } from "next";
import ReferClient from "./refer-client";

export const metadata: Metadata = {
  title: "Refer & Earn | Fluxora",
  description: "Share your Fluxora referral link, track qualified referrals, and earn Premium access days.",
};

export default function ReferPage() {
  return <ReferClient />;
}
