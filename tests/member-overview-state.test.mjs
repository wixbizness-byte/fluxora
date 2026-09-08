import assert from "node:assert/strict";
import test from "node:test";

import { visibleOptionalMemberData } from "../app/member/member-overview-state.ts";

const accountAData = {
  ownerKey: "member:a@example.com",
  profile: { displayName: "Account A" },
  progression: { xp: { total: 900 } },
  activity: { currentStreak: 12 },
  profileLoading: false,
  progressionLoading: false,
  activityLoading: false,
};

test("optional member data remains visible for its owning account", () => {
  assert.strictEqual(visibleOptionalMemberData("member:a@example.com", accountAData), accountAData);
});

test("an authoritative account switch synchronously masks the previous account data", () => {
  assert.deepEqual(visibleOptionalMemberData("member:b@example.com", accountAData), {
    ownerKey: "member:b@example.com",
    profile: null,
    progression: null,
    activity: null,
    profileLoading: true,
    progressionLoading: true,
    activityLoading: true,
  });
});
