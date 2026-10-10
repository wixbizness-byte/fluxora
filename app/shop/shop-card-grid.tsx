"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, ImageOff, Search } from "lucide-react";
import type { ShopCard } from "../lib/shop-public-cards";
import styles from "./shop-cards.module.css";

export default function ShopCardGrid({ cards }: { cards: ShopCard[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return !term ? cards : cards.filter((card) =>
      [card.title, card.category_label, card.description].some((value) =>
        value.toLocaleLowerCase().includes(term))
    );
  }, [cards, query]);

  return (
    <>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search aria-hidden="true" size={18} />
          <input type="search" aria-label="Search shop catalog" value={query}
            placeholder="Search the shop..." onChange={(event) => setQuery(event.target.value)} />
        </label>
        <p className={styles.count}>
          {visible.length} {visible.length === 1 ? "listing" : "listings"}
        </p>
      </div>
      {visible.length ? (
        <div className={styles.grid}>
          {visible.map((card) => (
            <article key={card.id} className={styles.card}>
              <a href={`/shop/${encodeURIComponent(card.slug)}`} className={styles.cover} aria-label={`View details for ${card.title}`}>
                {card.image_url ? (
                  <img src={card.image_url} alt={card.title} loading="lazy" decoding="async" />
                ) : (
                  <span className={styles.coverFallback}><ImageOff size={26} aria-hidden="true" /></span>
                )}
              </a>
              <div className={styles.cardContent}>
                <div className={styles.badges}>
                  <span className={styles.badge}>{card.category_label}</span>
                  <span className={`${styles.badge} ${/available|in stock/i.test(card.status_label) ? styles.badgeStatus : styles.badgeUpcoming}`}>{card.status_label}</span>
                </div>
                <h2 className={styles.title}>{card.title}</h2>
                <a className={styles.action} href={`/shop/${encodeURIComponent(card.slug)}`}>
                  <ArrowUpRight size={14} aria-hidden="true" /> View Details
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <ImageOff size={29} aria-hidden="true" />
          <h2>{cards.length ? "No matching products" : "Catalog coming soon"}</h2>
          <p>{cards.length ? "Try another search term." : "New digital products and visual previews will appear here as they're published."}</p>
        </div>
      )}
    </>
  );
}
