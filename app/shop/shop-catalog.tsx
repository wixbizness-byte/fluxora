"use client";

import { useMemo, useState } from "react";
import { Package, Search, ShieldCheck } from "lucide-react";
import type { ShopCatalog, ShopProduct } from "../lib/warzone-catalog";
import styles from "./shop.module.css";

type StockFilter = "all" | "available";

export default function ShopCatalogView({ catalog }: { catalog: ShopCatalog }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");

  const products = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return catalog.products.filter((product) =>
      (filter === "all" || product.available) &&
      (!term || product.name.toLocaleLowerCase().includes(term) ||
        product.id.toLocaleLowerCase().includes(term)),
    );
  }, [catalog.products, query, filter]);

  if (catalog.status !== "ready") {
    const message = catalog.status === "awaiting_approval"
      ? "Products will appear here after their reseller authorization and listing details are reviewed."
      : catalog.status === "not_configured"
        ? "The shop is being configured. Please check back later."
        : "The supplier catalog is temporarily unavailable. Please check back later.";

    return (
      <section className={styles.empty} aria-live="polite">
        <ShieldCheck size={28} aria-hidden="true" />
        <h2>Catalog not yet published</h2>
        <p>{message}</p>
        <a href="/pricing">Explore Fluxora memberships</a>
      </section>
    );
  }

  const availableCount = catalog.products.filter((product) => product.available).length;

  return (
    <section className={styles.catalog} aria-labelledby="shop-items-title">
      <div className={styles.catalogHeader}>
        <div>
          <p className={styles.eyebrow}>Reseller collection</p>
          <h2 id="shop-items-title">Available listings</h2>
          <p>Stock is sourced from our supplier and may change before checkout is enabled.</p>
        </div>
        <div className={styles.summary} aria-label="Catalog summary">
          <strong>{catalog.products.length}</strong>
          <span>Approved listings</span>
          <strong>{availableCount}</strong>
          <span>In stock</span>
        </div>
      </div>

      <div className={styles.controls}>
        <label className={styles.search}>
          <Search size={18} aria-hidden="true" />
          <span className={styles.srOnly}>Search products</span>
          <input
            type="search"
            placeholder="Search products"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className={styles.filter} role="group" aria-label="Availability filter">
          <button type="button" aria-pressed={filter === "all"}
            className={filter === "all" ? styles.filterActive : ""}
            onClick={() => setFilter("all")}>All</button>
          <button type="button" aria-pressed={filter === "available"}
            className={filter === "available" ? styles.filterActive : ""}
            onClick={() => setFilter("available")}>In stock</button>
        </div>
      </div>

      {products.length ? (
        <div className={styles.grid}>
          {products.map((product: ShopProduct) => (
            <article className={styles.card} key={product.id}>
              <div className={styles.cardTop}>
                <div className={styles.cardIcon}><Package size={25} aria-hidden="true" /></div>
                <span className={product.available ? styles.stockAvailable : styles.stockUnavailable}>
                  {product.available ? "In stock" : "Unavailable"}
                </span>
              </div>
              <div className={styles.cardBody}>
                <span className={styles.serviceId}>Service {product.id}</span>
                <h3>{product.name}</h3>
                <p>{product.available ? product.stock.toLocaleString("en-PH") + " units reported available" : "Currently not accepting orders"}</p>
              </div>
              <div className={styles.cardFooter}>
                <span>PHP retail pricing pending</span>
                <span className={styles.comingSoon}>Checkout coming soon</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptySmall}>
          <h3>No matching products</h3>
          <p>Try a different search or availability filter.</p>
          <button type="button" onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</button>
        </div>
      )}
    </section>
  );
}
