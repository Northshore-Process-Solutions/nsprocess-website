create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid references public.organizations (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete cascade,

  title text not null,
  event_type text not null
    check (event_type in ('consult', 'onsite', 'call', 'follow_up', 'other')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint calendar_events_has_target check (
    organization_id is not null or lead_id is not null
  ),
  constraint calendar_events_ends_after_starts check (
    ends_at is null or ends_at >= starts_at
  )
);

create index if not exists calendar_events_starts_at_idx
  on public.calendar_events (starts_at);

create index if not exists calendar_events_lead_id_idx
  on public.calendar_events (lead_id, starts_at);

create index if not exists calendar_events_organization_id_idx
  on public.calendar_events (organization_id, starts_at);

alter table public.calendar_events enable row level security;

create policy "Authenticated users can manage calendar events"
on public.calendar_events
for all
to authenticated
using (true)
with check (true);
