# Fluxora Tally — Rebuilt Source

This is the source-controlled rebuild of the existing private Fluxora Tally dashboard.

## Preserved behavior

- Shared-password login
- Seven-day signed browser session
- Existing `public.fluxora_tally_state` row (`id = 'main'`)
- Account create/edit/delete/reorder
- Search and sort
- Configurable fields and summary totals
- Configurable statuses
- Configurable currency and decimal display
- Configurable logo and appearance

## Existing backend

The app continues using the existing Supabase project:

- Project ref: `qglayytocxhnbqmjkwnc`
- Table: `public.fluxora_tally_state`
- Row: `id = 'main'`

No database migration is required.

## Environment variables

Required:

- `SITE_PASSWORD`
- `SESSION_SECRET`
- `SUPABASE_SECRET_KEY`

Optional:

- `SUPABASE_URL` (defaults to the existing Tally project URL)

Never commit the actual secret values.

## Fluxora visual system

The rebuild follows the Fluxora Brand Preservation Kit:

- Inter typography
- Fluxora Violet `#6658E8`
- Canvas `#FAFAF8`
- White surfaces
- Standard `#E4E4E7` borders
- 8px controls / 12px cards / 16px dialogs
- restrained shadows
- no glassmorphism, neon glow, or UI gradients
- Lucide-compatible outline iconography

Run:

```bash
npm run brand:qa
npm run build
```

## Deployment migration

Do not create a new Supabase table or project.

When ready to move the existing `fluxora-tally` Vercel project to this source:

1. Link the Vercel project to the Git repository containing this folder.
2. Set the Vercel Root Directory to `fluxora-tally`.
3. Preserve the existing Production environment variables.
4. Create a Preview deployment first.
5. Verify login, dashboard read/write, account editing, settings, logo, mobile layout, and sign-out.
6. Promote only after Preview QA passes.
