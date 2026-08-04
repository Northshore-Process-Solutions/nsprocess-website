create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid references public.organizations(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,

  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text,

  title text not null default 'Free Process Review',
  source text not null default 'manual'
    check (source in ('website_form', 'referral', 'manual', 'other')),
  stage text not null default 'new_inquiry'
    check (stage in (
      'new_inquiry',
      'review_booked',
      'review_completed',
      'proposal_sent',
      'won',
      'lost'
    )),

  message text,
  notes text,
  next_follow_up_at date,
  lost_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_stage_idx on public.leads (stage);
create index if not exists leads_source_idx on public.leads (source);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_email_idx on public.leads (email);

alter table public.leads enable row level security;

create policy "Authenticated users can manage leads"
on public.leads
for all
to authenticated
using (true)
with check (true);

create policy "Public can submit website leads"
on public.leads
for insert
to anon, authenticated
with check (
  source = 'website_form'
  and stage = 'new_inquiry'
);
