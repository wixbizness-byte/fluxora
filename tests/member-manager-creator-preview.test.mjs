import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("app/member/member-manager.tsx", "utf8");

test("Creator Preview requires paid origin", () => {
  assert.ok(source.includes('const PAID_PREMIUM_ORIGINS = new Set(["paid", "manual_paid", "legacy_paid"])'));
  assert.ok(source.includes('if (!PAID_PREMIUM_ORIGINS.has(origin)) return false;'));
});
