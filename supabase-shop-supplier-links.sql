alter table public.shop_catalog_cards
  add column if not exists supplier_service_id text,
  add column if not exists supplier_url text;
alter table public.shop_catalog_cards
  drop constraint if exists published_shop_card_has_image;
alter table public.shop_catalog_cards
  add constraint shop_card_supplier_id_format
    check (supplier_service_id is null or supplier_service_id ~ '^[A-Za-z0-9_-]{1,80}$');
alter table public.shop_catalog_cards
  add constraint shop_card_supplier_url_allowlist
    check (supplier_url is null or supplier_url = 'https://t.me/WarzoneShopbot');
comment on column public.shop_catalog_cards.supplier_service_id is 'Supplier catalog reference only; never authorize purchases from this field alone';
comment on column public.shop_catalog_cards.supplier_url is 'External supplier information URL, not a Fluxora checkout endpoint';
