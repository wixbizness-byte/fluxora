-- FLUXORA WEBSITE CONTENT SCHEMA
-- Run this entire file in Supabase Dashboard > SQL Editor.
-- It stores Cloudinary image URLs only; the actual images remain in Cloudinary.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- ADMIN ACCESS
-- ---------------------------------------------------------------------------
create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.site_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

-- Admins may confirm only their own admin record from the browser.
drop policy if exists "Admins can read their own admin record" on public.site_admins;
create policy "Admins can read their own admin record"
on public.site_admins
for select
to authenticated
using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- COMMON UPDATED_AT TRIGGER
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- LEGACY SITE SETTINGS (kept for backward compatibility)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id text primary key default 'main',
  follow_page_label text not null default 'Follow our Page',
  follow_page_url text not null default '',
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = 'main')
);

alter table public.site_settings enable row level security;

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- HERO FLOATING IMAGE CARDS
-- ---------------------------------------------------------------------------
create table if not exists public.hero_media_cards (
  id uuid primary key default gen_random_uuid(),
  image_url text not null default '',
  target_url text not null default '',
  alt_text text not null default '',
  motion text not null default 'up-right'
    check (motion in ('up-right', 'down-right', 'up-left', 'down-left', 'vertical', 'horizontal')),
  sort_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hero_media_cards_active_order_idx
on public.hero_media_cards (is_active, sort_order);

alter table public.hero_media_cards enable row level security;

drop trigger if exists set_hero_media_cards_updated_at on public.hero_media_cards;
create trigger set_hero_media_cards_updated_at
before update on public.hero_media_cards
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- COLLECTION CARDS: 9:16 IMAGE BACKGROUNDS + TOP OVERLAY CONTENT
-- ---------------------------------------------------------------------------
create table if not exists public.collection_cards (
  id uuid primary key default gen_random_uuid(),
  eyebrow text not null default 'CATEGORY',
  title text not null default 'New collection',
  description text not null default '',
  button_label text not null default 'View item',
  button_url text not null default '',
  image_url text not null default '',
  is_featured boolean not null default false,
  sort_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists collection_cards_active_order_idx
on public.collection_cards (is_active, sort_order);

alter table public.collection_cards enable row level security;

drop trigger if exists set_collection_cards_updated_at on public.collection_cards;
create trigger set_collection_cards_updated_at
before update on public.collection_cards
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- THREE-ROW VISUAL ARCHIVE: UP TO 10 ACTIVE 2:3 IMAGES PER ROW
-- ---------------------------------------------------------------------------
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null default '',
  target_url text not null default '',
  alt_text text not null default '',
  row_position text not null default 'top'
    check (row_position in ('top', 'middle', 'bottom')),
  sort_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

alter table public.gallery_images enable row level security;

drop trigger if exists set_gallery_images_updated_at on public.gallery_images;
create trigger set_gallery_images_updated_at
before update on public.gallery_images
for each row execute function public.set_updated_at();

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

-- ---------------------------------------------------------------------------
-- OPTIONAL IMPROVEMENTS QR RESOURCE
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- METHOD CARDS: 9:16 IMAGE BACKGROUNDS + TOP OVERLAY CONTENT
-- ---------------------------------------------------------------------------
create table if not exists public.method_cards (
  id uuid primary key default gen_random_uuid(),
  step_number text not null default '01',
  eyebrow text not null default 'STEP',
  title text not null default 'New method step',
  description text not null default '',
  button_label text not null default 'Learn more',
  button_url text not null default '',
  image_url text not null default '',
  sort_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists method_cards_active_order_idx
on public.method_cards (is_active, sort_order);

alter table public.method_cards enable row level security;

drop trigger if exists set_method_cards_updated_at on public.method_cards;
create trigger set_method_cards_updated_at
before update on public.method_cards
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS POLICIES
-- Public visitors can read active website content.
-- Authenticated users listed in site_admins can create, edit, and delete content.
-- ---------------------------------------------------------------------------

do $$
declare
  table_name text;
begin
  foreach table_name in array array['hero_media_cards', 'collection_cards', 'gallery_images', 'method_cards', 'qr_resources']
  loop
    execute format('drop policy if exists "Public can read active %1$s" on public.%1$I', table_name);
    execute format(
      'create policy "Public can read active %1$s" on public.%1$I for select to anon, authenticated using (is_active = true)',
      table_name
    );

    execute format('drop policy if exists "Admins can read all %1$s" on public.%1$I', table_name);
    execute format(
      'create policy "Admins can read all %1$s" on public.%1$I for select to authenticated using ((select public.is_site_admin()))',
      table_name
    );

    execute format('drop policy if exists "Admins can insert %1$s" on public.%1$I', table_name);
    execute format(
      'create policy "Admins can insert %1$s" on public.%1$I for insert to authenticated with check ((select public.is_site_admin()))',
      table_name
    );

    execute format('drop policy if exists "Admins can update %1$s" on public.%1$I', table_name);
    execute format(
      'create policy "Admins can update %1$s" on public.%1$I for update to authenticated using ((select public.is_site_admin())) with check ((select public.is_site_admin()))',
      table_name
    );

    execute format('drop policy if exists "Admins can delete %1$s" on public.%1$I', table_name);
    execute format(
      'create policy "Admins can delete %1$s" on public.%1$I for delete to authenticated using ((select public.is_site_admin()))',
      table_name
    );
  end loop;
end $$;

-- Site settings policies
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert site settings" on public.site_settings;
create policy "Admins can insert site settings"
on public.site_settings for insert
to authenticated
with check ((select public.is_site_admin()));

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
on public.site_settings for update
to authenticated
using ((select public.is_site_admin()))
with check ((select public.is_site_admin()));

-- Explicit Data API grants
grant usage on schema public to anon, authenticated;
grant select on public.site_settings, public.hero_media_cards, public.collection_cards, public.gallery_images, public.method_cards, public.qr_resources to anon;
grant select, insert, update, delete on public.site_settings, public.hero_media_cards, public.collection_cards, public.gallery_images, public.method_cards, public.qr_resources to authenticated;
grant select on public.site_admins to authenticated;

-- ---------------------------------------------------------------------------
-- STARTER CONTENT
-- Existing content is preserved because every insert uses ON CONFLICT / guards.
-- ---------------------------------------------------------------------------
insert into public.site_settings (id, follow_page_label, follow_page_url)
values ('main', 'Follow our Page', 'https://www.facebook.com/meimeidigitalAI')
on conflict (id) do nothing;

insert into public.hero_media_cards (alt_text, motion, sort_order)
select seed.alt_text, seed.motion, seed.sort_order
from (values
  ('Fluxora hero image one', 'vertical', 1),
  ('Fluxora hero image two', 'horizontal', 2),
  ('Fluxora hero image three', 'horizontal', 3),
  ('Fluxora hero image four', 'vertical', 4)
) as seed(alt_text, motion, sort_order)
where not exists (select 1 from public.hero_media_cards);

insert into public.collection_cards (eyebrow, title, description, button_label, button_url, is_featured, sort_order)
select seed.eyebrow, seed.title, seed.description, seed.button_label, seed.button_url, seed.is_featured, seed.sort_order
from (values
  ('COMMUNITY', 'AI Creator Community', 'A practical space for shared experiments, helpful feedback, and creators turning ideas into consistent output.', 'Join community', 'https://t.me/PHAICommunity', false, 1),
  ('LESSONS', 'AI Workshop', 'Practical lessons, guided workshops, and repeatable creative systems for building stronger AI content.', 'Enter workshop', 'https://curzzo.com/communities/ai-content-creation-academy', true, 2),
  ('GALLERY', 'Prompt Gallery', 'Discover, study, copy, and adapt the prompts behind standout community visuals.', 'Check gallery', 'https://fluxora-prompt-gallery.vercel.app/', false, 3),
  ('TOOLS', 'Automation Tools', 'Tools, workflows, and GPTs organized as one evolving creative operating system.', 'View tools', 'https://tool-directory-ochre.vercel.app/', false, 4)
) as seed(eyebrow, title, description, button_label, button_url, is_featured, sort_order)
where not exists (select 1 from public.collection_cards);

insert into public.gallery_images (alt_text, row_position, sort_order)
select
  'Fluxora gallery image ' || n,
  case when n <= 3 then 'top' when n <= 6 then 'middle' else 'bottom' end,
  ((n - 1) % 3) + 1
from generate_series(1, 9) as n
where not exists (select 1 from public.gallery_images);

insert into public.qr_resources (alt_text, sort_order)
select 'Fluxora additional resource QR code', 1
where not exists (select 1 from public.qr_resources);

insert into public.method_cards (step_number, eyebrow, title, description, button_label, button_url, sort_order)
select seed.step_number, seed.eyebrow, seed.title, seed.description, seed.button_label, seed.button_url, seed.sort_order
from (values
  ('01', 'DIRECTION', 'Choose your direction', 'Start with the outcome you need: a sharper idea, a faster process, or a finished creative asset.', 'Explore the vault', '#products', 1),
  ('02', 'SYSTEM', 'Use the system', 'Follow a practical workflow with the right tool and a focused GPT already mapped to each step.', 'View the method', '#gallery', 2),
  ('03', 'IMPROVE', 'Ship and improve', 'Create the first strong version, learn from the response, then reuse the system without rebuilding it.', 'Get access', '#pricing', 3)
) as seed(step_number, eyebrow, title, description, button_label, button_url, sort_order)
where not exists (select 1 from public.method_cards);

-- ---------------------------------------------------------------------------
-- ONE-TIME ADMIN SETUP
-- 1. In Supabase Dashboard > Authentication > Users, create your email/password user.
-- 2. Replace the email below, remove the leading "--", and run that one statement.
-- ---------------------------------------------------------------------------
-- insert into public.site_admins (user_id)
-- select id from auth.users where lower(email) = lower('YOUR_ADMIN_EMAIL@example.com')
-- on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- CURRENT FIXED ARCHIVE, SIMPLE ACCESS, AND EASY PAYMENTS CONFIGURATION
-- This final block brings a fresh project to the current website structure.
-- ---------------------------------------------------------------------------
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
    E'Prompts\nTools\nCustom GPTs\nCourses\nWeb Access',
    'Choose Premium',
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
    E'Prompts+\nTools+\nCustom GPTs+\nCourses+\nWorkflows\nWeb Access+\nSecret Methods',
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
