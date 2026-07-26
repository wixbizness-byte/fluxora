import AdminClient from "./admin-client";

export const metadata = {
  title: "Fluxora Admin",
  description: "Manage Fluxora website content.",
};

export default function AdminPage() {
  return <AdminClient />;
}
