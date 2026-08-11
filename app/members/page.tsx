import type { Metadata } from "next";
import MembersPortal from "./members-portal";
import TrialAdmin from "../member/trial-admin";

export const metadata: Metadata = {
  title: "Members | Fluxora",
  description: "Manage your Fluxora membership and registered devices.",
};

export default function MembersPage() {
  return <><MembersPortal /><TrialAdmin /></>;
}
