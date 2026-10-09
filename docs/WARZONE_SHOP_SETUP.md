# Fluxora reseller shop — Phase 1 (read-only)

This branch introduces a read-only catalog at `/shop`. It does **not** create supplier orders, handle customer payments, or expose supplier pricing.

## Server environment variables

Add to the Fluxora Vercel project (server environment variables, **not** `NEXT_PUBLIC_*`):

- `WARZONE_API_KEY`: API key generated inside the Warzone Telegram bot. Never commit or share it.
- `FLUXORA_SHOP_APPROVED_IDS`: comma-separated service IDs that you have individually reviewed and have documented resale rights to offer, for example `S_01,S_02`. Leave empty until approved.

Deploy/redeploy after setting Vercel variables. The shop shows a safe placeholder if the allowlist is empty, the key is absent, or Warzone is unavailable.

## Supplier access

- Base endpoint: `GET https://api.warzoneshop.in/api/v1/products`
- Header: `X-API-Key: <server-only key>`
- The adapter runs on the server and caches the supplier response for 120 seconds.
- Only service IDs in `FLUXORA_SHOP_APPROVED_IDS` are sent to the public page.
- Public data is limited to service ID, name, normalized stock count, and availability. Supplier USD prices, account balance, activation links, errors, and the API key are never sent to the browser.
- Out-of-stock products are visible as unavailable and cannot be purchased.
- Nothing calls `POST /api/v1/order`.

## Payment and resale requirements

Warzone offering a product does not establish that an authorized reseller is allowed to sell it. Verify licensing, product terms, warranties, and refund obligations for each listing. Confirm the specific categories are accepted by PayMongo before enabling checkout. Do not automatically publish the entire supplier catalog.

## Next phases (not implemented yet)

1. Add Supabase-backed shop listing configuration, PHP retail prices, and admin approvals (server-side, access-controlled).
2. Add customer sign-in, orders, and secure checkout sessions with PayMongo after payment approval.
3. Authenticate PayMongo webhooks, confirm the amount against a stored snapshot, and implement idempotent supplier purchasing with replay protection and recovery.
4. Securely store and deliver activation links to the purchaser. Build refund/dispute/support workflows.
5. Add a navigation entry when the catalog is authorized and ready for public sale.

## Test checklist

- No API key, or empty allowlist: page renders without revealing supplier data.
- Valid key plus approved ID(s): only approved products appear.
- Invalid/revoked key: safe public error state, no credential leakage.
- Inventory not orderable/unpriced/out of stock: unavailable badge.
- Search and availability filters behave correctly on mobile and desktop.
- No payment, supplier order, or secret key is reachable from the client.
