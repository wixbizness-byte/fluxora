import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
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
  const card = await loadPublishedShopCard((await params).slug);
  if (!card) return { title: "Product not found | Fluxora", robots: { index: false } };
  return { title: `${card.title} | Fluxora Shop`, description: card.description.slice(0, 155) };
}

export default async function ShopProductPage({ params }: PageProps) {
  const { slug } = await params;
  const card = await loadPublishedShopCard(slug);
  if (!card) notFound();

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
              <div className={`${styles.detailCover} ${styles.offerCover}`} role="img" aria-label={card.title}>
                <Sparkles size={45} aria-hidden="true" />
                <strong>{card.title}</strong>
              </div>
            )}
            <div>
              <h1 className={styles.detailTitle}>{card.title}</h1>
              {card.description ? <div className={styles.detailText}>{card.description}</div> : null}
              {card.price_centavos !== null ? (
                <p style={{fontSize:22,fontWeight:800,margin:"18px 0"}}>
                  ₱{(card.price_centavos / 100).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}
                </p>
              ) : null}
              {card.terms_text ? (
                <section style={{marginTop:22}}>
                  <h2 style={{fontSize:18,marginBottom:11}}>Terms and conditions</h2>
                  <div className={styles.detailText}>{card.terms_text}</div>
                </section>
              ) : null}

            </div>
          </article>
        </div>
      </main>
      <SiteFooter links={NAV} meta="© 2026 Fluxora" />
    </div>
  );
}
