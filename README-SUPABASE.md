# Fluxora Supabase setup

## Current layout notes

- The fixed top banner contains only the **Follow Our Page** button.
- The Fluxora navigation/header scrolls normally with the page.
- Hero media uses four editable 2:3 cards with staggered directional motion.
- Collection cards use 16:9 media and Method cards use 3:2 media.


1. Open your existing Supabase project.
2. Go to **SQL Editor**, paste the full contents of `supabase-schema.sql`, and run it.
3. Go to **Authentication → Users** and create an email/password user for the admin panel.
4. Run the final one-time `insert into public.site_admins ...` statement in `supabase-schema.sql` after replacing the placeholder email.
5. Copy `.env.example` to `.env.local` and paste your project URL and publishable key.
6. Run `npm install`, then `npm run dev`.
7. Open `/admin`, sign in, and paste your Cloudinary delivery URLs into the image fields.

The browser uses only the public/publishable Supabase key. Do not place a secret or service-role key in any `NEXT_PUBLIC_` variable. Row Level Security allows public visitors to read active content and allows only users registered in `site_admins` to edit it.

## Hero card order
The public hero displays the first four active hero rows ordered by `sort_order`:
1. Top-left card moves down.
2. Top-right card moves left.
3. Bottom-left card moves right.
4. Bottom-right card moves up.


## Current display ratios

- Hero floating cards: 2:3
- Collection cards: 16:9
- Side-scrolling gallery: 2:3
- Fluxora Method cards: 3:2
