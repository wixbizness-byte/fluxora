# Phase 13 — Public Progression Profiles

Phase 13 adds an opt-in public progression layer to Fluxora creator profiles.

## Privacy

Public progression is disabled by default. When enabled from `/member`, a creator profile may show:

- Fluxora level and total XP
- progress toward the next level
- unlocked achievement badges
- longest activity streak
- referral rank

The public profile does not expose Gmail, Telegram identity, membership/access state, expiry, wallet balance, registered devices, qualified-referral counts, current or last active day, or recent activity history.

## Implementation

The Prompt Gallery backend exposes a sanitized service-only progression RPC and renders it on `/u/[username]` only for opted-in active profiles. The parent Fluxora `/member` creator-profile form contains the opt-in privacy control.
