import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manager = readFileSync(new URL("../app/member/member-manager.tsx", import.meta.url), "utf8");

test("member manager loads individual CustomGPT entitlement data", () => {
  assert.match(manager, /member-resource-entitlements/, "Member Manager must load the dedicated entitlement admin API");
  assert.match(manager, /customGptResources/, "Member Manager must keep the available CustomGPT catalog");
  assert.match(manager, /resource_entitlements/, "Member records must expose their explicit resource grants");
});

test("member manager exposes grant and revoke controls", () => {
  assert.match(manager, /Individual CustomGPT Access/, "UI must label the individual access section clearly");
  assert.match(manager, /grant_resource_entitlement/, "UI must send the explicit grant action");
  assert.match(manager, /revoke_resource_entitlement/, "UI must send the explicit revoke action");
  assert.match(manager, /Permanent/, "UI must support permanent access");
  assert.match(manager, /Custom expiry/, "UI must support a custom expiry");
  assert.match(manager, /Revoke/, "UI must expose revoke controls");
});
