import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { hashBuyer, SHOP_BUYER_COOKIE, shopDb, shopLiveReady, patchServerOrder, type ShopOrder } from "../../../lib/shop-server";

import { availableForPurchase } from "../../../lib/shop-supplier-availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORIGIN = "https://www.fluxora.wiki";
const error = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  if (!shopLiveReady()) return error("Ordering is not yet available.", 503);
  if (request.headers.get("origin") !== ORIGIN) return error("Invalid request origin.", 403);

  let data: unknown;
  try {
    if (Number(request.headers.get("content-length") || "0") > 2048) return error("Invalid request.", 413);
    data = await request.json();
  } catch { return error("Invalid request.", 400); }

  const slug = data && typeof data === "object" && "slug" in data
    ? (data as {slug: unknown}).slug : null;
  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) {
    return error("Invalid product.", 400);
  }

  let orderId: string | null = null;
  try {
    const cards = await shopDb<{
      id:string; title:string; terms_text:string; price_centavos:number|null;
      checkout_enabled:boolean;is_published:boolean
    }>("shop_catalog_cards",
      "?select=id,title,terms_text,price_centavos,checkout_enabled,is_published" +
      "&slug=eq." + encodeURIComponent(slug) + "&limit=1");
    const product = cards[0];
    if (!product?.is_published || !product.checkout_enabled ||
        !product.price_centavos || !product.terms_text.trim()) return error("Ordering is not yet available.", 409);

    const privateProducts = await shopDb<{supplier_service_id:string;delivery_instructions:string}>(
      "shop_private_products", "?select=supplier_service_id,delivery_instructions&product_id=eq." +
      encodeURIComponent(product.id) + "&limit=1");
    const config = privateProducts[0];
    if (!config?.supplier_service_id || !config.delivery_instructions.trim()) {
      return error("Ordering is not yet available.", 409);
    }

    if (!(await availableForPurchase(product.id))) {
      return error("This product is currently unavailable.", 409);
    }

    const existing = request.cookies.get(SHOP_BUYER_COOKIE)?.value || "";
    const session = /^[0-9a-f]{64}$/.test(existing) ? existing : randomBytes(32).toString("hex");
    const created = await shopDb<ShopOrder>("shop_customer_orders", "", "POST", {
      buyer_token_hash: hashBuyer(session),
      product_id: product.id,
      product_title: product.title,
      price_centavos: product.price_centavos,
      terms_snapshot: product.terms_text,
      delivery_instructions_snapshot: config.delivery_instructions,
    });
    const order = created[0];
    if (!order) throw new Error("Order create failure");
    orderId = order.id;

    const credential = process.env.PAYMONGO_LIVE_SECRET_KEY!;
    const returnUrl = ORIGIN + "/shop/orders?order=" + encodeURIComponent(order.id);
    const upstream = await fetch("https://api.paymongo.com/v2/checkout_sessions", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(credential + ":").toString("base64"),
        Accept: "application/json", "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: { attributes: {
        line_items: [{ name: product.title, amount: product.price_centavos, currency: "PHP", quantity: 1 }],
        payment_method_types: ["card", "gcash", "paymaya"],
        success_url: returnUrl,
        cancel_url: ORIGIN + "/shop/" + encodeURIComponent(slug),
        reference_number: order.id,
        metadata: { order_id: order.id, fluxora_shop: "true" },
        send_email_receipt: false,
      } } }),
      cache: "no-store", signal: AbortSignal.timeout(12000),
    });
    if (!upstream.ok) throw new Error("Could not initiate payment");
    const paymongo: unknown = await upstream.json();
    const body = paymongo as {data?:{id?:unknown;attributes?:{checkout_url?:unknown}}};
    const checkoutSession = body.data?.id;
    const checkoutUrl = body.data?.attributes?.checkout_url;
    if (typeof checkoutSession !== "string" || !/^cs_[A-Za-z0-9_-]{4,100}$/.test(checkoutSession) ||
        typeof checkoutUrl !== "string") throw new Error("Invalid checkout response");
    const target = new URL(checkoutUrl);
    if (target.protocol !== "https:" || target.hostname !== "checkout.paymongo.com") {
      throw new Error("Invalid checkout destination");
    }
    const saved = await patchServerOrder(order.id,{
      status:"awaiting_payment", paymongo_session_id:checkoutSession,
    },"created");
    if (!saved) throw new Error("Unable to save checkout session");

    const response = NextResponse.json({ checkout_url: checkoutUrl }, {
      headers: { "Cache-Control": "private, no-store" },
    });
    response.cookies.set(SHOP_BUYER_COOKIE, session, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch {
    if (orderId) {
      try { await patchServerOrder(orderId,{status:"checkout_failed"},"created"); } catch {}
    }
    return error("Unable to start checkout. No order has been fulfilled.", 502);
  }
}
