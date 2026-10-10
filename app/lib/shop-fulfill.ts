import "server-only";
import { getServerOrder, patchServerOrder, shopDb } from "./shop-server";

type SupplierReply = {
  success?: unknown;
  order_id?: unknown;
  service_id?: unknown;
  products?: unknown;
};

export async function fulfillPaidOrder(orderId: string): Promise<"delivered" | "pending" | "review"> {
  // A compare-and-swap claim prevents webhook replay from buying twice.
  const claimed = await patchServerOrder(orderId, { status: "fulfilling" }, "paid");
  if (!claimed) {
    const order = await getServerOrder(orderId);
    return order?.status === "delivered" ? "delivered" : "pending";
  }

  // This state must NOT be automatically retried after ambiguous network errors.
  // POST /order may debit the wallet even if its HTTP response is lost.
  try {
    const privateRows = await shopDb<{supplier_service_id:string}>(
      "shop_private_products", "?select=supplier_service_id&product_id=eq." +
      encodeURIComponent(claimed.product_id) + "&limit=1");
    const serviceId = privateRows[0]?.supplier_service_id;
    if (!serviceId || !/^S_[A-Za-z0-9_-]{1,50}$/.test(serviceId)) {
      await patchServerOrder(orderId,{status:"needs_review"},"fulfilling");
      return "review";
    }
    const key = process.env.WARZONE_API_KEY;
    if (!key) throw new Error("Private fulfillment unavailable");

    const response = await fetch("https://api.warzoneshop.in/api/v1/order", {
      method: "POST",
      headers: { "X-API-Key": key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ service_id: serviceId, quantity: 1 }),
      cache: "no-store", signal: AbortSignal.timeout(14000),
    });
    if (!response.ok) throw new Error("Private fulfillment provider did not confirm order");
    const result: SupplierReply = await response.json();
    if (result.success !== true || typeof result.order_id !== "string" ||
        result.service_id !== serviceId || !Array.isArray(result.products) ||
        result.products.length !== 1 || typeof result.products[0] !== "string") {
      throw new Error("Private fulfillment response missing delivery");
    }

    const activation = new URL(result.products[0]);
    if (activation.protocol !== "https:" || activation.username || activation.password ||
        activation.toString().length > 3000) throw new Error("Invalid activation URL");

    const saved = await patchServerOrder(orderId, {
      status: "delivered",
      supplier_order_id: result.order_id,
      activation_link: activation.toString(),
      delivered_at: new Date().toISOString(),
    }, "fulfilling");
    if (!saved) return "review";
    return "delivered";
  } catch {
    // No blind second purchase: manual review / supplier order history needed.
    try { await patchServerOrder(orderId,{status:"needs_review"},"fulfilling"); } catch {}
    return "review";
  }
}
