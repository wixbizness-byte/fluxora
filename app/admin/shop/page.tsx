import AdminShell from "../admin-shell";
import GoogleAdminGate from "../google-admin-gate";
import ShopManager from "./shop-manager";

export const metadata = {
  title: "Shop Manager | Fluxora Admin",
  description: "Upload product covers and manage published Fluxora Shop cards.",
  robots: { index: false, follow: false },
};

export default function ShopManagerPage() {
  return (
    <AdminShell>
      <GoogleAdminGate>
        <ShopManager />
      </GoogleAdminGate>
    </AdminShell>
  );
}
