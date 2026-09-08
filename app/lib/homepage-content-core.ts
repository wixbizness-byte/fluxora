export const HOMEPAGE_CACHE_KEY = "fluxora-homepage-content-v1";
export const HOMEPAGE_CACHE_TAG = "fluxora-homepage-content";
export const HOMEPAGE_REVALIDATE_SECONDS = 60;

type HomeGalleryImage = {
  id: string;
  image_url: string;
  target_url: string;
  cta_label: string;
  alt_text: string;
  row_position: "top" | "middle" | "bottom";
  sort_order: number;
  is_active: boolean;
};

type HomeToolPreview = {
  id: string;
  badge: string;
  title: string;
  description: string;
  image_url: string;
  button_label: string;
  button_url: string;
  sort_order: number;
  is_active: boolean;
};

type HomeFaq = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

type HomepageCollections = {
  gallery: HomeGalleryImage[];
  tools: HomeToolPreview[];
  faqs: HomeFaq[];
};

type QueryResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

export type HomepageQuery = <T>(table: string, query: string) => Promise<QueryResult<T>>;

type CacheOptions = {
  revalidate: number;
  tags: string[];
};

export type HomepageCache = <T>(
  loader: () => Promise<T>,
  keyParts: string[],
  options: CacheOptions,
) => () => Promise<T>;

const GALLERY_QUERY = "select=id,image_url,target_url,cta_label,alt_text,row_position,sort_order,is_active&is_active=eq.true&sort_order=lte.6&order=row_position.asc,sort_order.asc";
const TOOLS_QUERY = "select=id,badge,title,description,image_url,button_label,button_url,sort_order,is_active&is_active=eq.true&order=sort_order.asc&limit=3";
const FAQS_QUERY = "select=id,question,answer,sort_order,is_active&is_active=eq.true&order=sort_order.asc&limit=5";

export function createHomepageContentLoader<T>({
  query,
  cache,
  normalize,
}: {
  query: HomepageQuery;
  cache: HomepageCache;
  normalize: (collections: HomepageCollections) => T;
}) {
  return cache(async () => {
    const [galleryResult, toolResult, faqResult] = await Promise.all([
      query<HomeGalleryImage>("gallery_images", GALLERY_QUERY),
      query<HomeToolPreview>("homepage_tool_previews", TOOLS_QUERY),
      query<HomeFaq>("homepage_faqs", FAQS_QUERY),
    ]);

    return normalize({
      gallery: galleryResult.data || [],
      tools: toolResult.data || [],
      faqs: faqResult.data || [],
    });
  }, [HOMEPAGE_CACHE_KEY], {
    revalidate: HOMEPAGE_REVALIDATE_SECONDS,
    tags: [HOMEPAGE_CACHE_TAG],
  });
}
