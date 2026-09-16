import AdminShell from "../admin-shell";
import StartAdminClient from "./start-admin";

export const metadata = {
  title: "Start Admin | Fluxora",
  description: "Manage Fluxora onboarding questions and recommendation eligibility.",
};

export default function StartAdminPage() {
  return (
    <AdminShell>
      <StartAdminClient />
    </AdminShell>
  );
}
