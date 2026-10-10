import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../components/fluxora";
import { loadPublishedShopCards } from "../lib/shop-public-cards";
import { unavailablePublishedCardIds } from "../lib/shop-supplier-availability";
import ShopCardGrid from "./shop-card-grid";
import styles from "./shop-cards.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Digital Shop | Fluxora",
  description: "Browse Fluxora products and review details before ordering.",
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
  const unavailableIds = catalog.status === "ready" ?
    await unavailablePublishedCardIds(catalog.cards) : [];

  return (
    <div className={`fluxora-theme ${styles.page}`} data-home-theme="gold" data-shop-theme="true">
      <SiteHeader links={NAV} cta={{ href: "/pricing", label: "View plans" }} />
      <main className={styles.main}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <p className={styles.eyebrow}>Fluxora shop</p>
            <h1>Discover what's <em>next.</em></h1>
            <p className={styles.lead}>
              Choose a product, review its details and terms, then order.
            </p>
          </header>
          {catalog.status === "unavailable" ? (
            <div className={styles.empty} role="status">
              <h2>Catalog temporarily unavailable</h2>
              <p>Please check back shortly.</p>
            </div>
          ) : (
            <ShopCardGrid cards={catalog.cards} unavailableIds={unavailableIds} />
          )}
          <p className={styles.disclaimer}>
            Your orders are managed through Fluxora Shop.
          </p>
        </div>
      </main>
      <SiteFooter links={NAV} meta="© 2026 Fluxora" />
    </div>
  );
}
