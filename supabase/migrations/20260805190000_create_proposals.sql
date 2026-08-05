create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),

  proposal_number text not null unique,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'declined', 'expired')),

  lead_id uuid references public.leads (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,

  client_business_name text not null,
  client_contact_name text,
  client_email text,
  client_phone text,

  issued_at date not null default (timezone('America/New_York', now()))::date,
  valid_until date,

  scope_summary text,
  terms text,
  notes text,
  deposit_percent numeric(5, 2)
    check (deposit_percent is null or (deposit_percent >= 0 and deposit_percent <= 100)),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),

  sent_at timestamptz,
  accepted_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  description text not null,
  quantity numeric(12, 2) not null default 1 check (quantity >= 0),
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  line_total numeric(12, 2) not null default 0 check (line_total >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists proposals_status_idx
  on public.proposals (status);

create index if not exists proposals_issued_at_idx
  on public.proposals (issued_at desc);

create index if not exists proposals_lead_id_idx
  on public.proposals (lead_id);

create index if not exists proposals_organization_id_idx
  on public.proposals (organization_id);

create index if not exists proposal_items_proposal_id_idx
  on public.proposal_items (proposal_id, sort_order);

alter table public.proposals enable row level security;
alter table public.proposal_items enable row level security;

create policy "Authenticated users can manage proposals"
on public.proposals
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can manage proposal items"
on public.proposal_items
for all
to authenticated
using (true)
with check (true);
