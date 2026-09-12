import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manager = readFileSync(new URL("../app/member/member-manager.tsx", import.meta.url), "utf8");

test("Member Manager exposes Admin as an account type", () => {
  assert.match(manager, /<option value="Admin">Admin<\/option>/);
  assert.match(manager, /filter === "admin"/);
  assert.match(manager, /key: "admin", label: "Admin"/);
});

test("Admin account copy shows unlimited uses, devices, and Canvas slots", () => {
  assert.match(manager, /Admin has full access, unlimited uses\/devices\/Canvas slots, and no expiry/);
  assert.match(manager, /member\.tier === "Admin" \? "unlimited"/);
  assert.match(manager, /Canvas: \{member\.canvas_count \?\? 0\}/);
  assert.match(manager, /member\.tier === "Admin" \? "No expiry"/);
});
