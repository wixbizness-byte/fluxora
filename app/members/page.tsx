import type { Metadata } from "next";
import MembersPortal from "./members-portal";

export const metadata: Metadata = {
  title: "Members | Fluxora",
  description: "Manage your Fluxora membership and registered devices.",
};

export default function MembersPage() {
  return <MembersPortal />;
}
