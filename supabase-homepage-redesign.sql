-- Fluxora homepage redesign content controls.
-- Idempotent companion migration for the deployed homepage redesign.

create table if not exists public.homepage_tool_previews (
  id uuid primary key default gen_random_uuid(),
  badge text not null default 'TOOL',
  title text not null default 'Tool preview',
  description text not null default '',
  image_url text not null default '',
  button_label text not null default 'Open tool',
  button_url text not null default '/tools',
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homepage_tool_previews_sort_order_check check (sort_order between 1 and 3),
  constraint homepage_tool_previews_sort_order_unique unique (sort_order)
);

create table if not exists public.homepage_faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null default 'Question',
  answer text not null default '',
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homepage_faqs_sort_order_check check (sort_order between 1 and 5),
  constraint homepage_faqs_sort_order_unique unique (sort_order)
);

alter table public.homepage_tool_previews enable row level security;
alter table public.homepage_faqs enable row level security;

drop trigger if exists set_homepage_tool_previews_updated_at on public.homepage_tool_previews;
create trigger set_homepage_tool_previews_updated_at before update on public.homepage_tool_previews for each row execute function public.set_updated_at();
drop trigger if exists set_homepage_faqs_updated_at on public.homepage_faqs;
create trigger set_homepage_faqs_updated_at before update on public.homepage_faqs for each row execute function public.set_updated_at();

drop policy if exists "Public can read active homepage tool previews" on public.homepage_tool_previews;
create policy "Public can read active homepage tool previews" on public.homepage_tool_previews for select to anon, authenticated using (is_active = true);
drop policy if exists "Admins can read all homepage tool previews" on public.homepage_tool_previews;
create policy "Admins can read all homepage tool previews" on public.homepage_tool_previews for select to authenticated using ((select public.is_site_admin()));
drop policy if exists "Admins can update homepage tool previews" on public.homepage_tool_previews;
create policy "Admins can update homepage tool previews" on public.homepage_tool_previews for update to authenticated using ((select public.is_site_admin())) with check ((select public.is_site_admin()));

drop policy if exists "Public can read active homepage faqs" on public.homepage_faqs;
create policy "Public can read active homepage faqs" on public.homepage_faqs for select to anon, authenticated using (is_active = true);
drop policy if exists "Admins can read all homepage faqs" on public.homepage_faqs;
create policy "Admins can read all homepage faqs" on public.homepage_faqs for select to authenticated using ((select public.is_site_admin()));
drop policy if exists "Admins can update homepage faqs" on public.homepage_faqs;
create policy "Admins can update homepage faqs" on public.homepage_faqs for update to authenticated using ((select public.is_site_admin())) with check ((select public.is_site_admin()));

grant select on public.homepage_tool_previews, public.homepage_faqs to anon;
grant select, update on public.homepage_tool_previews, public.homepage_faqs to authenticated;

create or replace function public.enforce_ten_active_gallery_images_per_row()
returns trigger language plpgsql set search_path = public as $$
declare active_count integer;
begin
  if new.is_active then
    select count(*) into active_count from public.gallery_images where is_active = true and row_position = new.row_position and id <> new.id;
    if active_count >= 6 then raise exception 'Only 6 active gallery images are allowed in each row.'; end if;
  end if;
  return new;
end;
$$;
