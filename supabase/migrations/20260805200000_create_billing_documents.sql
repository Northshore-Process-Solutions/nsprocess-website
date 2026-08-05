-- Agreements
create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  agreement_number text not null unique,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'signed', 'void')),
  proposal_id uuid references public.proposals (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  client_business_name text not null,
  client_contact_name text,
  client_email text,
  client_phone text,
  issued_at date not null default (timezone('America/New_York', now()))::date,
  scope_summary text,
  terms text,
  notes text,
  deposit_percent numeric(5, 2)
    check (deposit_percent is null or (deposit_percent >= 0 and deposit_percent <= 100)),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  signer_name text,
  signed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agreement_items (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.agreements (id) on delete cascade,
  description text not null,
  quantity numeric(12, 2) not null default 1 check (quantity >= 0),
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  line_total numeric(12, 2) not null default 0 check (line_total >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  title text not null,
  invoice_type text not null default 'other'
    check (invoice_type in ('deposit', 'progress', 'final', 'other')),
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'void')),
  agreement_id uuid references public.agreements (id) on delete set null,
  proposal_id uuid references public.proposals (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  client_business_name text not null,
  client_contact_name text,
  client_email text,
  client_phone text,
  issued_at date not null default (timezone('America/New_York', now()))::date,
  due_at date,
  notes text,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  amount_paid numeric(12, 2) not null default 0 check (amount_paid >= 0),
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  quantity numeric(12, 2) not null default 1 check (quantity >= 0),
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  line_total numeric(12, 2) not null default 0 check (line_total >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists agreements_status_idx on public.agreements (status);
create index if not exists agreements_proposal_id_idx on public.agreements (proposal_id);
create index if not exists agreements_organization_id_idx on public.agreements (organization_id);
create index if not exists agreement_items_agreement_id_idx
  on public.agreement_items (agreement_id, sort_order);

create index if not exists invoices_status_idx on public.invoices (status);
create index if not exists invoices_issued_at_idx on public.invoices (issued_at desc);
create index if not exists invoices_organization_id_idx on public.invoices (organization_id);
create index if not exists invoices_agreement_id_idx on public.invoices (agreement_id);
create index if not exists invoice_items_invoice_id_idx
  on public.invoice_items (invoice_id, sort_order);

alter table public.agreements enable row level security;
alter table public.agreement_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

create policy "Authenticated users can manage agreements"
on public.agreements for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage agreement items"
on public.agreement_items for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage invoices"
on public.invoices for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage invoice items"
on public.invoice_items for all to authenticated using (true) with check (true);
