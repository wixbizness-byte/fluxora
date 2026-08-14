import type { Metadata } from "next";
import MembersPortal from "./members-portal";
import ResourceUsagePortal from "./resource-usage-portal";
import TrialAdmin from "../member/trial-admin";

export const metadata: Metadata = {
  title: "Members | Fluxora",
  description: "Manage your Fluxora membership and registered devices.",
};

// Keep the admin-only resource usage panel mounted beside the existing member analytics.
export default function MembersPage() {
  return <><MembersPortal /><ResourceUsagePortal /><TrialAdmin /></>;
}
