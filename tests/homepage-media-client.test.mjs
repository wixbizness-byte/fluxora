import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage admin uses the shared R2 helper for both upload handlers", () => {
  const admin = read("app/admin/homepage-content-admin.tsx");
  assert.doesNotMatch(admin, /uploadPublicFile/);
  assert.match(admin, /uploadHomepageMedia\(file, "hero", activeSession\.access_token\)/);
  assert.match(admin, /uploadHomepageMedia\(file, "tools", activeSession\.access_token\)/);
  assert.doesNotMatch(admin, /uploadPublicFile\("homepage-media"/);
});

test("homepage upload state changes only after metadata publication and always clears busy", () => {
  const admin = read("app/admin/homepage-content-admin.tsx");
  assert.match(admin, /const saved = await updateRow<GalleryRow>[\s\S]*if \(saved\.error\) throw new Error\(saved\.error\.message\);[\s\S]*if \(saved\.data\?\.id !== row\.id\) throw new Error[\s\S]*setGallery/);
  assert.match(admin, /const saved = await updateRow<ToolRow>[\s\S]*if \(saved\.error\) throw new Error\(saved\.error\.message\);[\s\S]*if \(saved\.data\?\.id !== row\.id\) throw new Error[\s\S]*setTools/);
  assert.equal((admin.match(/finally \{/g) || []).length >= 2, true);
});

test("each upload refreshes its session and route imports resolve to app/lib", () => {
  const admin = read("app/admin/homepage-content-admin.tsx");
  assert.equal((admin.match(/const activeSession = await getSession\(\)/g) || []).length, 2);
  for (const route of ["app/api/homepage-media/authorize/route.ts", "app/api/homepage-media/verify/route.ts"]) {
    assert.match(read(route), /from "\.\.\/\.\.\/\.\.\/lib\/homepage-media-auth"/);
  }
});

test("client helper rejects a non-canonical Worker response", () => {
  const helper = read("app/lib/homepage-media-upload.ts");
  assert.match(helper, /https:\/\/media\.fluxora\.wiki\//);
  assert.match(helper, /size:\s*file\.size/);
  assert.match(helper, /result\.url !== expectedUrl/);
});
