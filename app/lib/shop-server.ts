import "server-only";
import { createHash } from "node:crypto";

export type ShopOrder = {
  id: string;
  product_id: string;
  buyer_token_hash: string;
  product_title: string;
  terms_snapshot: string;
  delivery_instructions_snapshot: string;
  price_centavos: number;
  currency: "PHP";
  status: "created" | "awaiting_payment" | "checkout_failed" | "paid" | "fulfilling" | "delivered" | "needs_review" | "test_paid";
  paymongo_session_id: string | null;
  paymongo_payment_id: string | null;
  supplier_order_id: string | null;
  activation_link: string | null;
  created_at: string;
  paid_at: string | null;
};

export const SHOP_BUYER_COOKIE = "__Host-fluxora-shop-buyer";

export function hashBuyer(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function shopPaymentMode(): "test" | "live" | "off" {
  // Test transactions can never purchase from a supplier.
  if (process.env.SHOP_PAYMENT_MODE === "test" &&
      process.env.PAYMONGO_TEST_SECRET_KEY?.startsWith("sk_test_") &&
      process.env.PAYMONGO_TEST_WEBHOOK_SECRET &&
      process.env.SUPABASE_SERVICE_ROLE_KEY) return "test";
  if (shopLiveReady()) return "live";
  return "off";
}

export function shopLiveReady(): boolean {
  return process.env.SHOP_LIVE_SALES_ENABLED === "true" &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    Boolean(process.env.WARZONE_API_KEY) &&
    Boolean(process.env.PAYMONGO_LIVE_WEBHOOK_SECRET) &&
    Boolean(process.env.PAYMONGO_LIVE_SECRET_KEY?.startsWith("sk_live_"));
}

type Row = Record<string, unknown>;

export async function shopDb<T>(
  table: string, query: string, method: "GET" | "POST" | "PATCH" = "GET",
  body?: Row,
): Promise<T[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const validTable = ["shop_catalog_cards","shop_private_products","shop_customer_orders"].includes(table);
  if (!base || !key || !validTable) throw new Error("Shop data unavailable");
  const response = await fetch(base + "/rest/v1/" + table + query, {
    method,
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Shop data request failed: " + response.status);
  return (await response.json()) as T[];
}

export async function findBuyerOrder(id: string, token: string): Promise<ShopOrder | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f]{64}$/.test(token)) return null;
  const rows = await shopDb<ShopOrder>("shop_customer_orders",
    "?id=eq." + encodeURIComponent(id) +
    "&buyer_token_hash=eq." + hashBuyer(token) + "&limit=1");
  return rows[0] || null;
}

export async function getServerOrder(id: string): Promise<ShopOrder | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await shopDb<ShopOrder>("shop_customer_orders","?id=eq." + encodeURIComponent(id) + "&limit=1");
  return rows[0] || null;
}

export async function patchServerOrder(
  id: string, values: Row, currentStatus?: ShopOrder["status"],
): Promise<ShopOrder | null> {
  const filter = "?id=eq." + encodeURIComponent(id) +
    (currentStatus ? "&status=eq." + encodeURIComponent(currentStatus) : "");
  const rows = await shopDb<ShopOrder>("shop_customer_orders", filter, "PATCH", {
    ...values, updated_at: new Date().toISOString(),
  });
  return rows[0] || null;
}

export function publicBuyerOrder(order: ShopOrder) {
  return {
    id: order.id,
    product_title: order.product_title,
    price_centavos: order.price_centavos,
    currency: order.currency,
    status: order.status,
    activation_link: order.status === "delivered" ? order.activation_link : null,
    instructions: order.status === "delivered" ? order.delivery_instructions_snapshot : null,
    created_at: order.created_at,
    paid_at: order.paid_at,
  };
}
