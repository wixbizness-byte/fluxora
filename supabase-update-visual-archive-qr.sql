-- FLUXORA EXISTING PROJECT UPDATE
-- Run this once in Supabase Dashboard > SQL Editor before deploying this website version.
-- It upgrades the visual archive to three rows and adds the Optional Improvements QR resource.

do $$
declare
  row_column_was_missing boolean;
begin
  select not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'gallery_images'
      and column_name = 'row_position'
  ) into row_column_was_missing;

  alter table public.gallery_images
    add column if not exists row_position text not null default 'top';

  if row_column_was_missing then
    with ranked as (
      select id, row_number() over (order by sort_order, created_at, id) as row_number
      from public.gallery_images
    )
    update public.gallery_images as gallery
    set row_position = case ((ranked.row_number - 1) % 3)
      when 0 then 'top'
      when 1 then 'middle'
      else 'bottom'
    end
    from ranked
    where gallery.id = ranked.id;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'gallery_images_row_position_check'
      and conrelid = 'public.gallery_images'::regclass
  ) then
    alter table public.gallery_images
      add constraint gallery_images_row_position_check
      check (row_position in ('top', 'middle', 'bottom'));
  end if;
end $$;

create index if not exists gallery_images_active_row_order_idx
on public.gallery_images (is_active, row_position, sort_order);

drop trigger if exists enforce_gallery_image_limit on public.gallery_images;
drop function if exists public.enforce_ten_active_gallery_images();

create or replace function public.enforce_ten_active_gallery_images_per_row()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  active_count integer;
begin
  if new.is_active then
    select count(*) into active_count
    from public.gallery_images
    where is_active = true
      and row_position = new.row_position
      and id <> new.id;

    if active_count >= 10 then
      raise exception 'Only 10 active gallery images are allowed in each row.';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_gallery_image_limit
before insert or update of is_active, row_position on public.gallery_images
for each row execute function public.enforce_ten_active_gallery_images_per_row();

create table if not exists public.qr_resources (
  id uuid primary key default gen_random_uuid(),
  image_url text not null default '',
  target_url text not null default '',
  alt_text text not null default 'Fluxora additional resource QR code',
  sort_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qr_resources_active_order_idx
on public.qr_resources (is_active, sort_order);

alter table public.qr_resources enable row level security;

drop trigger if exists set_qr_resources_updated_at on public.qr_resources;
create trigger set_qr_resources_updated_at
before update on public.qr_resources
for each row execute function public.set_updated_at();

drop policy if exists "Public can read active qr_resources" on public.qr_resources;
create policy "Public can read active qr_resources"
on public.qr_resources for select to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can read all qr_resources" on public.qr_resources;
create policy "Admins can read all qr_resources"
on public.qr_resources for select to authenticated
using ((select public.is_site_admin()));

drop policy if exists "Admins can insert qr_resources" on public.qr_resources;
create policy "Admins can insert qr_resources"
on public.qr_resources for insert to authenticated
with check ((select public.is_site_admin()));

drop policy if exists "Admins can update qr_resources" on public.qr_resources;
create policy "Admins can update qr_resources"
on public.qr_resources for update to authenticated
using ((select public.is_site_admin()))
with check ((select public.is_site_admin()));

drop policy if exists "Admins can delete qr_resources" on public.qr_resources;
create policy "Admins can delete qr_resources"
on public.qr_resources for delete to authenticated
using ((select public.is_site_admin()));

grant select on public.qr_resources to anon;
grant select, insert, update, delete on public.qr_resources to authenticated;

insert into public.qr_resources (alt_text, sort_order)
select 'Fluxora additional resource QR code', 1
where not exists (select 1 from public.qr_resources);
