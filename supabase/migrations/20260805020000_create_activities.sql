create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid references public.organizations (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete cascade,

  activity_type text not null
    check (activity_type in ('email', 'call', 'meeting', 'note', 'other')),
  subject text,
  body text,
  occurred_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint activities_has_target check (
    organization_id is not null or lead_id is not null
  )
);

create index if not exists activities_organization_id_idx
  on public.activities (organization_id, occurred_at desc);

create index if not exists activities_lead_id_idx
  on public.activities (lead_id, occurred_at desc);

create index if not exists activities_occurred_at_idx
  on public.activities (occurred_at desc);

alter table public.activities enable row level security;

create policy "Authenticated users can manage activities"
on public.activities
for all
to authenticated
using (true)
with check (true);
