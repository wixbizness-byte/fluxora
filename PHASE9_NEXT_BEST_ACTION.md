# Phase 9 — Next Best Action

Phase 9 adds one server-selected recommendation at the top of `/member`.

The recommendation is calculated from authenticated Fluxora state including Starter Journey progress, First Win status, membership/access expiry, active trial state, Reward Wallet balance, referral/milestone progress, and previously opened resources.

Priority order:

1. Apply wallet days when they can rescue or protect access.
2. Continue Starter Journey.
3. Complete First Win.
4. Use an active trial on an unexplored accessible resource.
5. Protect expiring access through Refer & Earn.
6. Push a referral milestone when the user is close.
7. Recommend an unexplored accessible resource.
8. Set up Refer & Earn.
9. Surface a non-urgent wallet balance.
10. Fall back to Prompt Gallery discovery.

Backend API: `/prompts/api/next-best-action`

The backend implementation and database migration live in `wixbizness-byte/fluxora-prompt-gallery`.
