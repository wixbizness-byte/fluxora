# /refer/admin Route Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/refer/admin`, `/refer/admin/tree`, and `/refer/admin/risk` the canonical public URLs for the existing Fluxora referral admin console without moving or rewriting its backend.

**Architecture:** The main `wixbizness-byte/fluxora` app will add three narrow external rewrites into the existing `wixbizness-byte/fluxora-prompt-gallery` referral-admin routes. The prompt-gallery app keeps its `basePath: /prompts`, route files, auth guards, server actions, data loaders, and internal cache keys, but user-facing referral navigation and action redirects will point back to the canonical main-site `/refer/admin/...` URLs. Legacy `/prompts/admin/...` referral routes remain intact as compatibility fallbacks.

**Tech Stack:** Next.js 16.2.10 App Router, React 19, TypeScript, Node.js built-in test runner, NextAuth in prompt-gallery, external Next.js rewrites.

**Spec:** `docs/superpowers/specs/2026-09-06-refer-admin-route-design.md`

## Global Constraints

- Main Fluxora implementation branch: `fluxora-refer-admin-route-qa`, currently based on approved production main `09ef2d94e5307a6d572c9b21b6d864d19c716e50`; design commit is `061b63cdb471461619410f88a6250e602a7ae35b`.
- Prompt-gallery implementation branch must be created as `fluxora-refer-admin-route-qa` from `d49cae6eda094c9cf25d5715895a707ab38ca9a1` before editing that repo.
- Keep `vercel.json` deployment locks unchanged in both repositories.
- Do not modify Supabase, SQL migrations, Trial/Referral V2 qualification, referral rewards, risk scoring, access/device systems, or member-facing `/refer` behavior.
- Do not rename or delete `app/admin/referrals/**` or `app/admin/referral-risk/**` in prompt-gallery; those legacy route files must remain functional under `/prompts/admin/...`.
- Preserve prompt-gallery auth behavior: `auth()`, `isAdminEmail(...)`, `requireAdmin()`, and existing admin-login/back links are not part of this migration.
- Prompt-gallery `AGENTS.md` requires reading the installed Next.js docs under `node_modules/next/dist/docs/` before implementation. Confirm current `basePath`, `Link`, `redirect`, `revalidatePath`, and rewrites behavior before editing.
- User-facing cross-app referral links inside prompt-gallery must bypass its `/prompts` basePath. Prefer plain `<a href="/refer/admin...">` anchors unless the installed Next.js docs establish a safer equivalent.
- Keep prompt-gallery cache invalidation on the route keys it actually owns: `revalidatePath("/admin/referrals")` and `revalidatePath("/admin/referral-risk")` stay unchanged unless installed Next.js docs and a focused test prove otherwise.

## File Structure

### `wixbizness-byte/fluxora`

- Modify `next.config.ts` — owns the three canonical public-to-prompt-gallery rewrites.
- Create `tests/refer-admin-rewrites.test.mjs` — contract test for exact canonical mappings and protection against an accidental broad `/refer/:path*` proxy.
- Existing `docs/superpowers/specs/2026-09-06-refer-admin-route-design.md` — approved design, no further edits expected.
- This plan file — execution checklist only.

### `wixbizness-byte/fluxora-prompt-gallery`

- Modify `app/admin/referrals/layout.tsx` — canonical Console / Referral Tree / Risk Review navigation.
- Modify `app/admin/referrals/page.tsx` — canonical Clear and risk-review links while preserving prompt-admin auth links.
- Modify `app/admin/referrals/tree/page.tsx` — canonical Console and Clear links while preserving prompt-admin auth links.
- Modify `app/admin/referral-risk/page.tsx` — canonical links back to Console and Referral Tree while preserving prompt-admin auth links.
- Modify `app/admin/referrals/actions.ts` — redirect successful/error mutation results to `/refer/admin` while preserving internal `revalidatePath`.
- Modify `app/admin/referral-risk/actions.ts` — redirect risk-review results to `/refer/admin/risk` while preserving internal `revalidatePath`.
- Create `tests/referral-admin-canonical-routes.test.mjs` — static route/navigation contract and legacy-route-file retention test.
- Create `tests/referral-admin-canonical-actions.test.mjs` — static action redirect/cache-key contract.

---

### Task 1: Add canonical `/refer/admin` proxy routes in the main Fluxora app

**Files:**
- Modify: `next.config.ts`
- Create: `tests/refer-admin-rewrites.test.mjs`

**Interfaces:**
- Consumes: existing `PROMPTS_ORIGIN = "https://fluxora-prompt-gallery.vercel.app"` and prompt-gallery legacy public paths under `/prompts/admin/...`.
- Produces: exact external rewrite mappings for `/refer/admin`, `/refer/admin/tree`, and `/refer/admin/risk` while leaving `/refer` itself owned by the main app.

- [ ] **Step 1: Confirm the branch and deployment lock before editing**

Run:

```bash
git switch fluxora-refer-admin-route-qa
git rev-parse HEAD
git show 09ef2d94e5307a6d572c9b21b6d864d19c716e50:vercel.json
git diff --name-only 09ef2d94e5307a6d572c9b21b6d864d19c716e50...HEAD
```

Expected:
- `HEAD` includes the approved design commit `061b63cdb471461619410f88a6250e602a7ae35b`.
- Production baseline has `"deploymentEnabled": false`.
- Before implementation, the only intentional branch delta is the design/plan documentation.

- [ ] **Step 2: Write the failing rewrite contract test**

Create `tests/refer-admin-rewrites.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
const compact = source.replace(/\s+/g, " ");

test("canonical referral admin routes proxy to the existing prompt-gallery admin surfaces", () => {
  assert.match(
    compact,
    /source: "\/refer\/admin", destination: `\$\{PROMPTS_ORIGIN\}\/prompts\/admin\/referrals`/,
  );
  assert.match(
    compact,
    /source: "\/refer\/admin\/tree", destination: `\$\{PROMPTS_ORIGIN\}\/prompts\/admin\/referrals\/tree`/,
  );
  assert.match(
    compact,
    /source: "\/refer\/admin\/risk", destination: `\$\{PROMPTS_ORIGIN\}\/prompts\/admin\/referral-risk`/,
  );
});

test("member-facing /refer is not replaced by a broad proxy", () => {
  assert.doesNotMatch(source, /source:\s*["']\/refer\/:path\*["']/);
});
```

- [ ] **Step 3: Run the focused test and verify it fails for the missing routes**

Run:

```bash
node --test tests/refer-admin-rewrites.test.mjs
```

Expected: FAIL in the canonical rewrite test because `next.config.ts` does not yet contain `/refer/admin` mappings. The broad-proxy safety test should already pass.

- [ ] **Step 4: Add the minimal exact rewrites before the existing broad `/prompts` entries**

Update the beginning of the `rewrites()` array in `next.config.ts` to include exactly:

```ts
return [
  {
    source: "/refer/admin",
    destination: `${PROMPTS_ORIGIN}/prompts/admin/referrals`,
  },
  {
    source: "/refer/admin/tree",
    destination: `${PROMPTS_ORIGIN}/prompts/admin/referrals/tree`,
  },
  {
    source: "/refer/admin/risk",
    destination: `${PROMPTS_ORIGIN}/prompts/admin/referral-risk`,
  },
  {
    source: "/prompts",
    destination: `${PROMPTS_ORIGIN}/prompts`,
  },
```

Do not add `/refer/:path*`, do not touch `app/refer/**`, and do not change `PROMPTS_ORIGIN`.

- [ ] **Step 5: Re-run the focused test**

Run:

```bash
node --test tests/refer-admin-rewrites.test.mjs
```

Expected: PASS, 2 tests.

- [ ] **Step 6: Run main-app lint and build**

Run:

```bash
npm run lint
npm run build
```

Expected: both exit 0.

- [ ] **Step 7: Commit the main-app routing change**

Run:

```bash
git add next.config.ts tests/refer-admin-rewrites.test.mjs
git commit -m "feat: expose referral admin under /refer/admin"
```

Expected: one focused commit containing only the rewrite config and its test.

---

### Task 2: Canonicalize prompt-gallery referral admin navigation without breaking `basePath` or auth

**Files:**
- Modify: `app/admin/referrals/layout.tsx`
- Modify: `app/admin/referrals/page.tsx`
- Modify: `app/admin/referrals/tree/page.tsx`
- Modify: `app/admin/referral-risk/page.tsx`
- Create: `tests/referral-admin-canonical-routes.test.mjs`

**Interfaces:**
- Consumes: canonical public paths `/refer/admin`, `/refer/admin/tree`, `/refer/admin/risk`; existing prompt-gallery internal `/admin` auth route under `basePath: /prompts`.
- Produces: user-facing referral-to-referral navigation that leaves the prompt-gallery basePath and returns to canonical main-site URLs. Existing `Link href="/admin"` auth/back behavior remains internal to prompt-gallery.

- [ ] **Step 1: Create the prompt-gallery QA branch from the frozen starting SHA**

Run in `wixbizness-byte/fluxora-prompt-gallery`:

```bash
git fetch origin
git switch --detach d49cae6eda094c9cf25d5715895a707ab38ca9a1
git switch -c fluxora-refer-admin-route-qa
git rev-parse HEAD
cat vercel.json
```

Expected:
- branch HEAD is exactly `d49cae6eda094c9cf25d5715895a707ab38ca9a1` before edits.
- `vercel.json` still has `"deploymentEnabled": false`.

- [ ] **Step 2: Read the installed Next.js 16.2.10 docs required by `AGENTS.md`**

Run:

```bash
rg -n "basePath|next/link|Link component|redirect\(|revalidatePath|rewrites" node_modules/next/dist/docs/ | head -n 120
```

Then read the matching installed documentation files returned by `rg`, with special attention to:
- whether `next/link` automatically applies `basePath` to local hrefs;
- whether a normal HTML `<a href="/refer/admin">` bypasses that basePath;
- whether App Router `redirect("/refer/admin")` emits that absolute path unchanged;
- whether `revalidatePath` should continue naming the prompt-gallery-owned internal route.

Expected design decision: plain `<a>` for cross-app `/refer/admin...` navigation, `redirect("/refer/admin...")` for action responses, and unchanged internal `revalidatePath("/admin/...")`. If installed docs contradict this, stop before editing and report the contradiction rather than improvising.

- [ ] **Step 3: Write the failing canonical-navigation contract test**

Create `tests/referral-admin-canonical-routes.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const layout = readFileSync(new URL("../app/admin/referrals/layout.tsx", import.meta.url), "utf8");
const consolePage = readFileSync(new URL("../app/admin/referrals/page.tsx", import.meta.url), "utf8");
const treePage = readFileSync(new URL("../app/admin/referrals/tree/page.tsx", import.meta.url), "utf8");
const riskPage = readFileSync(new URL("../app/admin/referral-risk/page.tsx", import.meta.url), "utf8");

function hasPlainAnchor(source, href) {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`<a\\b[^>]*href=["']${escaped}["']`).test(source);
}

test("referral admin section navigation uses canonical main-site URLs", () => {
  assert.equal(hasPlainAnchor(layout, "/refer/admin"), true, "layout must link to canonical console");
  assert.equal(hasPlainAnchor(layout, "/refer/admin/tree"), true, "layout must link to canonical tree");
  assert.equal(hasPlainAnchor(layout, "/refer/admin/risk"), true, "layout must link to canonical risk review");

  assert.equal(hasPlainAnchor(consolePage, "/refer/admin"), true, "console Clear link must stay canonical");
  assert.match(consolePage, /\/refer\/admin\/risk#hold-\$\{hold\.id\}/, "risk-hold deep link must stay canonical");

  assert.equal(hasPlainAnchor(treePage, "/refer/admin"), true, "tree must link back to canonical console");
  assert.equal(hasPlainAnchor(treePage, "/refer/admin/tree"), true, "tree Clear link must stay canonical");

  assert.equal(hasPlainAnchor(riskPage, "/refer/admin"), true, "risk page must link back to canonical console");
  assert.equal(hasPlainAnchor(riskPage, "/refer/admin/tree"), true, "risk page must link to canonical tree");
});

test("canonical referral links do not use next/link where basePath would re-prefix them", () => {
  for (const source of [layout, consolePage, treePage, riskPage]) {
    assert.doesNotMatch(source, /<Link\b[^>]*href=["']\/refer\/admin/);
  }
});

test("legacy prompt-gallery referral route files remain in place", () => {
  assert.equal(existsSync(new URL("../app/admin/referrals/page.tsx", import.meta.url)), true);
  assert.equal(existsSync(new URL("../app/admin/referrals/tree/page.tsx", import.meta.url)), true);
  assert.equal(existsSync(new URL("../app/admin/referral-risk/page.tsx", import.meta.url)), true);
});
```

- [ ] **Step 4: Run the navigation contract and verify it fails**

Run:

```bash
node --test tests/referral-admin-canonical-routes.test.mjs
```

Expected: FAIL because current referral navigation still uses `/admin/referrals` and `/admin/referral-risk` under `next/link`.

- [ ] **Step 5: Replace only referral-to-referral navigation with canonical plain anchors**

Apply these exact public path substitutions:

`app/admin/referrals/layout.tsx`:

```tsx
<a href="/refer/admin">Console</a>
<a href="/refer/admin/tree">Referral Tree</a>
<a href="/refer/admin/risk">Risk Review</a>
```

`app/admin/referrals/page.tsx`:

```tsx
<a href={`/refer/admin/risk#hold-${hold.id}`}>Open review queue</a>
<a href="/refer/admin/risk">Risk Review</a>
<a href="/refer/admin">Clear</a>
```

Keep the existing prompt-gallery `Link href="/admin"` entries unchanged so the existing prompt-admin login/back flow is not altered.

`app/admin/referrals/tree/page.tsx`:

```tsx
<a href="/refer/admin">Referral Console</a>
<a href="/refer/admin/tree">Clear</a>
```

Again, keep existing `Link href="/admin"` entries unchanged.

`app/admin/referral-risk/page.tsx`:
- keep the existing `Link href="/admin"` auth/back links unchanged;
- add referral-section links alongside the authenticated page header controls:

```tsx
<a href="/refer/admin">Referral Console</a>
<a href="/refer/admin/tree">Referral Tree</a>
```

Reuse the surrounding existing inline/header styling rather than introducing a new CSS file or redesign.

- [ ] **Step 6: Re-run the canonical-navigation test**

Run:

```bash
node --test tests/referral-admin-canonical-routes.test.mjs
```

Expected: PASS, 3 tests.

- [ ] **Step 7: Lint the touched prompt-gallery UI files**

Run:

```bash
npx eslint app/admin/referrals/layout.tsx app/admin/referrals/page.tsx app/admin/referrals/tree/page.tsx app/admin/referral-risk/page.tsx tests/referral-admin-canonical-routes.test.mjs
```

Expected: exit 0.

- [ ] **Step 8: Commit canonical navigation**

Run:

```bash
git add app/admin/referrals/layout.tsx app/admin/referrals/page.tsx app/admin/referrals/tree/page.tsx app/admin/referral-risk/page.tsx tests/referral-admin-canonical-routes.test.mjs
git commit -m "feat: use canonical referral admin navigation"
```

Expected: one focused prompt-gallery commit containing navigation only.

---

### Task 3: Canonicalize prompt-gallery admin action redirects while preserving internal cache invalidation

**Files:**
- Modify: `app/admin/referrals/actions.ts`
- Modify: `app/admin/referral-risk/actions.ts`
- Create: `tests/referral-admin-canonical-actions.test.mjs`

**Interfaces:**
- Consumes: existing action functions and prompt-gallery-owned internal route keys.
- Produces: browser redirects to `/refer/admin?...` and `/refer/admin/risk?...`; keeps `revalidatePath("/admin/referrals")` and `revalidatePath("/admin/referral-risk")` unchanged.

- [ ] **Step 1: Write the failing action redirect/cache contract**

Create `tests/referral-admin-canonical-actions.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const referralActions = readFileSync(new URL("../app/admin/referrals/actions.ts", import.meta.url), "utf8");
const riskActions = readFileSync(new URL("../app/admin/referral-risk/actions.ts", import.meta.url), "utf8");

test("referral mutations redirect the browser to canonical /refer/admin", () => {
  assert.match(
    referralActions,
    /redirect\(`\/refer\/admin\?\$\{params\.toString\(\)\}`\)/,
  );
  assert.doesNotMatch(
    referralActions,
    /redirect\(`\/admin\/referrals\?\$\{params\.toString\(\)\}`\)/,
  );
});

test("risk mutations redirect the browser to canonical /refer/admin/risk", () => {
  assert.match(
    riskActions,
    /redirect\(`\/refer\/admin\/risk\?\$\{params\.toString\(\)\}`\)/,
  );
  assert.doesNotMatch(
    riskActions,
    /redirect\(`\/admin\/referral-risk\?\$\{params\.toString\(\)\}`\)/,
  );
});

test("prompt-gallery keeps invalidating the internal routes it actually owns", () => {
  assert.match(referralActions, /revalidatePath\(["']\/admin\/referrals["']\)/);
  assert.match(riskActions, /revalidatePath\(["']\/admin\/referral-risk["']\)/);
  assert.doesNotMatch(referralActions, /revalidatePath\(["']\/refer\/admin/);
  assert.doesNotMatch(riskActions, /revalidatePath\(["']\/refer\/admin/);
});
```

- [ ] **Step 2: Run the focused action test and verify it fails only on legacy redirects**

Run:

```bash
node --test tests/referral-admin-canonical-actions.test.mjs
```

Expected:
- first two tests FAIL because redirects still use `/admin/referrals` and `/admin/referral-risk`;
- cache-key test PASS because internal `revalidatePath` values are already correct and must remain unchanged.

- [ ] **Step 3: Change only the two redirect helper destinations**

In `app/admin/referrals/actions.ts`, change the redirect helper to:

```ts
redirect(`/refer/admin?${params.toString()}`);
```

Do not change any of these calls:

```ts
revalidatePath("/admin/referrals");
```

In `app/admin/referral-risk/actions.ts`, change the redirect helper to:

```ts
redirect(`/refer/admin/risk?${params.toString()}`);
```

Do not change:

```ts
revalidatePath("/admin/referral-risk");
```

No RPC names, validation, admin authorization, reason requirements, audit events, reward logic, or risk decisions change.

- [ ] **Step 4: Re-run focused referral admin tests**

Run:

```bash
node --test tests/referral-admin-canonical-actions.test.mjs tests/referral-admin-canonical-routes.test.mjs
```

Expected: PASS, 6 tests total.

- [ ] **Step 5: Run existing Trial/Referral V2 regression coverage**

Run:

```bash
npm run test:trial-referral-v2
```

Expected: exit 0; existing Trial/Referral V2 contracts remain green.

- [ ] **Step 6: Lint the action files and new test**

Run:

```bash
npx eslint app/admin/referrals/actions.ts app/admin/referral-risk/actions.ts tests/referral-admin-canonical-actions.test.mjs
```

Expected: exit 0.

- [ ] **Step 7: Commit canonical action redirects**

Run:

```bash
git add app/admin/referrals/actions.ts app/admin/referral-risk/actions.ts tests/referral-admin-canonical-actions.test.mjs
git commit -m "fix: redirect referral admin actions to canonical routes"
```

Expected: one focused prompt-gallery commit containing redirect changes only.

---

### Task 4: Cross-repository regression and scope verification

**Files:**
- Verify only; no new production files expected.

**Interfaces:**
- Consumes: Task 1 main-site rewrites plus Task 2-3 prompt-gallery canonical navigation/redirects.
- Produces: a QA-ready two-repository change set with deployment locks intact and no Supabase or referral-business-logic changes.

- [ ] **Step 1: Run the full available main Fluxora tests, lint, and build**

Run in `wixbizness-byte/fluxora`:

```bash
node --test tests/*.test.mjs
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 2: Run the full prompt-gallery local test set, lint, and build**

Run in `wixbizness-byte/fluxora-prompt-gallery`:

```bash
node --test tests/*.test.mjs
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 3: Prove no stale referral-to-referral browser links or redirects remain in the touched prompt admin surfaces**

Run in prompt-gallery:

```bash
rg -n 'href=.*\/admin\/referrals|href=.*\/admin\/referral-risk|redirect\(`/admin/referrals|redirect\(`/admin/referral-risk' app/admin/referrals app/admin/referral-risk
```

Expected: no matches.

Then confirm the intentionally retained internal cache keys still exist:

```bash
rg -n 'revalidatePath\("/admin/referrals"\)|revalidatePath\("/admin/referral-risk"\)' app/admin/referrals/actions.ts app/admin/referral-risk/actions.ts
```

Expected: matches for the existing internal `revalidatePath` calls.

- [ ] **Step 4: Verify legacy prompt-gallery routes still exist and canonical routes are referenced**

Run in prompt-gallery:

```bash
test -f app/admin/referrals/page.tsx
test -f app/admin/referrals/tree/page.tsx
test -f app/admin/referral-risk/page.tsx
rg -n '/refer/admin' app/admin/referrals app/admin/referral-risk tests/referral-admin-canonical-*.test.mjs
```

Expected: all route files exist and canonical references are present across navigation/actions/tests.

- [ ] **Step 5: Verify scope and deployment locks in both repositories**

Run in main Fluxora:

```bash
git diff --name-only 09ef2d94e5307a6d572c9b21b6d864d19c716e50...HEAD
cat vercel.json
```

Expected main-code scope:
- `next.config.ts`
- `tests/refer-admin-rewrites.test.mjs`
- approved design/plan docs
- no `app/refer/**`, Supabase, SQL, access/device, or `vercel.json` changes.

Run in prompt-gallery:

```bash
git diff --name-only d49cae6eda094c9cf25d5715895a707ab38ca9a1...HEAD
cat vercel.json
```

Expected prompt-gallery scope:
- `app/admin/referrals/layout.tsx`
- `app/admin/referrals/page.tsx`
- `app/admin/referrals/tree/page.tsx`
- `app/admin/referral-risk/page.tsx`
- `app/admin/referrals/actions.ts`
- `app/admin/referral-risk/actions.ts`
- `tests/referral-admin-canonical-routes.test.mjs`
- `tests/referral-admin-canonical-actions.test.mjs`
- no Supabase/migration/referral business-logic files and no `vercel.json` changes.

Both `vercel.json` files must still report `"deploymentEnabled": false`.

- [ ] **Step 6: Record the two final QA HEADs without merging or deploying**

Run in each repository:

```bash
git status --short
git rev-parse HEAD
```

Expected:
- clean working tree in both repos;
- one final QA HEAD SHA per repo ready for review;
- no production merge, Vercel deployment enablement, or Supabase write occurs in this plan.

## Self-Review Results

- Spec coverage: all three canonical public routes, internal navigation, action redirects, legacy compatibility, auth preservation, no `/refer` collision, no Supabase changes, and deployment-lock preservation are mapped to explicit tasks/tests.
- Placeholder scan: no `TBD`, `TODO`, deferred implementation, or unspecified test steps remain.
- Interface consistency: public canonical paths are `/refer/admin`, `/refer/admin/tree`, `/refer/admin/risk`; prompt-gallery internal cache keys remain `/admin/referrals` and `/admin/referral-risk`; external rewrite destinations retain the prompt-gallery `/prompts` basePath.
