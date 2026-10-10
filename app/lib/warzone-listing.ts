import "server-only";

const ENDPOINT = "https://api.warzoneshop.in/api/v1/products";

export type WarzoneListing = {
  status: "listed" | "paused" | "not_found" | "unavailable";
  name?: string;
  available?: boolean;
};

// Read-only lookup. Never returns supplier prices, credentials or delivery URLs,
// and never calls the POST /order endpoint that spends wallet funds.
export async function checkWarzoneListing(serviceId: string): Promise<WarzoneListing> {
  if (!/^S_[0-9A-Za-z_-]{1,24}$/.test(serviceId)) return { status: "not_found" };
  const secret = process.env.WARZONE_API_KEY;
  if (!secret) return { status: "unavailable" };

  try {
    const response = await fetch(ENDPOINT, {
      method: "GET",
      headers: { "X-API-Key": secret, Accept: "application/json" },
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) return { status: "unavailable" };
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return { status: "unavailable" };
    const services = (payload as Record<string, unknown>).services;
    if (!Array.isArray(services)) return { status: "unavailable" };
    const match = services.find((item: unknown) =>
      item !== null && typeof item === "object" &&
      (item as Record<string, unknown>).service_id === serviceId);
    if (!match) return { status: "not_found" };

    const supplier = match as Record<string, unknown>;
    const name = typeof supplier.name === "string" ? supplier.name.trim().slice(0, 140) : "";
    // Prevent accidental conflation if the supplier recycles a service ID.
    if (!/\b(?:gemini|google)\b/i.test(name) || !/\bpro\b/i.test(name) ||
        !/\b18\s*months?\b/i.test(name)) return { status: "not_found" };

    const orderable = supplier.orderable === true &&
      supplier.in_stock === true &&
      typeof supplier.stock === "number" && supplier.stock > 0 &&
      typeof supplier.price === "number" && Number.isFinite(supplier.price);

    return { status: orderable ? "listed" : "paused", name, available: orderable };
  } catch {
    return { status: "unavailable" };
  }
}
