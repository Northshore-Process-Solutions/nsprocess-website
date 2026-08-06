# Interactive CRM Demo Sandbox

Public visitors can open `/demo`, describe their business, and get a private
CRM walkthrough seeded by AI from **their** point of view: they are the company
operator. Pipeline leads are their customers; projects are their jobs.

## Same UI as live CRM

Demo routes under `/demo` mount the **same portal UI components** as `/crm`
(`AdminShell`, `LeadsPanel`, `CrmPanel`, billing panels, `ProjectDetail`, etc.).
Only the data source differs: each session reads typed seed JSON from
`public.demo_sessions`, mapped through `lib/demo/map-to-crm.ts`. Mutations are
disabled or read-only for now — save/delete/create actions are hidden or no-op
in demo mode.

Intake lives at `/demo/start`. After a ready session, home is `/demo`.

## Isolation guarantees

1. **Session-scoped** — each visitor gets a signed `nsps_demo_session` cookie and one `demo_sessions` row.
2. **Concurrent-safe** — every read/write is keyed by that session id; demos never share seed payloads.
3. **Production-safe** — live CRM tables are never written. Demo data lives only in `public.demo_sessions` and is accessible only with the service role.
4. **Cleanup** — **End demo**, leaving `/demo` (e.g. Book a review), and closing/refreshing the tab call `POST /api/demo/end` (or the end server action) to delete the row and clear the cookie. Expired rows are also purged on demo start and via `/api/demo/purge`.

## Required env vars

- `SUPABASE_SERVICE_ROLE_KEY` — server-only; used exclusively by demo sandbox code
  - Supabase Dashboard → Project Settings → API → `service_role` (secret)
  - Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY=...`
  - Add the same value in Vercel → Project Settings → Environment Variables (Production + Preview)
  - Restart `npm run dev` after adding it locally
  - Never prefix with `NEXT_PUBLIC_`
- `OPENAI_API_KEY` — required to build demo seed data (no silent template fallback)
  - Add to `.env.local` and Vercel env vars
  - Demo seed uses `gpt-4.1` via `getDemoSeedModel()`
- `DEMO_SESSION_SECRET` — optional; signs the demo cookie (falls back to service role key)
- `DEMO_PURGE_SECRET` — optional; required as `Authorization: Bearer …` for `/api/demo/purge`

## Flow

1. Marketing CTA → `/demo` (redirects to `/demo/start` if no session)
2. Intake form at `/demo/start` → create `building` session + cookie
3. AI `generateObject` builds a typed seed (pipeline, billing, projects, events)
4. Session marked `ready` → `/demo` (portal home)
5. Visitor explores the same tabs as the live portal: Home, Pipeline, Businesses, Billing, Projects, Calendar, Purchases, Stack — with click-through detail pages
6. Session expires after 3 hours, or visitor clicks **End demo**
7. Optional cron hits `POST /api/demo/purge` to delete expired rows

Demo pages send `Cache-Control: private, no-store` (and Vercel CDN no-store)
so personalized portal HTML is never shared across visitors or incognito
sessions. Start/End demo use hard navigations to avoid App Router client cache.

## What this is not

- Not wired to live Supabase CRM tables for reads or writes
- Not demo-specific PDF routes (PDF links hidden in demo tables)
- Not e-sign / Stripe / live email from the sandbox
- Not shared “Demo Co” data for all visitors
