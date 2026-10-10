-- Allow only authorized Fluxora admins to edit private presentation settings.
-- This never grants access to supplier mapping or order/activation records.
revoke all on table public.shop_private_products from anon, authenticated;
grant select (product_id, delivery_instructions, max_supplier_price)
  on table public.shop_private_products to authenticated;
grant update (delivery_instructions, max_supplier_price, updated_at)
  on table public.shop_private_products to authenticated;

drop policy if exists "Shop admins inspect private presentation settings" on public.shop_private_products;
create policy "Shop admins inspect private presentation settings"
on public.shop_private_products for select to authenticated
using ((select public.is_site_admin()));

drop policy if exists "Shop admins edit private presentation settings" on public.shop_private_products;
create policy "Shop admins edit private presentation settings"
on public.shop_private_products for update to authenticated
using ((select public.is_site_admin()))
with check ((select public.is_site_admin()));
