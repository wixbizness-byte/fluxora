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
-- TOP BANNER SETTINGS
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
-- AUTOMATIC SIDE-SCROLLING GALLERY: UP TO 10 ACTIVE 2:3 IMAGES
-- ---------------------------------------------------------------------------
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null default '',
  target_url text not null default '',
  alt_text text not null default '',
  sort_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gallery_images_active_order_idx
on public.gallery_images (is_active, sort_order);

alter table public.gallery_images enable row level security;

drop trigger if exists set_gallery_images_updated_at on public.gallery_images;
create trigger set_gallery_images_updated_at
before update on public.gallery_images
for each row execute function public.set_updated_at();

create or replace function public.enforce_ten_active_gallery_images()
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
      and id <> new.id;

    if active_count >= 10 then
      raise exception 'Only 10 active gallery images are allowed.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_gallery_image_limit on public.gallery_images;
create trigger enforce_gallery_image_limit
before insert or update of is_active on public.gallery_images
for each row execute function public.enforce_ten_active_gallery_images();

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
  foreach table_name in array array['hero_media_cards', 'collection_cards', 'gallery_images', 'method_cards']
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
grant select on public.site_settings, public.hero_media_cards, public.collection_cards, public.gallery_images, public.method_cards to anon;
grant select, insert, update, delete on public.site_settings, public.hero_media_cards, public.collection_cards, public.gallery_images, public.method_cards to authenticated;
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

insert into public.gallery_images (alt_text, sort_order)
select 'Fluxora gallery image ' || n, n
from generate_series(1, 6) as n
where not exists (select 1 from public.gallery_images);

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
