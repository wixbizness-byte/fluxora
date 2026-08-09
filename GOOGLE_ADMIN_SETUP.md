# Fluxora Main Admin — Google Sign-In setup

The `/admin` code can now initiate Google OAuth through the same Supabase Auth project already used by Fluxora Main.

Before promoting the `main-admin-google` branch:

1. Open the Supabase project used by `NEXT_PUBLIC_SUPABASE_URL`.
2. Go to **Authentication → Providers → Google**.
3. Enable Google and enter the Google OAuth Web Client ID + Client Secret.
4. Copy the Supabase callback URL shown there (it ends in `/auth/v1/callback`).
5. Add that exact Supabase callback URL to the Google Cloud OAuth client's **Authorized redirect URIs**.
6. In **Authentication → URL Configuration** set/add:
   - Site URL: `https://www.fluxora.wiki`
   - Redirect URL: `https://www.fluxora.wiki/admin`
   - Redirect URL: `https://fluxora.wiki/admin`
7. Keep the existing `public.site_admins` row. Supabase automatically links OAuth identities that use the same verified email address to the same Supabase user, preserving the existing user ID in the normal same-email case.

Do not remove the current email/password Auth user until Google login has been verified in production.
