# Fluxora Performance 01 & 02 Design

## Scope

Improve public-homepage and member-hub request efficiency without changing visual design, authentication authority, entitlements, device rules, Trial/Referral V2 semantics, Cloudflare resources, or production infrastructure.

## Public homepage

Move public CMS reads into a server-only loader. Query only renderer-required columns and wrap the complete normalized public payload in a Next.js server cache with a 60-second TTL and a homepage-only cache tag. Keep current ordering, limits, normalization, and fallback data. Admin writes remain unchanged in this patch, so publication freshness is bounded by the documented 60-second TTL; no public invalidation endpoint is introduced.

## Member session and optional data

`MemberAuthGate` owns the authoritative `/prompts/api/member-portal` request and exposes the successful payload through a scoped React context. A request coordinator deduplicates overlapping focus, visibility, and timer refreshes and prevents stale or unmounted requests from updating state. Confirmed HTTP 401 clears the account and unmounts protected content; quiet transient failures preserve the ready state.

`MemberOverviewProvider` consumes that account instead of fetching the same endpoint again. Community profile, progression, and daily activity load independently after authentication, with separate loading states. Account identity/access renders from the authoritative account payload without waiting for optional endpoints. Optional data is discarded and reloaded when account identity changes.

## Recommendations

The Next Best Action panel checks retention first. If retention confirms eligibility, it does not call the expensive recommendation endpoint. If retention is not eligible or the retention request fails, it requests the recommendation, preserving the current fallback and refresh behavior.

## Admin polling

Both analytics panels use one visibility-aware polling controller. It loads on mount, prevents overlapping requests, pauses recurring work while hidden, refreshes stale data when visible again, and cleans up on unmount. Existing authorization, Today/7 Days views, sorting, and member-focus behavior stay unchanged.

## Member bundles

Keep the authentication gate, overview shell, and tab controller eager. Dynamically import profile, progress, access, and admin section modules so the default Overview route does not eagerly load every section. Direct section navigation remains supported by the existing tab/location controller.

## Database and release

No SQL change is included without a fresh query plan proving it is needed. The source patch remains on `perf/homepage-member-load-qa`; main, production Supabase, and production deployment remain unchanged until separately approved.

## Verification

Use Node behavioral tests for the homepage loader, request coordinator, recommendation decision flow, and visibility-aware poller. Preserve the full existing test suite. Run TypeScript, production build, and lint; classify the pre-existing missing ESLint flat configuration separately.
