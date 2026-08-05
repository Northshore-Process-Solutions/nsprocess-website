create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  purchase_type text not null default 'other'
    check (purchase_type in ('promo', 'equipment', 'supplies', 'other')),
  amount numeric(12, 2) not null check (amount >= 0),
  purchased_at date not null default (timezone('America/New_York', now()))::date,
  quantity numeric(12, 2) default 1 check (quantity is null or quantity >= 0),

  organization_id uuid references public.organizations (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchases_purchased_at_idx
  on public.purchases (purchased_at desc);

create index if not exists purchases_purchase_type_idx
  on public.purchases (purchase_type);

create index if not exists purchases_project_id_idx
  on public.purchases (project_id, purchased_at desc);

create index if not exists purchases_organization_id_idx
  on public.purchases (organization_id, purchased_at desc);

alter table public.purchases enable row level security;

create policy "Authenticated users can manage purchases"
on public.purchases
for all
to authenticated
using (true)
with check (true);
