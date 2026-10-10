import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../components/fluxora";
import { loadPublishedShopCards } from "../lib/shop-public-cards";
import ShopCardGrid from "./shop-card-grid";
import styles from "./shop-cards.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Digital Shop | Fluxora",
  description: "Explore Fluxora's curated digital catalog, visual previews, and product details.",
};

const NAV = [
  { href: "/start", label: "Guide" },
  { href: "/tools", label: "Tools" },
  { href: "/prompts", label: "Prompts" },
  { href: "/shop", label: "Shop" },
  { href: "/member", label: "Member" },
];

export default async function ShopPage() {
  const catalog = await loadPublishedShopCards();

  return (
    <div className={`fluxora-theme ${styles.page}`}>
      <SiteHeader links={NAV} cta={{ href: "/pricing", label: "View plans" }} />
      <main className={styles.main}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <p className={styles.eyebrow}>Fluxora shop</p>
            <h1>Discover what's <em>next.</em></h1>
            <p className={styles.lead}>
              Browse digital product previews with the same image-first experience as Fluxora Tools.
              Product details are available; purchases are not enabled yet.
            </p>
          </header>
          {catalog.status === "unavailable" ? (
            <div className={styles.empty} role="status">
              <h2>Catalog temporarily unavailable</h2>
              <p>Please check back shortly.</p>
            </div>
          ) : (
            <ShopCardGrid cards={catalog.cards} />
          )}
          <p className={styles.disclaimer}>
            Listings are informational previews only. No checkout or automatic supplier fulfillment
            is available on this page.
          </p>
        </div>
      </main>
      <SiteFooter links={NAV} meta="© 2026 Fluxora" />
    </div>
  );
}
