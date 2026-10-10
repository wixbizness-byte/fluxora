"use client";

import { useEffect, useState } from "react";

type OrderInfo = {
  id:string; product_title:string; price_centavos:number;
  status:string; activation_link:string|null; instructions:string|null;
};

export default function OrderResult() {
  const [order,setOrder] = useState<OrderInfo|null>(null);
  const [error,setError] = useState("");
  const [lastChecked,setLastChecked] = useState("");
  const id = typeof window === "undefined" ? "" :
    new URLSearchParams(window.location.search).get("order") || "";

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("order") || "";
    if (!/^[a-f\d-]{36}$/i.test(orderId)) {
      setError("Order reference is missing.");
      return;
    }
    let alive = true;
    let busy = false;
    async function refresh() {
      if (busy || document.visibilityState === "hidden") return;
      busy = true;
      try {
        const res = await fetch("/api/shop/orders?order=" + encodeURIComponent(orderId),{
          cache:"no-store",credentials:"same-origin"
        });
        const json = await res.json();
        if (!alive) return;
        if (!res.ok) throw new Error(json.error || "Order unavailable.");
        setOrder(json.order);
        setError("");
        setLastChecked(new Date().toLocaleTimeString("en-PH"));
      } catch (e) {
        if (alive) setError(e instanceof Error?e.message:"Unable to load order.");
      } finally { busy = false; }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(),10000);
    document.addEventListener("visibilitychange",refresh);
    window.addEventListener("focus",refresh);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange",refresh);
      window.removeEventListener("focus",refresh);
    };
  },[]);

  return <section style={{background:"#121722",border:"1px solid #354057",borderRadius:15,padding:24,maxWidth:740}}>
    {order ? (
      <>
        <h2 style={{fontSize:23,marginBottom:12}}>{order.product_title}</h2>
        <p style={{color:"#b6c1d0",marginBottom:22}}>
          {order.status==="test_paid"?"Test payment confirmed. No real charge or activation link was issued."
            : order.status==="delivered"?"Payment successful — your order is ready."
            : order.status==="needs_review"?"Payment is recorded. Your order is being reviewed."
            : order.status==="paid" || order.status==="fulfilling"?
              "Payment confirmed. Your order is being prepared."
            : order.status==="checkout_failed"?"Checkout did not complete."
            : "Waiting for payment confirmation."}
        </p>
        {order.status==="delivered" && order.activation_link ? (
          <div style={{overflowWrap:"anywhere"}}>
            <p style={{color:"#c6badf",fontWeight:800,marginBottom:10}}>Your activation link</p>
            <a href={order.activation_link} target="_blank" rel="noopener noreferrer"
              style={{color:"#d1c1ff",textDecoration:"underline"}}>{order.activation_link}</a>
            {order.instructions ? (
              <section style={{marginTop:30}}>
                <h3 style={{fontSize:17,marginBottom:12}}>How to use it</h3>
                <div style={{whiteSpace:"pre-wrap",lineHeight:1.8,color:"#d2d8e4"}}>{order.instructions}</div>
              </section>
            ) : null}
          </div>
        ) : null}
      </>
    ) : <p style={{color:"#b6c1d0"}}>Loading your order...</p>}
    {error ? <p role="alert" style={{color:"#fac1c7",marginTop:16}}>{error}</p> : null}
    {lastChecked ? <p style={{color:"#838ea1",fontSize:12,marginTop:24}}>Last checked: {lastChecked}. Updates automatically.</p> : null}
    {id ? <p style={{color:"#70798e",fontSize:11,marginTop:12}}>Order: {id}</p> : null}
  </section>;
}
