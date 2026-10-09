"use client";

import { useState } from "react";
import { ArrowUpRight, CreditCard } from "lucide-react";

export default function DemoCheckoutClient({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loginRequired, setLoginRequired] = useState(false);

  async function start() {
    setBusy(true);
    setError("");
    setLoginRequired(false);
    try {
      const response = await fetch("/api/shop/checkout", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });
      const body = await response.json();
      if (response.status === 401) setLoginRequired(true);
      if (!response.ok) throw new Error(body.error || "Sandbox checkout unavailable.");
      if (typeof body.checkout_url !== "string") throw new Error("Unexpected checkout response");
      window.location.assign(body.checkout_url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to open test checkout.");
      setBusy(false);
    }
  }

  return (
    <div style={{
      padding: 26, borderRadius: 16, border: "1px solid rgba(220,181,107,.25)",
      background: "#17191b", maxWidth: 520,
    }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#dfbc76", fontSize: 12, fontWeight: 700 }}>
        <CreditCard size={18} /> PayMongo sandbox — no real charge
      </div>
      <h2 style={{ margin: "17px 0 10px", fontSize: 27, fontWeight: 650 }}>₱100.00 <small style={{ color: "#bab6ae", fontSize: 13, fontWeight: 400 }}>test transaction</small></h2>
      <p style={{ color: "#b9b7b3", fontSize: 13, lineHeight: 1.7 }}>
        Demo Google AI Pro 18-months listing. The delivery link is a fake example.com URL
        and cannot activate any subscription.
      </p>
      <button type="button" onClick={start} disabled={!enabled || busy}
        style={{
          width: "100%", minHeight: 47, display: "flex", alignItems: "center", justifyContent: "center",
          gap: 12, cursor: enabled && !busy ? "pointer" : "not-allowed",
          border: 0, borderRadius: 9, background: enabled ? "#dfb665" : "#55524a",
          color: "#15120e", fontWeight: 750, marginTop: 24,
        }}>
        {busy ? "Opening sandbox..." : enabled ? "Pay with PayMongo (test)" : "Sandbox setup pending"}
        {!busy && enabled ? <ArrowUpRight size={17} /> : null}
      </button>
      <a style={{ display: "block", marginTop: 18, fontSize: 13, color: "#dfbc76" }} href="/shop/orders">
        View my demo orders
      </a>
      {error && <p role="alert" style={{ color: "#f0a4a4", fontSize: 13, marginTop: 15 }}>
        {error}
        {loginRequired ? <> <a href="/api/shop/auth/start"
          style={{ textDecoration: "underline" }}>Sign in with Google</a></> : null}
      </p>}
    </div>
  );
}
