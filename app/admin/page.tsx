import GoogleAdminGate from "./google-admin-gate";
import PricingTierAdminEnhancer from "./pricing-tier-admin-enhancer";

export const metadata = {
  title: "Fluxora Admin",
  description: "Manage Fluxora website content.",
};

export default function AdminPage() {
  return (
    <>
      <GoogleAdminGate />
      <PricingTierAdminEnhancer />
    </>
  );
}
