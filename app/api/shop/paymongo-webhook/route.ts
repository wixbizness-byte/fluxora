import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { shopLiveReady, getServerOrder, patchServerOrder } from "../../../lib/shop-server";
import { fulfillPaidOrder } from "../../../lib/shop-fulfill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validSignature(raw: string, header: string | null): boolean {
  const secret = process.env.PAYMONGO_LIVE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const pairs = Object.fromEntries(header.split(",").map(item => {
    const i = item.indexOf("=");
    return [item.slice(0,i).trim(), item.slice(i+1).trim()];
  }));
  const timestamp = pairs.t;
  const signature = pairs.li; // PayMongo's live-mode signature (not te).
  if (!/^\d{10,13}$/.test(timestamp||"") || !/^[0-9a-f]{64}$/i.test(signature||"")) return false;
  if (Math.abs(Date.now() - Number(timestamp) * 1000) > 600_000) return false;
  const expected = createHmac("sha256",secret).update(timestamp+"."+raw).digest();
  const received = Buffer.from(signature,"hex");
  return received.length===expected.length && timingSafeEqual(expected,received);
}

export async function POST(request: NextRequest) {
  if (!shopLiveReady()) return new Response("Not configured",{status:503});
  let raw: string;
  try {
    raw = await request.text();
    if (raw.length > 128000) return new Response("Payload too large",{status:413});
  } catch { return new Response("Invalid request",{status:400}); }

  if (!validSignature(raw,request.headers.get("paymongo-signature"))) {
    return new Response("Invalid signature",{status:401});
  }

  try {
    const envelope = JSON.parse(raw);
    const event = envelope?.data?.attributes;
    if (event?.type !== "checkout_session.payment.paid") {
      return NextResponse.json({ received: true });
    }
    if (event.livemode !== true) return new Response("Invalid payment mode",{status:400});

    const checkout = event.data;
    const id = checkout?.attributes?.reference_number;
    const sessionId = checkout?.id;
    if (typeof id!=="string" || !/^[0-9a-f-]{36}$/i.test(id) ||
        typeof sessionId!=="string" || !/^cs_[A-Za-z0-9_-]{4,100}$/.test(sessionId)) {
      return new Response("Invalid order reference",{status:400});
    }

    const order = await getServerOrder(id);
    if (!order || order.paymongo_session_id !== sessionId || order.currency!=="PHP") {
      return new Response("Payment reference mismatch",{status:409});
    }

    const entries = checkout?.attributes?.payments;
    if (!Array.isArray(entries)) return new Response("Missing payments",{status:400});
    const paid = entries.find((p: any) => typeof p?.id==="string" &&
      p.attributes?.status==="paid" && p.attributes?.currency==="PHP" &&
      p.attributes?.amount===order.price_centavos);
    if (!paid) return new Response("Payment not verified",{status:409});

    if (order.status === "delivered" || order.status === "needs_review" ||
        order.status === "fulfilling" || order.status === "paid") {
      return NextResponse.json({ received: true });
    }
    if (order.status !== "awaiting_payment") return new Response("Order not ready",{status:409});
    const updated = await patchServerOrder(id, {
      status: "paid", paymongo_payment_id: paid.id, paid_at: new Date().toISOString(),
    }, "awaiting_payment");
    if (!updated) return NextResponse.json({ received: true });
    await fulfillPaidOrder(id);
    return NextResponse.json({ received: true });
  } catch {
    return new Response("Unable to verify payment",{status:500});
  }
}
