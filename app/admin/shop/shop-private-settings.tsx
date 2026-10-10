"use client";

import { useEffect, useState } from "react";
import { getSession, queryOne } from "../../lib/supabase";
import styles from "./shop-manager.module.css";

type PrivateSettings = {
  product_id: string;
  delivery_instructions: string;
  max_supplier_price: number | string | null;
};

export default function ShopPrivateSettings({
  productId, disabled = false,
}: { productId: string; disabled?: boolean }) {
  const [instructions, setInstructions] = useState("");
  const [ceiling, setCeiling] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await queryOne<PrivateSettings>(
          "shop_private_products",
          "select=product_id,delivery_instructions,max_supplier_price&product_id=eq." +
            encodeURIComponent(productId),
          true,
        );
        if (result.error) throw new Error(result.error.message);
        if (!active) return;
        if (!result.data) {
          setStatus("Private purchase settings have not been configured for this product.");
          return;
        }
        setConfigured(true);
        setInstructions(result.data.delivery_instructions || "");
        setCeiling(result.data.max_supplier_price == null
          ? "" : String(result.data.max_supplier_price));
      } catch (error) {
        if (active) setStatus(error instanceof Error ? error.message : "Could not load private settings.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [productId]);

  async function save() {
    if (!configured || disabled || loading || saving) return;
    const raw = ceiling.trim();
    const value = raw === "" ? null : Number(raw);
    if (raw !== "" && (value === null || !Number.isFinite(value) ||
        value <= 0 || value > 100000000)) {
      setStatus("Enter a valid positive supplier-cost limit, or leave it blank to keep orders unavailable.");
      return;
    }
    if (instructions.length > 10000) {
      setStatus("Delivery instructions must be 10,000 characters or fewer.");
      return;
    }

    setSaving(true);
    setStatus("");
    try {
      const session = await getSession();
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!session?.access_token || !base || !key) {
        throw new Error("Your admin session expired. Sign in again.");
      }
      const response = await fetch(
        base + "/rest/v1/shop_private_products?product_id=eq." +
          encodeURIComponent(productId) +
          "&select=product_id,delivery_instructions,max_supplier_price",
        {
          method: "PATCH",
          headers: {
            apikey: key,
            Authorization: "Bearer " + session.access_token,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            delivery_instructions: instructions,
            max_supplier_price: value,
            updated_at: new Date().toISOString(),
          }),
          cache: "no-store",
        },
      );
      if (!response.ok) throw new Error("Unable to save private settings. Check your admin access.");
      const rows: unknown = await response.json();
      if (!Array.isArray(rows) || rows.length !== 1) throw new Error("Private settings were not updated.");
      setStatus("Delivery instructions and supplier-cost limit saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save private settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.privateSettings} aria-label="Private purchase configuration">
      <div className={styles.privateSettingsTitle}>Private purchase settings</div>
      <p className={styles.privateSettingsNote}>
        Visible only in the admin panel. Instructions are displayed to the buyer after
        confirmed payment; the supplier-cost limit is never shown to buyers.
      </p>
      <label className={styles.label}>
        How to use the activation link (after purchase)
        <textarea
          className={styles.textarea}
          rows={7}
          maxLength={10000}
          value={instructions}
          disabled={disabled || loading || saving || !configured}
          placeholder="Write your own post-purchase instructions here"
          onChange={(event) => setInstructions(event.target.value)}
        />
      </label>
      <label className={styles.label}>
        Maximum supplier cost (USD)
        <input
          className={styles.field}
          type="number"
          min="0.000001"
          max="100000000"
          step="0.000001"
          value={ceiling}
          disabled={disabled || loading || saving || !configured}
          onChange={(event) => setCeiling(event.target.value)}
          placeholder="No limit configured — orders unavailable"
        />
      </label>
      <button
        type="button"
        className={styles.secondary}
        disabled={disabled || loading || saving || !configured}
        onClick={() => void save()}
      >
        {saving ? "Saving..." : "Save private settings"}
      </button>
      {status ? <p role="status" className={styles.privateSettingsNote}>{status}</p> : null}
      {loading ? <p className={styles.privateSettingsNote}>Loading private settings...</p> : null}
    </section>
  );
}
