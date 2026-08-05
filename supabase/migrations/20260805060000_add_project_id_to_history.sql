-- Link delivery history to projects after lead → customer convert.

alter table public.activities
  add column if not exists project_id uuid
    references public.projects (id) on delete set null;

alter table public.calendar_events
  add column if not exists project_id uuid
    references public.projects (id) on delete set null;

create index if not exists activities_project_id_idx
  on public.activities (project_id, occurred_at desc);

create index if not exists calendar_events_project_id_idx
  on public.calendar_events (project_id, starts_at);

alter table public.activities
  drop constraint if exists activities_has_target;

alter table public.activities
  add constraint activities_has_target check (
    organization_id is not null
    or lead_id is not null
    or project_id is not null
  );

alter table public.calendar_events
  drop constraint if exists calendar_events_has_target;

alter table public.calendar_events
  add constraint calendar_events_has_target check (
    organization_id is not null
    or lead_id is not null
    or project_id is not null
  );

-- Attach existing lead history to projects created from those leads.
update public.activities as a
set
  project_id = p.id,
  organization_id = coalesce(a.organization_id, p.organization_id),
  updated_at = now()
from public.projects as p
where p.lead_id is not null
  and a.lead_id = p.lead_id
  and a.project_id is null;

update public.calendar_events as e
set
  project_id = p.id,
  organization_id = coalesce(e.organization_id, p.organization_id),
  updated_at = now()
from public.projects as p
where p.lead_id is not null
  and e.lead_id = p.lead_id
  and e.project_id is null;
