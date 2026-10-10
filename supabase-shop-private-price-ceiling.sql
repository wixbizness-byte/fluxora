-- Wholesale ceiling stays private; comparison uses exactly the supplier API price unit.
alter table public.shop_private_products
  add column if not exists max_supplier_price numeric(18,6)
  check (max_supplier_price is null or (max_supplier_price > 0 and max_supplier_price <= 100000000));
comment on column public.shop_private_products.max_supplier_price is
  'Private per-item cost ceiling in supplier API price units; NULL = checkout unavailable (fail closed)';
