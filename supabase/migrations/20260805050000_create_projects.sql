create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null references public.organizations (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,

  name text not null,
  status text not null default 'active'
    check (status in ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  started_at date,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_organization_id_idx
  on public.projects (organization_id, created_at desc);

create index if not exists projects_lead_id_idx
  on public.projects (lead_id);

create index if not exists projects_status_idx
  on public.projects (status);

alter table public.projects enable row level security;

create policy "Authenticated users can manage projects"
on public.projects
for all
to authenticated
using (true)
with check (true);
