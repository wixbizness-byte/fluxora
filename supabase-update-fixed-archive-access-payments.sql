-- FLUXORA CURRENT WEBSITE UPDATE
-- Run this once in Supabase Dashboard > SQL Editor before deploying this version.
-- It fixes the Visual Archive at six slots per row and adds editable Simple Access
-- and Easy Payments settings.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- FIXED VISUAL ARCHIVE: 6 SLOTS PER ROW
-- Existing images are preserved in their row where possible. Any rows after the
-- first six are kept inactive outside the fixed slot range.
-- ---------------------------------------------------------------------------

alter table public.gallery_images
  add column if not exists row_position text not null default 'top';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gallery_images_row_position_check'
      and conrelid = 'public.gallery_images'::regclass
  ) then
    alter table public.gallery_images
      add constraint gallery_images_row_position_check
      check (row_position in ('top', 'middle', 'bottom'));
  end if;
end $$;

drop trigger if exists enforce_gallery_image_limit on public.gallery_images;
drop function if exists public.enforce_ten_active_gallery_images();
drop function if exists public.enforce_ten_active_gallery_images_per_row();
drop function if exists public.enforce_six_gallery_slots_per_row();

drop index if exists public.gallery_images_fixed_slot_idx;

with ranked as (
  select
    id,
    row_number() over (
      partition by row_position
      order by sort_order, created_at, id
    ) as row_number
  from public.gallery_images
)
update public.gallery_images as gallery
set
  sort_order = case
    when ranked.row_number <= 6 then ranked.row_number
    else 100 + ranked.row_number
  end,
  is_active = case
    when ranked.row_number <= 6 then gallery.is_active and btrim(gallery.image_url) <> ''
    else false
  end
from ranked
where gallery.id = ranked.id;

insert into public.gallery_images (
  image_url,
  target_url,
  alt_text,
  row_position,
  sort_order,
  is_active
)
select
  '',
  '',
  initcap(slot.row_position) || ' visual archive image ' || slot.slot_number,
  slot.row_position,
  slot.slot_number,
  false
from (
  select row_position, slot_number
  from unnest(array['top', 'middle', 'bottom']) as row_position
  cross join generate_series(1, 6) as slot_number
) as slot
where not exists (
  select 1
  from public.gallery_images existing
  where existing.row_position = slot.row_position
    and existing.sort_order = slot.slot_number
);

create unique index if not exists gallery_images_fixed_slot_idx
on public.gallery_images (row_position, sort_order)
where sort_order between 1 and 6;

create index if not exists gallery_images_active_row_order_idx
on public.gallery_images (is_active, row_position, sort_order);

create or replace function public.enforce_six_gallery_slots_per_row()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_active and new.sort_order not between 1 and 6 then
    raise exception 'Only the six fixed Visual Archive slots in each row can be active.';
  end if;
  return new;
end;
$$;

create trigger enforce_gallery_image_limit
before insert or update of is_active, row_position, sort_order on public.gallery_images
for each row execute function public.enforce_six_gallery_slots_per_row();

-- Keep the archive fixed from the browser admin: existing slots can be updated,
-- but new rows cannot be inserted or deleted through the public Data API.
drop policy if exists "Admins can insert gallery_images" on public.gallery_images;
drop policy if exists "Admins can delete gallery_images" on public.gallery_images;
revoke insert, delete on public.gallery_images from authenticated;
grant select, update on public.gallery_images to authenticated;

-- ---------------------------------------------------------------------------
-- SIMPLE ACCESS: FIXED PREMIUM + CREATOR CARDS
-- ---------------------------------------------------------------------------

create table if not exists public.access_plans (
  id text primary key,
  badge text not null default '',
  title text not null default '',
  description text not null default '',
  features text not null default '',
  button_label text not null default '',
  button_url text not null default '',
  variant text not null check (variant in ('premium', 'creator')),
  sort_order integer not null check (sort_order in (1, 2)),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint access_plans_fixed_id check (id in ('premium', 'creator'))
);

create unique index if not exists access_plans_fixed_order_idx
on public.access_plans (sort_order);

alter table public.access_plans enable row level security;

drop trigger if exists set_access_plans_updated_at on public.access_plans;
create trigger set_access_plans_updated_at
before update on public.access_plans
for each row execute function public.set_updated_at();

insert into public.access_plans (
  id,
  badge,
  title,
  description,
  features,
  button_label,
  button_url,
  variant,
  sort_order,
  is_active
)
values
  (
    'premium',
    'Starter',
    'Premium (₱599)',
    'Premium access. Fit for aspiring creators.',
    'Web Access',
    'Start free',
    'https://t.me/PHAICommunity',
    'premium',
    1,
    true
  ),
  (
    'creator',
    'Endgame',
    'Creator (₱1999)',
    'The full vault for building from idea to finished result.',
    E'Web Access+\nSecret Methods',
    'Choose Creator',
    'https://www.facebook.com/meimeidigitalAI',
    'creator',
    2,
    true
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- EASY PAYMENTS: FIXED TEXT, GCASH DETAILS, AND EDITABLE QR
-- ---------------------------------------------------------------------------

create table if not exists public.payment_settings (
  id text primary key default 'main',
  eyebrow text not null default 'Easy payments',
  heading text not null default 'Pay conveniently through GCash.',
  description text not null default '',
  payment_label text not null default 'GCash payment only',
  payment_number text not null default '09163211558',
  qr_image_url text not null default '',
  qr_target_url text not null default '',
  qr_alt_text text not null default 'Fluxora GCash payment QR code',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_settings_singleton check (id = 'main')
);

alter table public.payment_settings enable row level security;

drop trigger if exists set_payment_settings_updated_at on public.payment_settings;
create trigger set_payment_settings_updated_at
before update on public.payment_settings
for each row execute function public.set_updated_at();

insert into public.payment_settings (
  id,
  eyebrow,
  heading,
  description,
  payment_label,
  payment_number,
  qr_alt_text,
  is_active
)
values (
  'main',
  'Easy payments',
  'Pay conveniently through GCash.',
  '',
  'GCash payment only',
  '09163211558',
  'Fluxora GCash payment QR code',
  true
)
on conflict (id) do nothing;

-- Preserve the QR image/link from the previous qr_resources table when present.
do $$
begin
  if to_regclass('public.qr_resources') is not null then
    update public.payment_settings as settings
    set
      qr_image_url = previous.image_url,
      qr_target_url = previous.target_url,
      qr_alt_text = case
        when previous.alt_text = '' then settings.qr_alt_text
        else previous.alt_text
      end
    from (
      select image_url, target_url, alt_text
      from public.qr_resources
      where is_active = true
      order by sort_order, created_at
      limit 1
    ) as previous
    where settings.id = 'main'
      and settings.qr_image_url = '';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RLS FOR THE NEW FIXED SETTINGS TABLES
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read active access_plans" on public.access_plans;
create policy "Public can read active access_plans"
on public.access_plans for select to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can read all access_plans" on public.access_plans;
create policy "Admins can read all access_plans"
on public.access_plans for select to authenticated
using ((select public.is_site_admin()));

drop policy if exists "Admins can update access_plans" on public.access_plans;
create policy "Admins can update access_plans"
on public.access_plans for update to authenticated
using ((select public.is_site_admin()))
with check ((select public.is_site_admin()));

drop policy if exists "Public can read active payment_settings" on public.payment_settings;
create policy "Public can read active payment_settings"
on public.payment_settings for select to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can read all payment_settings" on public.payment_settings;
create policy "Admins can read all payment_settings"
on public.payment_settings for select to authenticated
using ((select public.is_site_admin()));

drop policy if exists "Admins can update payment_settings" on public.payment_settings;
create policy "Admins can update payment_settings"
on public.payment_settings for update to authenticated
using ((select public.is_site_admin()))
with check ((select public.is_site_admin()));

grant select on public.access_plans, public.payment_settings to anon;
grant select, update on public.access_plans, public.payment_settings to authenticated;
