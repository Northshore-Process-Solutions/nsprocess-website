# North Shore Process Solutions Website

Production website and brand system for **North Shore Process Solutions**, a Business Efficiency Partner helping small businesses get their time back.

- **Live URL:** https://nsprocess.com
- **Stack:** Next.js, TypeScript, Tailwind CSS, shadcn-style components, Lucide Icons, Framer Motion
- **Primary CTA:** Book a Free Process Review

## Local Development

Install dependencies, then start the dev server:

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## Checks

```bash
npm run typecheck
npm run build
```

## Admin CRM

Internal CRM lives at `/admin` and reads from the Supabase project **NSPS - Admin Portal**.

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Create an admin user in the Supabase dashboard under **Authentication → Users → Add user**, then sign in at `/admin/login`.

Admin sections:

- `/admin` — CRM for customers, leads, vendors, and partners
- `/admin/tools` — internal stack/tools your business depends on (Supabase, GitHub, Vercel, etc.)

## Brand System

See `BRAND.md` for the logo concept, color palette, typography, copy voice, iconography, illustration direction, spacing scale, and component guidance.

## Deploy

This app is ready for Vercel or any host that supports Next.js.

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Add the custom domain `nsprocess.com`.
4. Update DNS at the domain registrar.
