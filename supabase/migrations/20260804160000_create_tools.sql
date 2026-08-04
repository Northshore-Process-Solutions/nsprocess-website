create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  category text,
  website text,
  admin_url text,
  account_email text,
  plan text,

  billing_amount numeric(12,2),
  billing_cadence text not null default 'monthly'
    check (billing_cadence in ('monthly', 'yearly', 'one_time', 'usage', 'free')),

  renewal_date date,
  status text not null default 'active'
    check (status in ('active', 'trial', 'inactive', 'cancelled', 'replacing')),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tools_name_idx on public.tools (name);
create index if not exists tools_status_idx on public.tools (status);
create index if not exists tools_category_idx on public.tools (category);

alter table public.tools enable row level security;

create policy "Authenticated users can manage tools"
on public.tools
for all
to authenticated
using (true)
with check (true);
