import assert from "node:assert/strict";
import test from "node:test";

import {
  authorizeHomepageUpload,
  verifyHomepageUploadToken,
} from "../app/lib/homepage-media-auth.ts";

const secret = "a-test-secret-that-is-long-enough-to-be-safe";
const pngSignature = "iVBORw0KGgo=";

function request(overrides = {}) {
  return {
    kind: "hero",
    contentType: "image/png",
    size: 8,
    signature: pngSignature,
    ...overrides,
  };
}

test("authorization produces an exact five-minute homepage claim", async () => {
  const now = 1_800_000_000;
  const result = await authorizeHomepageUpload(request(), secret, now, () => "11111111-1111-4111-8111-111111111111");
  assert.equal(result.claims.operation, "upload-homepage");
  assert.equal(result.claims.kind, "hero");
  assert.equal(result.claims.objectKey, "homepage/hero/11111111-1111-4111-8111-111111111111.png");
  assert.equal(result.claims.contentType, "image/png");
  assert.equal(result.claims.size, 8);
  assert.equal(result.claims.exp, now + 300);
  assert.deepEqual(await verifyHomepageUploadToken(result.token, secret, now), result.claims);
});

test("authorization rejects empty, oversized, unsupported, and signature-mismatched images", async () => {
  for (const invalid of [
    request({ size: 0 }),
    request({ size: 10 * 1024 * 1024 + 1 }),
    request({ contentType: "image/svg+xml" }),
    request({ signature: "R0lGODlh", contentType: "image/png" }),
    request({ kind: "avatar" }),
  ]) {
    await assert.rejects(authorizeHomepageUpload(invalid, secret), /invalid|unsupported|signature|large|empty/i);
  }
});

test("verification rejects expired, tampered, and non-exact tokens", async () => {
  const result = await authorizeHomepageUpload(request(), secret, 100);
  await assert.rejects(verifyHomepageUploadToken(result.token, secret, 401), /expired/i);
  await assert.rejects(verifyHomepageUploadToken(`${result.token}x`, secret, 100), /signature/i);

  const parts = result.token.split(".");
  const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString());
  payload.adminId = "forged";
  const forgedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  await assert.rejects(verifyHomepageUploadToken(`${forgedPayload}.${parts[1]}`, secret, 100), /signature/i);
});

test("admin authentication validates Auth user then site_admins with the same bearer token", async () => {
  const { requireSiteAdmin } = await import("../app/lib/homepage-media-auth.ts");
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith("/auth/v1/user")) return Response.json({ id: "user-1" });
    return Response.json([{ user_id: "user-1" }]);
  };
  assert.equal(await requireSiteAdmin("access-token", { url: "https://project.supabase.co", key: "publishable" }, fetcher), "user-1");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].init.headers.Authorization, "Bearer access-token");
  assert.equal(calls[1].init.headers.Authorization, "Bearer access-token");
  assert.match(calls[1].url, /site_admins/);
});

test("admin authentication rejects invalid users and valid non-admin users", async () => {
  const { requireSiteAdmin } = await import("../app/lib/homepage-media-auth.ts");
  await assert.rejects(requireSiteAdmin("bad", { url: "https://project.supabase.co", key: "key" }, async () => new Response(null, { status: 401 })), /unauthorized/i);
  let call = 0;
  await assert.rejects(requireSiteAdmin("member", { url: "https://project.supabase.co", key: "key" }, async () => ++call === 1 ? Response.json({ id: "user-2" }) : Response.json([])), /admin/i);
});
