import AdminShell from "./admin-shell";
import GoogleAdminGate from "./google-admin-gate";
import PricingTierAdminEnhancer from "./pricing-tier-admin-enhancer";

export const metadata = {
  title: "Content Admin | Fluxora",
  description: "Manage Fluxora's public content, pricing, and payment presentation.",
};

export default function AdminPage() {
  return (
    <AdminShell>
      <GoogleAdminGate />
      <PricingTierAdminEnhancer />
    </AdminShell>
  );
}
