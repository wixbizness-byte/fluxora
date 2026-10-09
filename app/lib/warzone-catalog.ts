import "server-only";

const WARZONE_PRODUCTS_ENDPOINT = "https://api.warzoneshop.in/api/v1/products";

export type ShopProduct = {
  id: string;
  name: string;
  stock: number;
  available: boolean;
};

export type ShopCatalog = {
  status: "ready" | "awaiting_approval" | "not_configured" | "unavailable";
  products: ShopProduct[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function approvedProductIds(): Set<string> {
  return new Set(
    (process.env.FLUXORA_SHOP_APPROVED_IDS || "")
      .split(",")
      .map((part) => part.trim())
      .filter((id) => /^[A-Za-z0-9_-]{1,80}$/.test(id)),
  );
}

// This function is server-only. Never return the supplier key, wallet details,
// supplier prices, or activation links to a client component.
export async function loadShopCatalog(): Promise<ShopCatalog> {
  const approvedIds = approvedProductIds();
  if (approvedIds.size === 0) {
    return { status: "awaiting_approval", products: [] };
  }

  const key = process.env.WARZONE_API_KEY?.trim();
  if (!key) {
    return { status: "not_configured", products: [] };
  }

  try {
    const response = await fetch(WARZONE_PRODUCTS_ENDPOINT, {
      method: "GET",
      headers: {
        "X-API-Key": key,
        Accept: "application/json",
      },
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      // Don't expose provider errors or request/response headers publicly.
      return { status: "unavailable", products: [] };
    }

    const payload: unknown = await response.json();
    if (!isRecord(payload) || !Array.isArray(payload.services)) {
      return { status: "unavailable", products: [] };
    }

    const products: ShopProduct[] = payload.services
      .filter(isRecord)
      .filter((service) => typeof service.service_id === "string"
        && approvedIds.has(service.service_id)
        && typeof service.name === "string")
      .map((service) => {
        const stock = typeof service.stock === "number" && Number.isFinite(service.stock)
          ? Math.max(0, Math.floor(service.stock))
          : 0;

        return {
          id: service.service_id as string,
          name: (service.name as string).trim().slice(0, 180),
          stock,
          available: service.orderable === true
            && service.in_stock === true
            && stock > 0
            && typeof service.price === "number"
            && Number.isFinite(service.price),
        };
      })
      .filter((product) => product.name.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 300);

    return { status: "ready", products };
  } catch {
    return { status: "unavailable", products: [] };
  }
}
