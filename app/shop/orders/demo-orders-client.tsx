"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, Copy, LockKeyhole, RefreshCcw } from "lucide-react";

type Order = {
  id: string;
  product_title: string;
  amount_centavos: number;
  currency: string;
  status: "awaiting_checkout" | "awaiting_payment" | "checkout_failed" | "demo_delivered";
  demo_activation_link: string | null;
  created_at: string;
  paid_at: string | null;
};

function statusLabel(status: Order["status"]) {
  if (status === "demo_delivered") return "Demo delivered";
  if (status === "awaiting_payment") return "Waiting for test payment";
  if (status === "checkout_failed") return "Checkout not started";
  return "Preparing checkout";
}

export default function DemoOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "signed_out" | "error">("loading");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<Record<string, string>>({});
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [pollingError, setPollingError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const activeRefresh = useRef(false);
  const refreshOrdersRef = useRef<() => Promise<void>>(async () => {});


  useEffect(() => {
    setSelectedId(new URLSearchParams(window.location.search).get("order"));
    let mounted = true;

    const refresh = async () => {
      // Avoid overlapping checks on slow connections; browsers throttle hidden-tab timers.
      if (activeRefresh.current) return;
      activeRefresh.current = true;
      if (mounted) setRefreshing(true);
      try {
        const result = await fetch("/api/shop/orders", {
          credentials: "include",
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!mounted) return;
        if (result.status === 401) {
          setState("signed_out");
          setPollingError(false);
          return;
        }
        if (!result.ok) throw new Error("Unable to load demo orders");
        const data = await result.json();
        if (!mounted) return;
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setState("ready");
        setPollingError(false);
        setLastCheckedAt(new Date());
      } catch {
        if (mounted) {
          setPollingError(true);
          setState((current) => current === "ready" ? "ready" : "error");
        }
      } finally {
        activeRefresh.current = false;
        if (mounted) setRefreshing(false);
      }
    };

    refreshOrdersRef.current = refresh;
    void refresh();

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);
    const interval = window.setInterval(refreshIfVisible, 10000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, []);

  async function verifyPayment(id: string) {
    if (checking) return;
    setChecking(id);
    setVerifyMessage((current) => ({ ...current, [id]: "" }));
    try {
      const result = await fetch("/api/shop/reconcile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        cache: "no-store",
      });
      const data = await result.json();
      if (result.status === 401) {
        setState("signed_out");
        return;
      }
      if (!result.ok) throw new Error(data.error || "Payment verification unavailable.");
      if (data.verified && data.order?.status === "demo_delivered") {
        setOrders((current) => current.map((order) => order.id === id ? data.order : order));
        setVerifyMessage((current) => ({ ...current, [id]: "Payment verified by PayMongo." }));
      } else {
        setVerifyMessage((current) => ({
          ...current, [id]: "PayMongo has not confirmed a paid test transaction for this order.",
        }));
      }
    } catch (error) {
      setVerifyMessage((current) => ({
        ...current, [id]: error instanceof Error ? error.message : "Verification failed.",
      }));
    } finally {
      setChecking(null);
    }
  }

  async function copyLink(id: string, link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(id);
    } catch {
      setCopied(null);
    }
  }

  if (state === "loading") return <p role="status">Checking your Fluxora account and demo orders...</p>;
  if (state === "signed_out") return (
    <div style={{ padding: 28, border: "1px solid #494134", borderRadius: 14 }}>
      <LockKeyhole size={25} color="#e2bf7a" />
      <h2>Sign in to view your purchases</h2>
      <p style={{ color: "#b1b1b0" }}>Your orders and delivery links are private to your Fluxora Google account.</p>
      <a href="/api/shop/auth/start"
        style={{ color: "#e6bc6b", textDecoration: "underline" }}>Continue with Google</a>
    </div>
  );
  if (state === "error") return <p role="alert">Unable to load your demo orders right now. Please try again later.</p>;

  const shown = selectedId
    ? [...orders].sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId))
    : orders;

  if (shown.length === 0) return (
    <div style={{ padding: 28, border: "1px solid #494134", borderRadius: 14 }}>
      <h2>No demo orders yet</h2>
      <p style={{ color: "#b1b1b0" }}>Start a test transaction to preview activation-link delivery.</p>
      <a style={{ color: "#e2bc6b", textDecoration: "underline" }} href="/shop/demo">Try sandbox checkout</a>
    </div>
  );

  return <div style={{ display: "grid", gap: 18 }}>
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
      <p role="status" aria-live="polite" style={{ color: "#a5a4a2", fontSize: 13, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <RefreshCcw size={15} /> Status checks every 10 seconds while this tab is visible.
        {lastCheckedAt ? " Last checked at " + lastCheckedAt.toLocaleTimeString("en-PH") + "." : ""}
      </p>
      <button type="button" disabled={refreshing} onClick={() => void refreshOrdersRef.current()}
        style={{ color: "#e3be75", border: "1px solid #716344", borderRadius: 8, padding: "7px 10px", background: "transparent", cursor: refreshing ? "wait" : "pointer" }}>
        {refreshing ? "Checking..." : "Refresh status"}
      </button>
      {pollingError ? <p role="alert" style={{ fontSize: 12, color: "#f0a4a4", margin: 0 }}>
        Last update failed. Tap Refresh status to retry.
      </p> : null}
    </div>
    {shown.map((order) => (
      <article key={order.id} style={{
        background: "#17191b", border: "1px solid " + (order.id === selectedId ? "#a1844d" : "#3d3a35"),
        borderRadius: 16, padding: 24,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: "0.12em", color: "#dbb778", textTransform: "uppercase", margin: 0 }}>Test-only order</p>
            <h2 style={{ fontSize: 20, fontWeight: 650, margin: "10px 0" }}>{order.product_title}</h2>
            <p style={{ fontSize: 12, color: "#a9a7a3", margin: 0 }}>
              {new Date(order.created_at).toLocaleString("en-PH")}
            </p>
          </div>
          <span style={{ color: order.status === "demo_delivered" ? "#97d2a6" : "#e3ba76", display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
            {order.status === "demo_delivered" ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}
            {statusLabel(order.status)}
          </span>
        </div>
        <p style={{ fontSize: 11, color: "#818181", wordBreak: "break-all" }}>Order {order.id}</p>
        {order.demo_activation_link ? (
          <div style={{ border: "1px solid #454034", borderRadius: 10, padding: 16, marginTop: 18, background: "#20211f" }}>
            <strong style={{ color: "#e4bc6c", fontSize: 13 }}>Example delivery link (INVALID)</strong>
            <p style={{ fontSize: 12, wordBreak: "break-all", color: "#ddd3bd" }}>{order.demo_activation_link}</p>
            <button type="button" onClick={() => copyLink(order.id, order.demo_activation_link!)}
              style={{ border: "1px solid #a18a61", background: "transparent", borderRadius: 8, padding: "9px 13px", color: "#e3be75", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}>
              <Copy size={14} /> {copied === order.id ? "Copied" : "Copy demo link"}
            </button>
            <p style={{ fontSize: 11, color: "#ac9d8a", lineHeight: 1.7 }}>
              This example.com link does not activate Google AI Pro or any real subscription.
            </p>
          </div>
        ) : <div style={{ marginTop: 20 }}>
          <p style={{ color: "#aaa7a3", fontSize: 13 }}>
            A fake activation link will appear only after PayMongo confirms a successful test payment.
          </p>
          {order.status === "awaiting_payment" ? (
            <button type="button" disabled={checking !== null} onClick={() => void verifyPayment(order.id)}
              style={{
                marginTop: 12, padding: "10px 16px", borderRadius: 8, cursor: checking ? "wait" : "pointer",
                border: "1px solid #b6975b", background: "transparent", color: "#e5bd79", fontWeight: 600,
              }}>
              {checking === order.id ? "Checking PayMongo..." : "Verify test payment"}
            </button>
          ) : null}
          {verifyMessage[order.id] ? (
            <p role="status" style={{ fontSize: 12, color: "#d9c8a8", marginTop: 12 }}>
              {verifyMessage[order.id]}
            </p>
          ) : null}
        </div>}
      </article>
    ))}
  </div>;
}
