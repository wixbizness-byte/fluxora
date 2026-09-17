import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/member/member-resource-access-admin.module.css", import.meta.url), "utf8");

test("per-item access panel owns a readable dark foreground instead of inheriting the light admin text color", () => {
  assert.match(css, /\.panel\s*\{[\s\S]*?color:\s*#f8fafc;/);
  assert.match(css, /\.panel\s*\{[\s\S]*?color-scheme:\s*dark;/);
});

test("per-item access controls have explicit readable text and placeholder colors", () => {
  assert.match(css, /\.memberPicker select,[\s\S]*?color:\s*#f8fafc;/);
  assert.match(css, /::placeholder[\s\S]*?color:\s*#94a3b8;/);
});
