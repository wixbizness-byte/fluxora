-- Sandbox webhook confirmation is a terminal, non-fulfillment state.
-- Never use test payments to call the upstream purchase API.
alter table public.shop_customer_orders
  drop constraint if exists shop_customer_orders_status_check;
alter table public.shop_customer_orders
  add constraint shop_customer_orders_status_check
  check (status in (
    'created','awaiting_payment','checkout_failed',
    'paid','fulfilling','delivered','needs_review','test_paid'
  ));
