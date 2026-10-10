import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { SiteFooter, SiteHeader } from "../../components/fluxora";
import { loadPublishedShopCard } from "../../lib/shop-public-cards";
import { checkWarzoneListing } from "../../lib/warzone-listing";
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
  const supplier = card.supplier_service_id
    ? await checkWarzoneListing(card.supplier_service_id)
    : null;

  return (
    <div className={`fluxora-theme ${styles.page}`} data-home-theme="gold" data-shop-theme="true">
      <SiteHeader links={NAV} cta={{ href: "/shop", label: "Back to shop" }} />
      <main className={styles.main}>
        <div className={styles.shell}>
          <a className={styles.detailBack} href="/shop"><ArrowLeft size={16} /> Back to catalog</a>
          <article className={styles.detailLayout}>
            {card.image_url ? (
              <img className={styles.detailCover} src={card.image_url} alt={card.title} />
            ) : (
              <div className={`${styles.detailCover} ${styles.offerCover}`} role="img" aria-label={card.title + " cover placeholder"}>
                <Sparkles size={45} aria-hidden="true" />
                <strong>{card.title}</strong>
                <small>Digital subscription</small>
              </div>
            )}
            <div>
              <div className={styles.badges}>
                <span className={styles.badge}>{card.category_label}</span>
                <span className={`${styles.badge} ${/available|in stock/i.test(card.status_label) ? styles.badgeStatus : styles.badgeUpcoming}`}>{card.status_label}</span>
              </div>
              <h1 className={styles.detailTitle}>{card.title}</h1>
              <div className={styles.detailText}>{card.description || "More details will be available soon."}</div>
              {card.supplier_url === "https://t.me/WarzoneShopbot" ? (
                <div className={styles.supplierInfo}>
                  <h2>Supplier reference: Warzone Shop</h2>
                  <p>
                    {supplier?.status === "listed"
                      ? "Warzone currently reports this service as orderable. This confirms neither the subscription duration nor Google authorization."
                      : supplier?.status === "paused"
                      ? "Warzone currently lists this service but reports it unavailable for API orders."
                      : supplier?.status === "not_found"
                      ? "The Warzone service ID or expected supplier title does not match the current listing."
                      : "Supplier availability has not been verified."}
                  </p>
                  <a href={card.supplier_url} target="_blank" rel="noopener noreferrer"
                    className={styles.supplierLink}>
                    Open Warzone Shop on Telegram <ExternalLink size={16} aria-hidden="true" />
                  </a>
                  {supplier?.name ? (
                    <p>Warzone listing name: <strong>{supplier.name}</strong></p>
                  ) : null}
                  <p className={styles.supplierCaution}>
                    The current supplier name refers to “7 Days Expiry Links.”
                    Whether seven days is the link's redemption window or the
                    subscription term is not verified. An 18-month subscription,
                    activation eligibility, and resale authorization are not confirmed.
                    This Telegram link opens an independent supplier, not Fluxora checkout.
                  </p>
                </div>
              ) : null}
              <div className={styles.notice}>
                Product preview only. Fluxora checkout and automatic activation-link delivery
                are not enabled for this listing.
              </div>
            </div>
          </article>
        </div>
      </main>
      <SiteFooter links={NAV} meta="© 2026 Fluxora" />
    </div>
  );
}
