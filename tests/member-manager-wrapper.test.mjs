import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../app/member/member-manager.tsx", import.meta.url), "utf8");

test("embedded MemberManager does not render a nested main landmark", () => {
  assert.equal(/<main\b/.test(source), false, "MemberManager must use a neutral wrapper because /member already owns the page <main> landmark");
});
