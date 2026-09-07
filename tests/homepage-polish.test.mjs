import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage removes hero chips and keeps sans-serif typography", () => {
  const page = read("app/page.tsx");
  const css = read("app/home.module.css");
  assert.equal(page.includes("heroChips"), false, "hero chips should be removed");
  assert.match(css, /\.destinationCard h2[^}]*var\(--font-inter\)/s);
  assert.match(css, /\.toolPreviewBody h2[^}]*var\(--font-inter\)/s);
  assert.match(css, /\.previewMeta h2[^}]*var\(--font-inter\)/s);
});

test("homepage search UI is removed", () => {
  const page = read("app/page.tsx");
  assert.equal(page.includes("search={{"), false, "header search should be removed");
  assert.equal(page.includes("heroSearch"), false, "hero search form should be removed");
  assert.equal(page.includes("Search Fluxora"), false, "homepage should not render a search control");
});

test("mobile hero has visible gallery with edge blending", () => {
  const css = read("app/home.module.css");
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.heroGallery \{[^}]*opacity:\s*\.98/s);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.heroGalleryRow \{[^}]*mask-image:\s*linear-gradient\(90deg, transparent 0%,#000 14%,#000 86%,transparent 100%\)/s);
});

test("hero previews support configurable CTA labels", () => {
  const data = read("app/home-data.ts");
  const gallery = read("app/home-hero-gallery.tsx");
  const admin = read("app/admin/homepage-content-admin.tsx");
  assert.match(data, /cta_label:\s*string/);
  assert.match(gallery, /selected\.cta_label\s*\|\|\s*"Open resource"/);
  assert.match(admin, /CTA label/);
});

test("homepage admin supports direct image upload", () => {
  const admin = read("app/admin/homepage-content-admin.tsx");
  assert.match(admin, /type="file"/);
  assert.match(admin, /uploadHomepageMedia/);
});

test("featured preview cards support direct image upload too", () => {
  const admin = read("app/admin/homepage-content-admin.tsx");
  assert.match(admin, /async function uploadToolImage/);
  assert.match(admin, /uploadToolImage\(row, file\)/);
  assert.match(admin, /Uploading featured preview image/);
});
