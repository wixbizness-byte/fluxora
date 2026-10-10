import "server-only";

export type ShopCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  category_label: string;
  status_label: string;
  sort_order: number;
  terms_text: string;
  price_centavos: number | null;
  checkout_enabled: boolean;
};

export type PublishedShopCards = {
  cards: ShopCard[];
  status: "ready" | "unavailable";
};

const FIELDS = "id,slug,title,description,image_url,category_label,status_label,sort_order,terms_text,price_centavos,checkout_enabled";

async function fetchShopCards(query: string): Promise<ShopCard[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  try {
    const response = await fetch(url + "/rest/v1/shop_catalog_cards?" + query, {
      headers: { apikey: key, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!Array.isArray(data)) return null;

    return data.filter((row): row is ShopCard =>
      row !== null && typeof row === "object" &&
      typeof row.id === "string" && typeof row.slug === "string" &&
      typeof row.title === "string" && typeof row.description === "string" &&
      typeof row.category_label === "string" && typeof row.status_label === "string" &&
      typeof row.terms_text === "string" &&
      (row.price_centavos === null || (typeof row.price_centavos === "number" && Number.isInteger(row.price_centavos))) &&
      typeof row.checkout_enabled === "boolean" &&
      (row.image_url === null || (typeof row.image_url === "string" && row.image_url.startsWith("https://")))
    );
  } catch {
    return null;
  }
}

export async function loadPublishedShopCards(): Promise<PublishedShopCards> {
  const result = await fetchShopCards("select=" + FIELDS +
    "&is_published=eq.true&order=sort_order.asc,created_at.desc&limit=100");
  return result ? { cards: result, status: "ready" } : { cards: [], status: "unavailable" };
}

export async function loadPublishedShopCard(slug: string): Promise<ShopCard | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) return null;
  const result = await fetchShopCards("select=" + FIELDS +
    "&is_published=eq.true&slug=eq." + encodeURIComponent(slug) + "&limit=1");
  return result?.[0] || null;
}
