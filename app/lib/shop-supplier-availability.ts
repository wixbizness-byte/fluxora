import "server-only";
import { shopDb } from "./shop-server";

export type SupplierPricePolicy = {
  product_id: string;
  supplier_service_id: string;
  max_supplier_price: number | null;
};

export type SupplierAvailability = "available" | "unavailable";

type SupplierProduct = {
  service_id?: unknown;
  name?: unknown;
  price?: unknown;
  pricing?: unknown;
  price_tiers?: unknown;
  stock?: unknown;
  in_stock?: unknown;
  orderable?: unknown;
};

const SUPPLIER_PRODUCTS_URL = "https://api.warzoneshop.in/api/v1/products";

/** Server-only, fail-closed supplier check. Never send costs or supplier identity to customers. */
export async function fetchSupplierProducts(): Promise<SupplierProduct[] | null> {
  const key = process.env.WARZONE_API_KEY;
  if (!key) return null;
  try {
    const response = await fetch(SUPPLIER_PRODUCTS_URL, {
      method: "GET",
      headers: { "X-API-Key": key, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) return null;
    const json: unknown = await response.json();
    if (!json || typeof json !== "object" || Array.isArray(json)) return null;
    const services = (json as {services?:unknown}).services;
    return Array.isArray(services) ? services as SupplierProduct[] : null;
  } catch {
    return null;
  }
}

function currentUnitCost(product: SupplierProduct): number | null {
  const price = product.price;
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) return null;
  if (product.pricing !== "tiered") return price;

  // Quantity is exactly 1. Treat missing or malformed tier data as unavailable.
  if (!Array.isArray(product.price_tiers)) return null;
  const tier = product.price_tiers.find((t: unknown) => {
    if (!t || typeof t !== "object") return false;
    const row = t as {min_qty?:unknown;max_qty?:unknown};
    return typeof row.min_qty === "number" && row.min_qty <= 1 &&
      typeof row.max_qty === "number" && row.max_qty >= 1;
  }) as {unit_price?:unknown}|undefined;
  if (!tier || typeof tier.unit_price !== "number" ||
      !Number.isFinite(tier.unit_price) || tier.unit_price <= 0) return null;

  // Compare against the larger of advertised price and quantity-one tier price.
  return Math.max(price, tier.unit_price);
}

export function assessSupplierAvailability(
  products: SupplierProduct[] | null,
  policy: SupplierPricePolicy | null | undefined
): SupplierAvailability {
  // An unset ceiling or an API failure ALWAYS blocks payment and fulfillment.
  if (!policy || !policy.supplier_service_id ||
      typeof policy.max_supplier_price !== "number" ||
      !Number.isFinite(policy.max_supplier_price) || policy.max_supplier_price <= 0 ||
      !products) return "unavailable";

  const item = products.find(p => p && p.service_id === policy.supplier_service_id);
  if (!item || item.in_stock !== true || item.orderable !== true ||
      typeof item.stock !== "number" || !Number.isFinite(item.stock) || item.stock < 1) {
    return "unavailable";
  }
  // Protect against unexpected ID reuse for the currently linked product.
  if (policy.supplier_service_id === "S_01" &&
      item.name !== "Gemini New 7 Days Expiry Links" &&
      item.name !== "Gemini AI Pro 18Months - 15hour Hold warranty") {
    return "unavailable";
  }

  const cost = currentUnitCost(item);
  return cost !== null && cost <= policy.max_supplier_price ? "available" : "unavailable";
}

export async function privateProductPolicy(productId: string) {
  const rows = await shopDb<SupplierPricePolicy>("shop_private_products",
    "?select=product_id,supplier_service_id,max_supplier_price&product_id=eq." +
    encodeURIComponent(productId) + "&limit=1");
  return rows[0] || null;
}

export async function availableForPurchase(productId: string): Promise<boolean> {
  try {
    const [policy, products] = await Promise.all([
      privateProductPolicy(productId), fetchSupplierProducts(),
    ]);
    return assessSupplierAvailability(products, policy) === "available";
  } catch {
    return false;
  }
}

/** Published list: emit only unavailable card IDs, never any raw wholesale data. */
export async function unavailablePublishedCardIds(
  cards: Array<{id:string;checkout_enabled:boolean}>
): Promise<string[]> {
  const candidates = cards.filter(card => card.checkout_enabled);
  if (!candidates.length) return [];
  if (process.env.SHOP_LIVE_SALES_ENABLED !== "true") return candidates.map(c=>c.id);
  try {
    const [policies, products] = await Promise.all([
      shopDb<SupplierPricePolicy>("shop_private_products",
        "?select=product_id,supplier_service_id,max_supplier_price&product_id=in.(" +
        candidates.map(c=>c.id).join(",") + ")"),
      fetchSupplierProducts(),
    ]);
    const policyById = new Map(policies.map(row => [row.product_id,row]));
    return candidates.filter(c =>
      assessSupplierAvailability(products,policyById.get(c.id)) !== "available"
    ).map(c=>c.id);
  } catch {
    return candidates.map(c=>c.id);
  }
}
