import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../app/member/member-manager.tsx", import.meta.url), "utf8");

test("expired Tool accounts are grouped under Member in the admin filters", () => {
  assert.match(
    source,
    /if \(tier === "Tool" && !isEffectivelyActive\(member\)\) return "Member"/,
    "inactive or expired Tool accounts should be treated as Member for admin grouping",
  );
  assert.match(
    source,
    /tool: members\.filter\(\(m\) => adminGroupingTier\(m\) === "Tool"\)\.length/,
    "Tool count should only include effectively active Tool accounts",
  );
  assert.match(
    source,
    /member: members\.filter\(\(m\) => adminGroupingTier\(m\) === "Member"\)\.length/,
    "Member count should include downgrouped expired Tool accounts",
  );
});
