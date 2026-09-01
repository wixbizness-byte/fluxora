import type { Metadata } from "next";
import PricingClient from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing | Fluxora",
  description: "Compare Fluxora access tiers and see the resources included with each one.",
};

export default function PricingPage() {
  return <PricingClient />;
}
