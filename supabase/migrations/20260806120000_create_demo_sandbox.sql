-- Interactive demo sandbox. Production CRM routes must never query this table.
-- Kept in public so PostgREST can reach it via service role; RLS blocks anon/authenticated.
create table if not exists public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null check (status in ('building', 'ready', 'error')),
  intake jsonb not null default '{}'::jsonb,
  seed jsonb,
  error text
);

create index if not exists demo_sessions_expires_at_idx on public.demo_sessions (expires_at);
create index if not exists demo_sessions_status_idx on public.demo_sessions (status);

alter table public.demo_sessions enable row level security;

revoke all on table public.demo_sessions from public;
revoke all on table public.demo_sessions from anon, authenticated;
grant all on table public.demo_sessions to service_role;

comment on table public.demo_sessions is 'Interactive demo sandbox sessions. Never queried by production CRM routes. Accessible only via service role.';
