import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageOff } from "lucide-react";
import { SiteFooter, SiteHeader } from "../../components/fluxora";
import { loadPublishedShopCard } from "../../lib/shop-public-cards";
import styles from "../shop-cards.module.css";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/start", label: "Guide" },
  { href: "/tools", label: "Tools" },
  { href: "/prompts", label: "Prompts" },
  { href: "/shop", label: "Shop" },
];

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const card = await loadPublishedShopCard(slug);
  if (!card) return { title: "Product not found | Fluxora", robots: { index: false } };
  return { title: `${card.title} | Fluxora Shop`, description: card.description.slice(0, 155) };
}

export default async function ShopProductPage({ params }: PageProps) {
  const { slug } = await params;
  const card = await loadPublishedShopCard(slug);
  if (!card) notFound();

  return (
    <div className={`fluxora-theme ${styles.page}`}>
      <SiteHeader links={NAV} cta={{ href: "/shop", label: "Back to shop" }} />
      <main className={styles.main}>
        <div className={styles.shell}>
          <a className={styles.detailBack} href="/shop"><ArrowLeft size={16} /> Back to catalog</a>
          <article className={styles.detailLayout}>
            {card.image_url ? (
              <img className={styles.detailCover} src={card.image_url} alt={card.title} />
            ) : <div className={`${styles.detailCover} ${styles.coverFallback}`}><ImageOff size={36} /></div>}
            <div>
              <div className={styles.badges}>
                <span className={styles.badge}>{card.category_label}</span>
                <span className={`${styles.badge} ${/available|in stock/i.test(card.status_label) ? styles.badgeStatus : styles.badgeUpcoming}`}>{card.status_label}</span>
              </div>
              <h1 className={styles.detailTitle}>{card.title}</h1>
              <div className={styles.detailText}>{card.description || "More details will be available soon."}</div>
              <div className={styles.notice}>
                This is a catalog preview. Online checkout and activation-link delivery are not
                yet offered for this product.
              </div>
            </div>
          </article>
        </div>
      </main>
      <SiteFooter links={NAV} meta="© 2026 Fluxora" />
    </div>
  );
}
