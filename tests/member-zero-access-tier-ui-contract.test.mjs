import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manager = readFileSync(new URL("../app/member/member-manager.tsx", import.meta.url), "utf8");

test("Member Manager exposes a zero-access Member tier by default", () => {
  assert.match(manager, /tier:\s*[\s\S]*?[\"']Member[\"'][\s\S]*?[\"']Tool[\"'][\s\S]*?[\"']Premium[\"'][\s\S]*?[\"']Creator[\"']/);
  assert.match(manager, /data\.get\([\"']tier[\"']\)\s*\|\|\s*[\"']Member[\"']/);
  assert.match(manager, /member\s*\?\s*baseTier\(member\)\s*:\s*[\"']Member[\"']/);
  assert.match(manager, /<option value=[\"']Member[\"']>Member<\/option>/);
  assert.match(manager, /Member has no tier-based resource access/);
  assert.match(manager, /member:\s*members\.filter\(\(m\) => effectiveTier\(m\) === [\"']Member[\"']\)/);
  assert.match(manager, /filter === [\"']member[\"'] \? tier === [\"']Member[\"']/);
  assert.match(manager, /\{ key: [\"']member[\"'], label: [\"']Member[\"'] \}/);
});
