import type { Metadata } from "next";
import PricingClient from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing | Fluxora",
  description: "Choose the Fluxora access level that fits your momentum.",
};

export default function PricingPage() {
  return <PricingClient />;
}
