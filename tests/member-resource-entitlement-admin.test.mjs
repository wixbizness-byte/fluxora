import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const admin = readFileSync(new URL("../app/member/member-admin.tsx", import.meta.url), "utf8");
const panel = readFileSync(new URL("../app/member/member-resource-access-admin.tsx", import.meta.url), "utf8");

test("member admin mounts individual CustomGPT access controls", () => {
  assert.match(admin, /MemberResourceAccessAdmin/, "Member Admin must mount the isolated resource access control");
});

test("resource access panel loads members and the dedicated entitlement API", () => {
  assert.match(panel, /\/prompts\/api\/members/, "panel must load canonical member records");
  assert.match(panel, /member-resource-entitlements/, "panel must use the dedicated entitlement admin API");
  assert.match(panel, /customGptResources/, "panel must load the available CustomGPT catalog");
  assert.match(panel, /resourceEntitlements/, "panel must load explicit resource grants");
});

test("resource access panel exposes grant and revoke controls", () => {
  assert.match(panel, /Individual CustomGPT Access/, "UI must label the individual access section clearly");
  assert.match(panel, /grant_resource_entitlement/, "UI must send the explicit grant action");
  assert.match(panel, /revoke_resource_entitlement/, "UI must send the explicit revoke action");
  assert.match(panel, /Permanent/, "UI must support permanent access");
  assert.match(panel, /Custom expiry/, "UI must support a custom expiry");
  assert.match(panel, /Revoke/, "UI must expose revoke controls");
});
