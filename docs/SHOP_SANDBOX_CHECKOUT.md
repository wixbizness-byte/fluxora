# Fluxora shop — PayMongo sandbox + simulated delivery

This feature extends the gated read-only /shop branch (PR #91) with an isolated test-mode purchase flow.

## Implemented
- `/shop/demo` — fixed PHP 100 *sandbox-only* sample of Google AI Pro 18 Months (not a real product sale).
- `POST /api/shop/checkout` — signed-in Fluxora tester → store buyer email and test order → create a PayMongo **v2** Checkout Session using a `sk_test_` key.
- `POST /api/shop/paymongo-webhook` — verify HMAC-SHA256 `Paymongo-Signature` (`te`, not `li`), reject live events, correlate checkout session, order ID, paid amount and currency, and atomically transition from `awaiting_payment` to `demo_delivered`.
- `/shop/orders` — buyer-only list, polls every 10 seconds after redirection; a demo link appears only after a verified sandbox paid event.
- Demo fulfillment is a nonredeemable `example.com` URL. **It is never a real activation**. No Warzone purchase calls are used.
- Orders are stored in a separate `public.shop_demo_orders` Supabase table with RLS enabled and no anon/authenticated privileges. This cannot update existing Fluxora membership orders.

## Preflight setup — do not paste secret values into chat or commit them
All variables below should be created on **Vercel Preview for feature branch `feature/warzone-shop-catalog-20261009`**, never as `NEXT_PUBLIC_*`:

| Variable | What to enter |
| --- | --- |
| `SHOP_SANDBOX_ENABLED` | `true` (already set for preview branch) |
| `PAYMONGO_TEST_SECRET_KEY` | PayMongo `sk_test_...` from Settings → Developers |
| `PAYMONGO_TEST_WEBHOOK_SECRET` | Secret from the *test-mode webhook* registered below |
| `SUPABASE_SERVICE_ROLE_KEY` | Your existing Supabase project's server-only service-role key, from Supabase API settings |
| `SHOP_TEST_ALLOWED_EMAILS` | Optional comma-separated tester Gmail accounts; Fluxora portal admins can test without it |

`NEXT_PUBLIC_SUPABASE_URL` already exists on Fluxora. Don't grant public RLS access, and do not confuse the publishable key with the service-role secret.

### PayMongo webhook
Register a **test-mode** webhook in PayMongo Settings → Webhooks:

```
https://<PREVIEW_DEPLOYMENT_HOST>/api/shop/paymongo-webhook
```

Subscribe to `checkout_session.payment.paid` only. Each Vercel preview deployment has its own host. For consistent testing use a stable preview alias if available; the webhook URL must point to the active deployment.

### Test checklist
1. Sign into the preview's Fluxora Google member session. If the login returns to the production domain rather than the preview host, cookie sharing may require adjusting the auth flow before this test can proceed.
2. Visit `/shop/demo` and choose PayMongo test checkout. **Do not use live money or keys.**
3. Complete PayMongo's documented simulated QR Ph test payment.
4. Return to `/shop/orders`; verify the order stays pending until a *signed webhook* marks it delivered.
5. Confirm the delivered URL uses `example.com` and is clearly invalid.
6. Attempt anonymous order-history access — expect HTTP 401 and no links.
7. Replay the exact paid webhook after the first delivery — order remains one delivery.
8. Send an unsigned or altered webhook, one with `livemode: true`, another order's session ID, or the wrong amount — no delivery.
9. Check the existing `/checkout` membership payment flow remains unchanged.

## Important limitations
- Sandbox is **hard-disabled** when `VERCEL_ENV=production`, even if somebody sets the test secrets there.
- There is no production payment processing, Warzone API purchasing, redeemable license fulfillment, automatic refunding, or resale-rights verification.
- PayMongo approval for the eventual product category and proof of valid resale authorization are prerequisites for switching to real products.
- Setup requires the two PayMongo test secrets and a Supabase server key; no sandbox transaction can run before these are added and a new deployment is built.
