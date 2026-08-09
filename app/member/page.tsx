import type { Metadata } from "next";
import MemberManager from "./member-manager";

export const metadata: Metadata = {
  title: "Member Manager | Fluxora",
  description: "Manage Fluxora member access securely.",
};

export default function MemberPage() {
  return <MemberManager />;
}
