import type { ReactNode } from "react";
import { PageContainer, SiteFooter, SiteHeader } from "../components/fluxora";
import styles from "./admin.module.css";

const ADMIN_LINKS = [
  { href: "/admin", label: "Content" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/member", label: "Member" },
];

const ADMIN_FOOTER_LINKS = [
  ...ADMIN_LINKS,
  { href: "/", label: "View Fluxora" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className={`fluxora-theme ${styles.shellPage}`}>
      <SiteHeader
        links={ADMIN_LINKS}
        cta={{ href: "/", label: "View Fluxora" }}
      />

      <main className={styles.shellMain}>
        <PageContainer>{children}</PageContainer>
      </main>

      <SiteFooter links={ADMIN_FOOTER_LINKS} meta="© 2026 Fluxora Admin" />
    </div>
  );
}
