import AdminAccounts from "../admin-accounts";
import AdminShell from "../admin-shell";

export const metadata = {
  title: "Admin Accounts | Fluxora",
  description: "Manage Google accounts authorized to access Fluxora Admin.",
};

export default function AdminAccountsPage() {
  return (
    <AdminShell>
      <AdminAccounts />
    </AdminShell>
  );
}
