import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sandboxConfigured, DEMO_AMOUNT_CENTAVOS } from "../../../lib/shop-demo-auth";
import { getDemoOrder, patchDemoOrder } from "../../../lib/shop-demo-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifySignature(raw: string, header: string | null) {
  const secret = process.env.PAYMONGO_TEST_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const params = Object.fromEntries(header.split(",").map((item) => {
    const index = item.indexOf("=");
    return [item.slice(0, index).trim(), item.slice(index + 1).trim()];
  }));
  const timestamp = params.t;
  const provided = params.te;
  if (!/^\d{10,13}$/.test(timestamp || "") || !/^[a-f\d]{64}$/i.test(provided || "")) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts * 1000) > 600_000) return false;

  const expected = createHmac("sha256", secret).update(timestamp + "." + raw).digest();
  const received = Buffer.from(provided, "hex");
  return received.length === expected.length && timingSafeEqual(expected, received);
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: NextRequest) {
  if (!sandboxConfigured()) return new Response("Not configured", { status: 503 });
  let raw: string;
  try {
    raw = await request.text();
    if (raw.length > 128000) return new Response("Payload too large", { status: 413 });
  } catch {
    return new Response("Bad payload", { status: 400 });
  }
  if (!verifySignature(raw, request.headers.get("paymongo-signature"))) {
    return new Response("Signature invalid", { status: 401 });
  }

  try {
    const body = JSON.parse(raw);
    const event = body?.data;
    if (event?.type !== "checkout_session.payment.paid") {
      return NextResponse.json({ received: true });
    }
    if (event?.livemode !== false) {
      return new Response("Live payments are not processed here", { status: 400 });
    }

    const session = event.data;
    const sessionId = session?.id;
    const ref = session?.attributes?.reference_number;
    const payments = session?.attributes?.payments;
    if (!validUuid(ref) || typeof sessionId !== "string" || !Array.isArray(payments)) {
      return new Response("Invalid session details", { status: 400 });
    }
    const paid = payments.find((entry: any) =>
      typeof entry?.id === "string" && entry.attributes?.status === "paid" &&
      entry.attributes?.currency === "PHP" && entry.attributes?.amount === DEMO_AMOUNT_CENTAVOS);
    if (!paid) return new Response("No matching paid payment", { status: 400 });

    const order = await getDemoOrder(ref);
    if (!order || order.checkout_session_id !== sessionId || order.amount_centavos !== DEMO_AMOUNT_CENTAVOS) {
      return new Response("Order mismatch", { status: 400 });
    }

    if (order.status === "demo_delivered") return NextResponse.json({ received: true });

    const updated = await patchDemoOrder(order.id, {
      status: "demo_delivered",
      payment_id: paid.id,
      paid_at: new Date().toISOString(),
      demo_activation_link: "https://example.com/fluxora-demo-only/" + encodeURIComponent(order.id),
    }, "&status=eq.awaiting_payment&checkout_session_id=eq." + encodeURIComponent(sessionId));
    if (!updated.length) return new Response("Order was not ready for delivery", { status: 409 });
    return NextResponse.json({ received: true });
  } catch {
    // A non-2xx response asks PayMongo to retry transient failures.
    return new Response("Webhook processing failed", { status: 500 });
  }
}
