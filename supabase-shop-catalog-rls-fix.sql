-- Split public and admin SELECT policies: anon must not evaluate is_site_admin(),
-- whose EXECUTE privilege is deliberately restricted to authenticated users.
drop policy if exists "Visitors read published shop cards" on public.shop_catalog_cards;
create policy "Public can read published shop cards" on public.shop_catalog_cards
  for select to anon, authenticated using (is_published = true);
create policy "Site admins can read all shop cards" on public.shop_catalog_cards
  for select to authenticated using ((select public.is_site_admin()));
