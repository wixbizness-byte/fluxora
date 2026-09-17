import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const panel = readFileSync(new URL("../app/member/member-resource-access-admin.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/member/member-resource-access-admin.module.css", import.meta.url), "utf8");

test("per-item access starts with no member selected and exposes Gmail search", () => {
  assert.match(panel, /useState\(\"\"\)[\s\S]*?memberQuery/);
  assert.doesNotMatch(panel, /nextMembers\[0\]\?\.id/);
  assert.match(panel, /type=\"search\"/);
  assert.match(panel, /placeholder=\"Search Gmail/);
});

test("Gmail search filters members and selecting a result sets the member", () => {
  assert.match(panel, /member\.gmail\.toLowerCase\(\)\.includes\(/);
  assert.match(panel, /setMemberId\(member\.id\)/);
  assert.match(panel, /setMemberQuery\(member\.gmail\)/);
});

test("per-item access panel uses the site Inter font explicitly", () => {
  assert.match(css, /\.panel\s*\{[\s\S]*?font-family:\s*var\(--font-inter\)/);
  assert.match(css, /\.heading h3,[\s\S]*?font-family:\s*var\(--font-inter\)/);
});
