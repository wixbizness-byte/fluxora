# /refer/admin Route Migration Design

Date: 2026-09-06

## Goal

Make `/refer/admin` the canonical Fluxora admin entry point for referral operations while preserving the existing referral backend, authorization, Supabase data model, and current `/prompts/admin/referrals` implementation.

## Current architecture

- Main Fluxora app: `wixbizness-byte/fluxora`
  - Owns `/refer`
  - Proxies `/prompts/*` to the prompt-gallery deployment
- Prompt/referral app: `wixbizness-byte/fluxora-prompt-gallery`
  - Has `basePath: /prompts`
  - Owns the existing referral admin UI and server actions
  - Current admin routes:
    - `/prompts/admin/referrals`
    - `/prompts/admin/referrals/tree`
    - `/prompts/admin/referral-risk`

## Target routes

Canonical public admin routes:

- `/refer/admin`
- `/refer/admin/tree`
- `/refer/admin/risk`

The existing referral admin code remains the source implementation. This change is a routing and navigation migration, not a referral-system rewrite.

## Architecture

### Main Fluxora app

Add narrow rewrites for the new canonical referral-admin paths:

- `/refer/admin` -> prompt-gallery referral console
- `/refer/admin/tree` -> prompt-gallery referral tree
- `/refer/admin/risk` -> prompt-gallery referral risk review

These rewrites must be declared before any broader matching route that could swallow them.

No member-facing `/refer` behavior changes.

### Prompt-gallery app

Update referral-admin navigation and links so admin users remain on canonical `/refer/admin/...` URLs when moving between Console, Referral Tree, and Risk Review.

Server actions must redirect back to canonical `/refer/admin` URLs after mutations. Existing admin authentication and `isAdminEmail` checks remain unchanged.

### Legacy compatibility

Keep the existing `/prompts/admin/referrals`, `/prompts/admin/referrals/tree`, and `/prompts/admin/referral-risk` routes functional as compatibility fallbacks during the migration.

Do not delete or rename the underlying prompt-gallery route files in this change.

## Data and backend constraints

No changes to:

- Supabase schema
- `referrer_accounts`
- `referral_attributions`
- `referral_claims`
- `reward_ledger`
- referral risk tables
- Trial/Referral V2 qualification logic
- reward issuance logic
- admin authorization model

The existing referral console continues reading and mutating the same source-of-truth data.

## Files expected to change

### `wixbizness-byte/fluxora`

- `next.config.ts`
- focused route/rewrite tests or new tests covering `/refer/admin` mapping

### `wixbizness-byte/fluxora-prompt-gallery`

Expected referral-admin link targets only, including:

- `app/admin/referrals/layout.tsx`
- `app/admin/referrals/page.tsx`
- `app/admin/referrals/tree/page.tsx`
- `app/admin/referrals/actions.ts`
- referral-risk page/actions where they link or redirect to referral-admin routes
- focused tests for canonical navigation/redirect behavior

Exact touched files may shrink after implementation-time search.

## Behavioral requirements

1. Visiting `/refer/admin` shows the existing Admin Referral Console.
2. Visiting `/refer/admin/tree` shows the existing Referral Tree.
3. Visiting `/refer/admin/risk` shows the existing Risk Review page.
4. Admin auth behavior remains identical.
5. Console -> Tree -> Risk navigation uses `/refer/admin/...` URLs.
6. Admin mutation redirects return to `/refer/admin` instead of `/prompts/admin/referrals` where applicable.
7. Member-facing `/refer` remains unchanged.
8. Legacy `/prompts/admin/...` referral URLs remain usable during the compatibility period.
9. No production Supabase writes or schema changes are part of this task.
10. No deployment lock is changed unless explicitly authorized in a later deployment step.

## Testing

Verify at minimum:

- rewrite mapping for each canonical route
- no route collision with `/refer`
- existing admin auth guards still execute
- internal referral-admin navigation uses canonical paths
- server-action success/error redirects use canonical paths
- legacy prompt-admin referral routes still resolve
- existing referral tests remain green
- build/typecheck passes in both repos

## Rollback

Rollback is limited to reverting the routing/link commits. Because no database or referral business logic changes are allowed, rollback does not require data repair or migration reversal.

## Out of scope

- redesigning the referral console UI
- adding pagination to the existing 25/250 loader caps
- changing referral rewards, qualification, or risk scoring
- moving referral backend code between repositories
- modifying Supabase
- changing `/refer` member functionality
