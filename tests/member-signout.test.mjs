import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../app/member/member-overview.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/member/member-overview.module.css", import.meta.url), "utf8");

test("Member account hero exposes a real logout POST", () => {
  assert.match(source, /action="\/prompts\/logout\?returnTo=\/member"/);
  assert.match(source, /method="post"/);
  assert.match(source, />Log out<\/button>/);
});

test("Member logout action has visible interaction styles", () => {
  assert.match(styles, /\.signOutForm/);
  assert.match(styles, /\.signOutButton/);
  assert.match(styles, /\.signOutButton:hover/);
  assert.match(styles, /\.signOutButton:focus-visible/);
});
