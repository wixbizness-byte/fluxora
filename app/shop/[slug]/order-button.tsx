"use client";

import { useState } from "react";

export default function OrderButton({ slug, enabled }: { slug: string; enabled: boolean }) {
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");

  async function order() {
    if (!enabled || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/shop/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
        cache: "no-store",
      });
      const data = await response.json() as { checkout_url?: string; error?: string };
      if (!response.ok) throw new Error(data.error || "Checkout is unavailable.");
      if (!data.checkout_url) throw new Error("Checkout is unavailable.");
      const url = new URL(data.checkout_url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.paymongo.com") {
        throw new Error("Invalid payment destination.");
      }
      window.location.assign(url.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
      setLoading(false);
    }
  }

  return <div style={{ marginTop: 24 }}>
    <button type="button" onClick={() => void order()} disabled={!enabled || loading}
      style={{
        background: enabled ? "#b5a3ff" : "#313746",
        color: enabled ? "#171328" : "#aaaebd",
        padding: "14px 25px", border: 0, borderRadius: 10, fontWeight: 800,
        fontSize: 15, cursor: enabled ? "pointer" : "not-allowed",
        fontFamily: "var(--font-inter), Inter, sans-serif"
      }}>
      {loading ? "Opening PayMongo..." : "Order"}
    </button>
    {!enabled ? <p style={{color:"#aeb5c5",fontSize:13,marginTop:12}}>Ordering is not yet available.</p> : null}
    {error ? <p role="alert" style={{color:"#fab3be",fontSize:13,marginTop:12}}>{error}</p> : null}
  </div>;
}
