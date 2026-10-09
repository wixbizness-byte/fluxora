import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../../components/fluxora";
import { sandboxConfigured } from "../../lib/shop-demo-auth";
import DemoCheckoutClient from "./demo-checkout-client";
import styles from "../shop.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sandbox Checkout | Fluxora",
  robots: { index: false, follow: false },
};

export default function ShopDemoPage() {
  const enabled = sandboxConfigured();
  return (
    <div className={`fluxora-theme ${styles.page}`}>
      <SiteHeader
        links={[{ href: "/shop", label: "Shop" }, { href: "/shop/orders", label: "My orders" }, { href: "/pricing", label: "Plans" }]}
        cta={{ href: "/shop", label: "Back to Shop" }}
      />
      <main className={styles.main}>
        <div className={styles.shell} style={{ paddingTop: 75, paddingBottom: 120 }}>
          <p className={styles.eyebrow}>Restricted testing environment</p>
          <h1 style={{ maxWidth: 900, marginBottom: 18, fontSize: "clamp(36px, 5vw, 64px)", letterSpacing: "-.045em" }}>
            Try digital-product <em style={{ color: "#e3bb69" }}>delivery.</em>
          </h1>
          <p className={styles.lead} style={{ marginTop: 12, marginBottom: 34 }}>
            This is a test-only Google AI Pro activation flow. Successful sandbox payments display a
            simulated, non-redeemable link. No Warzone orders are made.
          </p>
          <DemoCheckoutClient enabled={enabled} />
        </div>
      </main>
      <SiteFooter meta="Fluxora — sandbox demo, not a real subscription sale" />
    </div>
  );
}
