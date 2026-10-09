import { NextRequest, NextResponse } from "next/server";
import { sandboxConfigured, verifiedMember, DEMO_AMOUNT_CENTAVOS } from "../../../lib/shop-demo-auth";
import { getDemoOrder, patchDemoOrder, publicDemoOrder } from "../../../lib/shop-demo-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function reply(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

// Manual, authenticated PayMongo-side reconciliation for a pending sandbox
// purchase. This never trusts the browser redirect as proof of payment.
export async function POST(request: NextRequest) {
  if (!sandboxConfigured()) return reply({ error: "Sandbox unavailable" }, 503);
  const buyer = await verifiedMember(request);
  if (!buyer) return reply({ error: "Please sign in" }, 401);

  let id: unknown;
  try {
    if (Number(request.headers.get("content-length") || "0") > 1500) {
      return reply({ error: "Invalid request" }, 413);
    }
    ({ id } = await request.json());
  } catch {
    return reply({ error: "Invalid request" }, 400);
  }
  if (typeof id !== "string" || !UUID.test(id)) {
    return reply({ error: "Invalid order" }, 400);
  }

  try {
    const order = await getDemoOrder(id);
    // Authorization precedes all provider lookups.
    if (!order || order.buyer_email !== buyer.email) return reply({ error: "Order not found" }, 404);
    if (order.status === "demo_delivered") return reply({ order: publicDemoOrder(order), verified: true });
    if (order.status !== "awaiting_payment" || !order.checkout_session_id ||
        order.amount_centavos !== DEMO_AMOUNT_CENTAVOS || order.currency !== "PHP") {
      return reply({ error: "Order not eligible for verification" }, 409);
    }

    const key = process.env.PAYMONGO_TEST_SECRET_KEY;
    if (!key?.startsWith("sk_test_")) return reply({ error: "Test provider unavailable" }, 503);
    const checkoutId = order.checkout_session_id;
    if (!/^cs_[A-Za-z0-9_-]{4,100}$/.test(checkoutId)) return reply({ error: "Invalid checkout" }, 400);

    const provider = await fetch("https://api.paymongo.com/v1/checkout_sessions/" + encodeURIComponent(checkoutId), {
      method: "GET",
      headers: {
        Authorization: "Basic " + Buffer.from(key + ":").toString("base64"),
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!provider.ok) {
      console.warn("Sandbox checkout reconciliation request failed", provider.status);
      return reply({ error: "Payment verification temporarily unavailable" }, 503);
    }

    const result = await provider.json();
    const session = result?.data;
    const attrs = session?.attributes;
    if (session?.id !== checkoutId || session?.type !== "checkout_session" ||
        attrs?.livemode !== false || attrs?.reference_number !== order.id ||
        attrs?.metadata?.fulfillment !== "demo_only") {
      return reply({ error: "Payment verification mismatch" }, 409);
    }

    const payments: unknown[] = Array.isArray(attrs?.payments) ? attrs.payments : [];
    const payment = payments.find((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const item = entry as { id?: unknown; attributes?: Record<string, unknown> };
      return typeof item.id === "string" && /^pay_[A-Za-z0-9_-]+$/.test(item.id) &&
        item.attributes?.status === "paid" &&
        item.attributes?.currency === "PHP" &&
        item.attributes?.amount === DEMO_AMOUNT_CENTAVOS;
    }) as { id: string } | undefined;

    if (!payment) return reply({ verified: false, pending: true });

    const updated = await patchDemoOrder(order.id, {
      status: "demo_delivered",
      payment_id: payment.id,
      paid_at: new Date().toISOString(),
      demo_activation_link: "https://example.com/fluxora-demo-only/" + encodeURIComponent(order.id),
    }, "&status=eq.awaiting_payment&checkout_session_id=eq." + encodeURIComponent(checkoutId));

    const delivered = updated[0] || await getDemoOrder(order.id);
    if (!delivered || delivered.status !== "demo_delivered") {
      return reply({ error: "Delivery update not confirmed" }, 503);
    }
    return reply({ verified: true, order: publicDemoOrder(delivered) });
  } catch {
    return reply({ error: "Payment verification temporarily unavailable" }, 503);
  }
}
