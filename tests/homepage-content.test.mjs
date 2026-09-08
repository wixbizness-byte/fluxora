import assert from "node:assert/strict";
import test from "node:test";

import {
  createHomepageContentLoader,
  HOMEPAGE_CACHE_KEY,
  HOMEPAGE_CACHE_TAG,
  HOMEPAGE_REVALIDATE_SECONDS,
} from "../app/lib/homepage-content-core.ts";
import { normalizeHomepageContent } from "../app/home-data.ts";

const gallery = ["top", "middle", "bottom"].map((row, index) => ({
  id: `gallery-${index}`,
  image_url: `https://example.com/${index}.png`,
  target_url: `/prompts/${index}`,
  cta_label: "View prompt",
  alt_text: `Image ${index}`,
  row_position: row,
  sort_order: 1,
  is_active: true,
}));

const tools = [{
  id: "tool-1",
  badge: "TOOL",
  title: "Tool",
  description: "Description",
  image_url: "https://example.com/tool.png",
  button_label: "Open",
  button_url: "/tools",
  sort_order: 1,
  is_active: true,
}];

const faqs = [{
  id: "faq-1",
  question: "Question?",
  answer: "Answer.",
  sort_order: 1,
  is_active: true,
}];

test("homepage loader requests only renderer fields and preserves normalized collections", async () => {
  const calls = [];
  const query = async (table, queryString) => {
    calls.push([table, queryString]);
    return { data: table === "gallery_images" ? gallery : table === "homepage_tool_previews" ? tools : faqs, error: null };
  };
  const passthroughCache = (loader) => loader;
  const load = createHomepageContentLoader({ query, cache: passthroughCache, normalize: normalizeHomepageContent });

  const result = await load();

  assert.deepEqual(calls, [
    ["gallery_images", "select=id,image_url,target_url,cta_label,alt_text,row_position,sort_order,is_active&is_active=eq.true&sort_order=lte.6&order=row_position.asc,sort_order.asc"],
    ["homepage_tool_previews", "select=id,badge,title,description,image_url,button_label,button_url,sort_order,is_active&is_active=eq.true&order=sort_order.asc&limit=3"],
    ["homepage_faqs", "select=id,question,answer,sort_order,is_active&is_active=eq.true&order=sort_order.asc&limit=5"],
  ]);
  assert.equal(result.gallery.top[0].id, "gallery-0");
  assert.equal(result.gallery.middle[0].id, "gallery-1");
  assert.equal(result.gallery.bottom[0].id, "gallery-2");
  assert.equal(result.tools[0].id, "tool-1");
  assert.equal(result.faqs[0].id, "faq-1");
});

test("homepage loader caches the complete public payload with the bounded homepage policy", async () => {
  let upstreamCalls = 0;
  const query = async (table) => {
    upstreamCalls += 1;
    return { data: table === "gallery_images" ? gallery : table === "homepage_tool_previews" ? tools : faqs, error: null };
  };
  let capturedKey;
  let capturedOptions;
  const cache = (loader, key, options) => {
    capturedKey = key;
    capturedOptions = options;
    let value;
    return async () => {
      value ??= loader();
      return value;
    };
  };
  const load = createHomepageContentLoader({ query, cache, normalize: normalizeHomepageContent });

  const first = await load();
  const second = await load();

  assert.strictEqual(second, first);
  assert.equal(upstreamCalls, 3);
  assert.deepEqual(capturedKey, [HOMEPAGE_CACHE_KEY]);
  assert.deepEqual(capturedOptions, { revalidate: HOMEPAGE_REVALIDATE_SECONDS, tags: [HOMEPAGE_CACHE_TAG] });
  assert.equal(HOMEPAGE_REVALIDATE_SECONDS, 60);
});

test("homepage loader falls back when every public CMS read fails", async () => {
  const query = async () => ({ data: null, error: { message: "unavailable" } });
  const load = createHomepageContentLoader({ query, cache: (loader) => loader, normalize: normalizeHomepageContent });

  const result = await load();

  assert.equal(result.gallery.top.length, 6);
  assert.equal(result.gallery.middle.length, 6);
  assert.equal(result.gallery.bottom.length, 6);
  assert.equal(result.tools.length, 3);
  assert.equal(result.faqs.length, 5);
});
