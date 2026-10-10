# Fluxora Shop — PayMongo setup

Production checkout stays disabled. This branch is a test-only integration until merchant-category approval and end-to-end verification.

## Already configured
- Product price: PHP 100.00.
- Private supplier-cost ceiling: USD 1.20.
- Admin forms for Terms and Conditions and post-purchase instructions: /admin/shop.
- Supplier service mapping and cost remain in a private Supabase table.
- Branch-scoped Vercel Preview variable SHOP_PAYMENT_MODE=test.

## Configure the test environment
1. In the PayMongo Dashboard, open Settings > Developers, find the secret test API key.
2. In Vercel > Fluxora > Settings > Environment Variables, use Preview, Git branch feature/shop-private-checkout-20261010. Add encrypted variables:
   - PAYMONGO_TEST_SECRET_KEY = secret test key
   - PAYMONGO_TEST_WEBHOOK_SECRET = test endpoint signing secret (after webhook creation)
   - SUPABASE_SERVICE_ROLE_KEY = Supabase backend-only service-role key
   - WARZONE_API_KEY is already present as a server-side variable.
3. Redeploy the Preview branch after adding variables.
4. Confirm a READY Preview deployment, copy its HTTPS origin, and in the *PayMongo test-mode* dashboard create a webhook for `https://<preview-host>/api/shop/paymongo-webhook`, subscribing only to `checkout_session.payment.paid`.
5. Save the new webhook signing secret in Vercel Preview and redeploy.
6. Write product terms and post-purchase instructions in /admin/shop; save each section separately.
7. Test a checkout using PayMongo test payment methods, returning to /shop/orders. Successful simulated payments are test_paid and never cause an actual supplier purchase. Verify cancellation, duplicate webhook, invalid webhook signature and price-cap blocks.

## Production release gates
- Written PayMongo approval of digital subscription-link resale and valid distribution rights.
- Verified product duration and redemption terms.
- Implement/verify refunds, failed fulfillment handling, webhook idempotency and customer order recovery.
- Reviewed and merged checkout code; successful test end-to-end.
- In Vercel **Production** configure server-only PAYMONGO_LIVE_SECRET_KEY, PAYMONGO_LIVE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY and WARZONE_API_KEY.
- Register a separate live webhook at https://www.fluxora.wiki/api/shop/paymongo-webhook.
- Only then, with explicit approval, enable SHOP_LIVE_SALES_ENABLED=true and checkout_enabled=true. Do not enable these now.

PayMongo documentation:
https://docs.paymongo.com/docs/payment-channels-hosted-checkout-quick-start
https://docs.paymongo.com/docs/creating-a-webhook-endpoint
https://docs.paymongo.com/docs/developer-tools-webhook-setup-management
