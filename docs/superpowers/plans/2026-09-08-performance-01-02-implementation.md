# Fluxora Performance 01 & 02 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce redundant public CMS, member-session, recommendation, analytics, and initial-bundle work while preserving Fluxora behavior and security.

**Architecture:** Add small testable coordination modules at external-request boundaries, then wire them into the existing React/Next.js components. Keep public server caching isolated from all authenticated data and make the existing auth gate the single owner of member account state.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.3, TypeScript 5, Node `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-08-performance-01-02-design.md`

## Global Constraints

- Work only on `perf/homepage-member-load-qa`.
- Do not modify main, production Supabase, Cloudflare resources, or production deployments.
- Preserve access/device enforcement, Trial/Referral V2, R2 upload authorization, homepage visuals, and member navigation.
- Add no SQL migration unless a fresh execution plan proves it necessary.

---

### Task 1: Cached homepage CMS loader

**Files:**
- Create: `app/lib/homepage-content.ts`
- Modify: `app/page.tsx`
- Test: `tests/homepage-content.test.mjs`

**Interfaces:**
- Produces: `loadHomepageContent()` and testable `createHomepageContentLoader()`.
- Consumes: `queryRows`, `normalizeHomepageContent`, Next.js `unstable_cache`.

- [ ] Write behavioral tests for exact projections, normalization/fallback, and cold/warm cache behavior.
- [ ] Run the focused tests and confirm expected failure.
- [ ] Implement the isolated 60-second tagged loader and update the page.
- [ ] Run focused and homepage tests until green.
- [ ] Commit the scoped change.

### Task 2: Authoritative member session and progressive optional loading

**Files:**
- Create: `app/member/request-coordinator.ts`
- Modify: `app/member/member-auth-gate.tsx`
- Modify: `app/member/member-overview.tsx`
- Test: `tests/member-request-coordinator.test.mjs`

**Interfaces:**
- Produces: `createRequestCoordinator()`, `MemberSessionProvider` context exposed by the gate.
- Consumes: authenticated `/prompts/api/member-portal` and optional member endpoints.

- [ ] Write race/deduplication/disposal tests and confirm expected failure.
- [ ] Implement the request coordinator.
- [ ] Make the gate publish the authoritative account and share refreshes.
- [ ] Remove the duplicate member-portal request from the overview.
- [ ] Make optional fields settle independently with separate loading states.
- [ ] Run focused tests and TypeScript until green.
- [ ] Commit the scoped change.

### Task 3: Retention-aware recommendation loading

**Files:**
- Create: `app/member/next-best-action-loader.ts`
- Modify: `app/member/next-best-action-panel.tsx`
- Test: `tests/next-best-action-loader.test.mjs`

**Interfaces:**
- Produces: `loadNextBestActionDecision(fetcher)`.
- Consumes: retention and Next Best Action endpoints.

- [ ] Write tests for eligible, noneligible, failed-retention, and unauthorized behavior.
- [ ] Confirm expected failure.
- [ ] Implement retention-first decision loading.
- [ ] Wire the panel while preserving refresh and errors.
- [ ] Run focused tests and TypeScript until green.
- [ ] Commit the scoped change.

### Task 4: Visibility-aware analytics polling

**Files:**
- Create: `app/lib/visibility-poller.ts`
- Modify: `app/members/active-access-portal.tsx`
- Modify: `app/members/resource-usage-portal.tsx`
- Test: `tests/visibility-poller.test.mjs`

**Interfaces:**
- Produces: `createVisibilityPoller(options)` returning `start`, `refresh`, and `stop`.
- Consumes: panel-specific async load functions and browser visibility/timer adapters.

- [ ] Write tests for initial load, overlap prevention, hidden pause, stale visible refresh, and cleanup.
- [ ] Confirm expected failure.
- [ ] Implement the controller and integrate both panels.
- [ ] Run focused tests and TypeScript until green.
- [ ] Commit the scoped change.

### Task 5: Lazy member sections and consolidated verification

**Files:**
- Modify: `app/member/page.tsx`
- Test: existing member and build checks.

**Interfaces:**
- Consumes: `next/dynamic` and existing tab React-node interface.

- [ ] Capture the baseline member route build output.
- [ ] Dynamically import non-default heavy section modules.
- [ ] Run the complete Node test suite.
- [ ] Run TypeScript, lint, and production build.
- [ ] Inspect the full branch diff and confirm no SQL/config/security drift.
- [ ] Record exact results and remaining lint baseline limitation.
- [ ] Commit and push the QA branch.
