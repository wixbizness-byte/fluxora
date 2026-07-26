-- Run this once only if the earlier schema created five hero rows.
-- It keeps the first four rows active and hides any extra hero rows.
update public.hero_media_cards
set is_active = false
where sort_order > 4;
