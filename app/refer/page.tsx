import type { Metadata } from "next";
import ReferClient from "./refer-client";

export const metadata: Metadata = {
  title: "Affiliate Referrals | Fluxora",
  description: "Issue and track temporary Fluxora referral access.",
};

export default function ReferPage() {
  return <ReferClient />;
}
