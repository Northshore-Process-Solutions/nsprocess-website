-- Lightweight project management fields + tasks.

alter table public.projects
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high'));

alter table public.projects
  add column if not exists target_end_at date;

alter table public.projects
  add column if not exists next_action text;

alter table public.projects
  add column if not exists next_action_at date;

alter table public.projects
  add column if not exists scope text;

create index if not exists projects_priority_idx
  on public.projects (priority);

create index if not exists projects_next_action_at_idx
  on public.projects (next_action_at);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  due_at date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_tasks_project_id_idx
  on public.project_tasks (project_id, is_done, sort_order, created_at);

create index if not exists project_tasks_due_at_idx
  on public.project_tasks (due_at)
  where is_done = false;

alter table public.project_tasks enable row level security;

create policy "Authenticated users can manage project tasks"
on public.project_tasks
for all
to authenticated
using (true)
with check (true);
