# Fluxora Supabase setup

## Existing Supabase project

Run `supabase-update-fixed-archive-access-payments.sql` once in **Supabase Dashboard → SQL Editor** before deploying this version.

It:

- Fixes the Visual Archive at six editable slots in each of the Top, Middle, and Bottom rows.
- Preserves the first six existing images in each row and keeps additional old rows inactive.
- Adds the fixed Premium and Creator cards used in Simple Access.
- Adds the editable Easy Payments copy, GCash number, QR Cloudinary URL, and optional QR click link.
- Preserves the QR image/link from the previous `qr_resources` table when one exists.
- Adds the required RLS policies and Data API grants.

## New Supabase project

1. Open your Supabase project.
2. Go to **SQL Editor**, paste the full contents of `supabase-schema.sql`, and run it.
3. Go to **Authentication → Users** and create an email/password user for the admin panel.
4. Run the final one-time `insert into public.site_admins ...` statement in `supabase-schema.sql` after replacing the placeholder email.
5. Copy `.env.example` to `.env.local` and paste your project URL and publishable key.
6. Run `npm install`, then `npm run dev`.
7. Open `/admin` and sign in.

## Admin content

The admin panel manages:

- Collection cards
- Visual Archive: six fixed Top slots, six fixed Middle slots, and six fixed Bottom slots
- Simple Access: fixed Premium and Creator cards
- Easy Payments: heading, description, GCash details, QR image, and QR destination

The Visual Archive directions are:

- Top row: moves left
- Middle row: moves right
- Bottom row: moves left

Each archive slot uses a 2:3 display ratio. The public gallery repeats the six configured cards continuously so wide screens do not show empty gaps. Hidden slots are filled by repeating the remaining visible cards. Uploaded images are shown in full without cropping.

Supabase stores only Cloudinary URLs and configuration. The actual images remain in Cloudinary.

The browser uses only the public/publishable Supabase key. Never place a service-role key in a `NEXT_PUBLIC_` variable. Row Level Security allows visitors to read active content and only users registered in `site_admins` to update fixed content.
