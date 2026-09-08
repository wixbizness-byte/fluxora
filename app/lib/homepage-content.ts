import "server-only";

import { unstable_cache } from "next/cache";
import { normalizeHomepageContent } from "../home-data";
import { queryRows } from "./supabase";
import { createHomepageContentLoader } from "./homepage-content-core";

export const loadHomepageContent = createHomepageContentLoader({
  query: queryRows,
  cache: unstable_cache,
  normalize: normalizeHomepageContent,
});
