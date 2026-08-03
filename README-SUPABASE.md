# Fluxora Supabase setup

## Existing Supabase project

Run `supabase-update-visual-archive-qr.sql` once in **Supabase Dashboard → SQL Editor** before deploying this version. It:

- Adds `row_position` to the existing `gallery_images` table.
- Allows up to 10 active gallery cards in each row: Top, Middle, and Bottom.
- Adds the `qr_resources` table used by the Optional Improvements panel.
- Adds the required RLS policies and browser API grants.

## New Supabase project

1. Open your Supabase project.
2. Go to **SQL Editor**, paste the full contents of `supabase-schema.sql`, and run it.
3. Go to **Authentication → Users** and create an email/password user for the admin panel.
4. Run the final one-time `insert into public.site_admins ...` statement in `supabase-schema.sql` after replacing the placeholder email.
5. Copy `.env.example` to `.env.local` and paste your project URL and publishable key.
6. Run `npm install`, then `npm run dev`.
7. Open `/admin` and sign in.

## Admin content

The admin panel now manages:

- Collection cards
- Visual Archive cards
- Optional Improvements QR code

For the Visual Archive, each card has a Cloudinary image URL, optional click URL, visibility toggle, row assignment, and sort order. The public directions are:

- Top row: moves left
- Middle row: moves right
- Bottom row: moves left

All archive cards use a 2:3 display ratio. The QR image is also stored as a Cloudinary delivery URL; Supabase stores only the URL and configuration.

The browser uses only the public/publishable Supabase key. Never place a service-role key in a `NEXT_PUBLIC_` variable. Row Level Security allows visitors to read active content and only users registered in `site_admins` to edit it.
