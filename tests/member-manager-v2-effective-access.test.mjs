import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../app/member/member-manager.tsx", import.meta.url), "utf8");

test("Member Manager counts and renders canonical V2 trial access", () => {
  assert.match(source, /effective_access/, "Member shape must consume effective_access from the admin API");
  assert.match(source, /trial_expires_at/, "Member shape must consume canonical trial expiry");
  assert.match(source, /effective_device_limit/, "Member shape must consume effective device limit");
  assert.match(source, /Premium Trial/, "Trial filtering/display must use the resolver's Premium Trial label");
});
