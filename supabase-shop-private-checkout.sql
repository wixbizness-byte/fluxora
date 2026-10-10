-- Separate public product content from private supplier mappings and fulfillment.
create table if not exists public.shop_private_products (
  product_id uuid primary key references public.shop_catalog_cards(id) on delete cascade,
  supplier_service_id text not null check(supplier_service_id ~ '^[A-Za-z0-9_-]{1,80}$'),
  delivery_instructions text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.shop_private_products enable row level security;
revoke all on public.shop_private_products from PUBLIC, anon, authenticated;
grant all on public.shop_private_products to service_role;

insert into public.shop_private_products(product_id,supplier_service_id,delivery_instructions)
select id, 'S_01', '' from public.shop_catalog_cards
where slug='google-ai-pro-18-months'
on conflict(product_id) do update set supplier_service_id=excluded.supplier_service_id;

alter table public.shop_catalog_cards add column if not exists terms_text text not null default '';
alter table public.shop_catalog_cards add column if not exists price_centavos integer
  check(price_centavos is null or (price_centavos between 100 and 100000000));
alter table public.shop_catalog_cards add column if not exists checkout_enabled boolean not null default false;
alter table public.shop_catalog_cards add constraint shop_card_terms_length
  check (length(terms_text) <= 15000);
update public.shop_catalog_cards set
  terms_text = '', description='', status_label='Coming Soon',
  checkout_enabled=false, price_centavos=null
where slug='google-ai-pro-18-months';

-- Remove names and supplier references from a publicly SELECT-able table entirely.
alter table public.shop_catalog_cards drop column if exists supplier_service_id;
alter table public.shop_catalog_cards drop column if exists supplier_url;

create table if not exists public.shop_customer_orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.shop_catalog_cards(id),
  buyer_token_hash text not null check(length(buyer_token_hash)=64),
  buyer_email text,
  product_title text not null,
  terms_snapshot text not null,
  delivery_instructions_snapshot text not null,
  price_centavos integer not null check(price_centavos>0),
  currency text not null default 'PHP' check(currency='PHP'),
  status text not null default 'created' check(status in ('created','awaiting_payment','checkout_failed','paid','fulfilling','delivered','needs_review')),
  paymongo_session_id text unique,
  paymongo_payment_id text unique,
  supplier_order_id text,
  activation_link text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  delivered_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists shop_customer_orders_buyer_idx on public.shop_customer_orders(buyer_token_hash,created_at desc);
alter table public.shop_customer_orders enable row level security;
revoke all on public.shop_customer_orders from PUBLIC, anon, authenticated;
grant all on public.shop_customer_orders to service_role;