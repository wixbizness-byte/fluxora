-- Independent sandbox-only order records; never touches Fluxora membership orders.
create table if not exists public.shop_demo_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_email text not null check (length(buyer_email) between 3 and 320),
  product_id text not null default 'google-ai-pro-18m-demo'
    check (product_id = 'google-ai-pro-18m-demo'),
  product_title text not null default 'Google AI Pro — 18 Months (DEMO)',
  amount_centavos integer not null default 10000 check (amount_centavos = 10000),
  currency text not null default 'PHP' check (currency = 'PHP'),
  status text not null default 'awaiting_checkout'
    check (status in ('awaiting_checkout','awaiting_payment','checkout_failed','demo_delivered')),
  checkout_session_id text unique,
  payment_id text unique,
  demo_activation_link text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demo_delivery_requires_payment check (
    status <> 'demo_delivered' or
    (payment_id is not null and paid_at is not null and demo_activation_link is not null)
  )
);

create index if not exists shop_demo_orders_buyer_created_idx
  on public.shop_demo_orders (buyer_email, created_at desc);

alter table public.shop_demo_orders enable row level security;

-- No browser token may read or write test orders.
revoke all on table public.shop_demo_orders from public, anon, authenticated;
grant all on table public.shop_demo_orders to service_role;

comment on table public.shop_demo_orders is
  'Sandbox checkout only; fake, nonredeemable delivery link. Not real supplier inventory. No customer-direct RLS policies.';
