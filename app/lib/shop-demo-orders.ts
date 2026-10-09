import "server-only";

export type DemoOrder = {
  id: string;
  buyer_email: string;
  product_title: string;
  amount_centavos: number;
  currency: string;
  status: "awaiting_checkout" | "awaiting_payment" | "checkout_failed" | "demo_delivered";
  checkout_session_id: string | null;
  payment_id: string | null;
  demo_activation_link: string | null;
  created_at: string;
  paid_at: string | null;
};

const FIELDS = "id,buyer_email,product_title,amount_centavos,currency,status,checkout_session_id,payment_id,demo_activation_link,created_at,paid_at";

async function db(path: string, method = "GET", body?: Record<string, unknown>): Promise<DemoOrder[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(new RegExp("/+$"), "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("Shop database not configured");
  const response = await fetch(base + "/rest/v1/shop_demo_orders" + path, {
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
  if (!response.ok) throw new Error("Shop database request failed");
  return await response.json() as DemoOrder[];
}

export async function createDemoOrder(email: string) {
  const result = await db("", "POST", { buyer_email: email });
  if (!result[0]) throw new Error("Could not create demo order");
  return result[0];
}

export async function getDemoOrder(id: string) {
  const result = await db("?select=" + FIELDS + "&id=eq." + encodeURIComponent(id) + "&limit=1");
  return result[0] || null;
}

export async function getOrdersForBuyer(email: string) {
  return await db("?select=" + FIELDS + "&buyer_email=eq." + encodeURIComponent(email) + "&order=created_at.desc&limit=40");
}

export async function patchDemoOrder(id: string, fields: Record<string, unknown>, conditions = "") {
  return await db("?select=" + FIELDS + "&id=eq." + encodeURIComponent(id) + conditions,
    "PATCH", { ...fields, updated_at: new Date().toISOString() });
}

export function publicDemoOrder(order: DemoOrder) {
  return {
    id: order.id,
    product_title: order.product_title,
    amount_centavos: order.amount_centavos,
    currency: order.currency,
    status: order.status,
    demo_activation_link: order.status === "demo_delivered" ? order.demo_activation_link : null,
    created_at: order.created_at,
    paid_at: order.paid_at,
  };
}
