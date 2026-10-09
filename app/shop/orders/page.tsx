import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../../components/fluxora";
import DemoOrdersClient from "./demo-orders-client";
import styles from "../shop.module.css";

export const metadata: Metadata = {
  title: "My Test Orders | Fluxora",
  robots: { index: false, follow: false },
};

export default function DemoOrdersPage() {
  return (
    <div className={`fluxora-theme ${styles.page}`}>
      <SiteHeader
        links={[{ href: "/shop", label: "Shop" }, { href: "/shop/demo", label: "Demo checkout" }, { href: "/pricing", label: "Plans" }]}
        cta={{ href: "/shop", label: "Back to Shop" }}
      />
      <main className={styles.main}>
        <div className={styles.shell} style={{ paddingTop: 72, paddingBottom: 120 }}>
          <p className={styles.eyebrow}>Private delivery history</p>
          <h1 style={{ fontSize: "clamp(36px,5vw,64px)", letterSpacing: "-.045em", marginBottom: 16 }}>
            My demo orders.
          </h1>
          <p className={styles.lead} style={{ marginTop: 0, marginBottom: 34 }}>
            Sandbox payments and simulated digital deliveries. These links are examples only, not real licenses.
          </p>
          <DemoOrdersClient />
        </div>
      </main>
      <SiteFooter meta="© 2026 Fluxora — test-mode orders only" />
    </div>
  );
}
