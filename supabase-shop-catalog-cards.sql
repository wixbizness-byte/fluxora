-- Fluxora public shop cards. Deliberately independent from live reseller checkout and supplier orders.
create table if not exists public.shop_catalog_cards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 100),
  title text not null check (length(btrim(title)) between 2 and 160),
  description text not null default '' check (length(description) <= 3000),
  image_url text check (image_url is null or (length(image_url) <= 2048 and image_url ~ '^https://')),
  category_label text not null default 'Digital Product' check (length(btrim(category_label)) between 1 and 32),
  status_label text not null default 'Coming Soon' check (length(btrim(status_label)) between 1 and 32),
  sort_order integer not null default 100 check (sort_order between 0 and 100000),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_shop_card_has_image check (not is_published or image_url is not null)
);
create index if not exists shop_catalog_cards_public_order_idx
  on public.shop_catalog_cards (sort_order, created_at desc) where is_published;

alter table public.shop_catalog_cards enable row level security;
grant select on public.shop_catalog_cards to anon, authenticated;
grant insert, update, delete on public.shop_catalog_cards to authenticated;

create policy "Visitors read published shop cards"
  on public.shop_catalog_cards for select to anon, authenticated
  using (is_published or (select public.is_site_admin()));

create policy "Site admins create shop cards"
  on public.shop_catalog_cards for insert to authenticated
  with check ((select public.is_site_admin()));

create policy "Site admins update shop cards"
  on public.shop_catalog_cards for update to authenticated
  using ((select public.is_site_admin()))
  with check ((select public.is_site_admin()));

create policy "Site admins delete shop cards"
  on public.shop_catalog_cards for delete to authenticated
  using ((select public.is_site_admin()));

-- Private write access; public image URLs only for uploaded covers.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shop-product-covers','shop-product-covers',true,10485760,
        array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;

create policy "Visitors can read shop card covers"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'shop-product-covers');

create policy "Site admins upload shop card covers"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'shop-product-covers' and (select public.is_site_admin()));

create policy "Site admins update shop card covers"
  on storage.objects for update to authenticated
  using (bucket_id = 'shop-product-covers' and (select public.is_site_admin()))
  with check (bucket_id = 'shop-product-covers' and (select public.is_site_admin()));

create policy "Site admins delete shop card covers"
  on storage.objects for delete to authenticated
  using (bucket_id = 'shop-product-covers' and (select public.is_site_admin()));
