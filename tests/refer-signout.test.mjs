import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../app/refer/refer-client.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/refer/refer.module.css", import.meta.url), "utf8");

test("Refer authenticated views expose a real logout POST", () => {
  assert.match(source, /function SignOutAction\(\)/);
  assert.match(source, /action="\/prompts\/logout\?returnTo=\/refer"/);
  assert.match(source, /method="post"/);
  const uses = source.match(/<SignOutAction \/>/g) || [];
  assert.equal(uses.length, 3);
});

test("Refer logout action is styled for desktop and mobile", () => {
  assert.match(styles, /\.headerActionButton/);
  assert.match(styles, /\.headerActions form\{display:flex;margin:0\}/);
  assert.match(styles, /\.headerActionButton\{width:100%;justify-content:center\}/);
});
