import AdminShell from "../admin-shell";
import OrdersAdmin from "./orders-admin";

export const metadata = {
  title: "Orders Admin | Fluxora",
  description: "Review Fluxora manual orders, payment confirmations, provisioning, and order notifications.",
};

export default function OrdersPage() {
  return (
    <AdminShell>
      <OrdersAdmin />
    </AdminShell>
  );
}
