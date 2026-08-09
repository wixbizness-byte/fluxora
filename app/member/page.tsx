import type { Metadata } from "next";
import MemberManager from "./member-manager";
import AffiliateAdmin from "./affiliate-admin";

export const metadata: Metadata = {
  title: "Member Manager | Fluxora",
  description: "Manage Fluxora member access securely.",
};

export default function MemberPage() {
  return (
    <>
      <MemberManager />
      <AffiliateAdmin />
    </>
  );
}
