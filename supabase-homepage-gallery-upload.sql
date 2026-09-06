alter table public.gallery_images
  add column if not exists cta_label text not null default 'View prompt';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'homepage-media',
  'homepage-media',
  true,
  10485760,
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload homepage media" on storage.objects;
create policy "Admins can upload homepage media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'homepage-media' and (select public.is_site_admin()));

drop policy if exists "Admins can update homepage media" on storage.objects;
create policy "Admins can update homepage media"
on storage.objects for update
to authenticated
using (bucket_id = 'homepage-media' and (select public.is_site_admin()))
with check (bucket_id = 'homepage-media' and (select public.is_site_admin()));

drop policy if exists "Admins can delete homepage media" on storage.objects;
create policy "Admins can delete homepage media"
on storage.objects for delete
to authenticated
using (bucket_id = 'homepage-media' and (select public.is_site_admin()));

drop policy if exists "Public can read homepage media" on storage.objects;
create policy "Public can read homepage media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'homepage-media');
