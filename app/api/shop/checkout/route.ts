import { NextRequest, NextResponse } from "next/server";
import { createDemoOrder, patchDemoOrder } from "../../../lib/shop-demo-orders";
import { sandboxConfigured, testerAllowed, verifiedMember, DEMO_AMOUNT_CENTAVOS } from "../../../lib/shop-demo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failure(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!sandboxConfigured()) return failure("Sandbox checkout is not configured.", 503);
  const member = await verifiedMember(request);
  if (!member) return failure("Sign in with Fluxora to continue.", 401);
  if (!testerAllowed(member.role, member.email)) return failure("Test checkout is restricted to approved testers.", 403);

  let orderId: string | null = null;
  try {
    const order = await createDemoOrder(member.email);
    orderId = order.id;

    const host = process.env.VERCEL_URL;
    const origin = host ? "https://" + host : "http://localhost:3000";
    const redirect = origin + "/shop/orders?order=" + encodeURIComponent(order.id);
    const key = process.env.PAYMONGO_TEST_SECRET_KEY!;
    const upstream = await fetch("https://api.paymongo.com/v2/checkout_sessions", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(key + ":").toString("base64"),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [{
              name: "Fluxora demo digital activation (NOT A REAL SUBSCRIPTION)",
              amount: DEMO_AMOUNT_CENTAVOS,
              currency: "PHP",
              quantity: 1,
            }],
            payment_method_types: ["qrph"],
            success_url: redirect,
            cancel_url: redirect,
            reference_number: order.id,
            billing: { email: member.email },
            metadata: { fulfillment: "demo_only", order_id: order.id },
            send_email_receipt: false,
          },
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });

    if (!upstream.ok) throw new Error("PayMongo test checkout unavailable");
    const result = await upstream.json();
    const sessionId: unknown = result?.data?.id;
    const url: unknown = result?.data?.attributes?.checkout_url;
    if (typeof sessionId !== "string" || !/^cs_[A-Za-z0-9_-]{4,100}$/.test(sessionId) ||
        typeof url !== "string") throw new Error("Unexpected sandbox response");

    const checkoutUrl = new URL(url);
    if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.paymongo.com") {
      throw new Error("Unexpected checkout destination");
    }
    const updated = await patchDemoOrder(order.id,
      { status: "awaiting_payment", checkout_session_id: sessionId },
      "&status=eq.awaiting_checkout");
    if (!updated.length) throw new Error("Could not save checkout session");

    return NextResponse.json({ checkout_url: url, order_id: order.id },
      { headers: { "Cache-Control": "no-store" } });
  } catch {
    if (orderId) {
      try { await patchDemoOrder(orderId, { status: "checkout_failed" }, "&status=eq.awaiting_checkout"); } catch {}
    }
    return failure("Could not initiate PayMongo sandbox checkout. No real charge was made.", 502);
  }
}
