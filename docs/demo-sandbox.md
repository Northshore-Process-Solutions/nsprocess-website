# Interactive CRM Demo Sandbox

Public visitors can open `/demo`, describe their business, and get a private
CRM walkthrough seeded by AI from **their** point of view: they are the company
operator. Pipeline leads are their customers; projects are their jobs.

## Isolation guarantees

1. **Session-scoped** — each visitor gets a signed `nsps_demo_session` cookie and one `demo_sessions` row.
2. **Concurrent-safe** — every read/write is keyed by that session id; demos never share seed payloads.
3. **Production-safe** — live CRM tables are never written. Demo data lives only in `public.demo_sessions` and is accessible only with the service role.

## Required env vars

- `SUPABASE_SERVICE_ROLE_KEY` — server-only; used exclusively by demo sandbox code
  - Supabase Dashboard → Project Settings → API → `service_role` (secret)
  - Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY=...`
  - Add the same value in Vercel → Project → Settings → Environment Variables (Production + Preview)
  - Restart `npm run dev` after adding it locally
  - Never prefix with `NEXT_PUBLIC_`
- `OPENAI_API_KEY` — seeds the demo (falls back to a local template if generation fails)
- `DEMO_SESSION_SECRET` — optional; signs the demo cookie (falls back to service role key)
- `DEMO_PURGE_SECRET` — optional; required as `Authorization: Bearer …` for `/api/demo/purge`

## Flow

1. Marketing CTA → `/demo`
2. Intake form → create `building` session + cookie
3. AI `generateObject` builds a typed seed (pipeline, billing, projects, events)
4. Session marked `ready` → `/demo/home`
5. Visitor explores the same tabs as the live portal: Home, Pipeline, Businesses, Billing, Projects, Calendar, Purchases, Stack — with click-through detail pages
6. Session expires after 3 hours, or visitor clicks **End demo**
7. Optional cron hits `POST /api/demo/purge` to delete expired rows

## What this is not

- Not a full clone of every CRM editor
- Not e-sign / Stripe / live email from the sandbox
- Not shared “Demo Co” data for all visitors
