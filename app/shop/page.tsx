import type { Metadata } from "next";
import { ArrowUpRight, LockKeyhole, PackageCheck, RefreshCw } from "lucide-react";
import { SiteFooter, SiteHeader } from "../components/fluxora";
import { loadShopCatalog } from "../lib/warzone-catalog";
import ShopCatalogView from "./shop-catalog";
import styles from "./shop.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Digital Shop | Fluxora",
  description: "Explore Fluxora's curated digital product catalog and current availability.",
};

const NAV_LINKS = [
  { href: "/start", label: "Guide" },
  { href: "/prompts", label: "Prompts" },
  { href: "/tools", label: "Tools" },
  { href: "/shop", label: "Shop" },
  { href: "/member", label: "Member" },
];

export default async function ShopPage() {
  const catalog = await loadShopCatalog();

  return (
    <div className={`fluxora-theme ${styles.page}`}>
      <SiteHeader links={NAV_LINKS} cta={{ href: "/pricing", label: "Fluxora Plans" }} />
      <main className={styles.main}>
        <div className={styles.shell}>
          <section className={styles.hero} aria-labelledby="shop-heading">
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}><span className={styles.eyebrowDot} /> The Fluxora digital shop</p>
              <h1 id="shop-heading">Digital essentials.<br /><em>One storefront.</em></h1>
              <p className={styles.lead}>
                Discover a curated selection of digital services, with live supplier availability.
                Online ordering and PHP retail prices are coming after product verification and payment setup.
              </p>
              <div className={styles.heroActions}>
                <a href="#shop-collection" className={styles.mainAction}>Explore the catalog <ArrowUpRight size={17} /></a>
                <a href="/pricing" className={styles.secondaryAction}>Fluxora membership plans</a>
              </div>
            </div>
            <div className={styles.heroAside} aria-label="Storefront launch status">
              <div className={styles.asideHead}><span className={styles.pulse} /> Catalog preview</div>
              <h2>Browse now.<br />Shop later.</h2>
              <p>Our catalog is read-only while the product and payment setup is finalized.</p>
              <div className={styles.asideRule} />
              <div className={styles.asideDetail}><RefreshCw size={16} /><span>Supplier stock updates periodically</span></div>
              <div className={styles.asideDetail}><LockKeyhole size={16} /><span>No payments or automated orders enabled</span></div>
              <div className={styles.asideDetail}><PackageCheck size={16} /><span>Approved products only</span></div>
            </div>
          </section>

          <div className={styles.separator} aria-hidden="true" />
          <div id="shop-collection">
            <ShopCatalogView catalog={catalog} />
          </div>
          <p className={styles.disclaimer}>
            Availability is indicative and not an offer of immediate fulfillment. Product listings are
            published only after review. No order or payment is collected on this page.
          </p>
        </div>
      </main>
      <SiteFooter links={[...NAV_LINKS, { href: "/pricing", label: "Pricing" }]} meta="© 2026 Fluxora" />
    </div>
  );
}
