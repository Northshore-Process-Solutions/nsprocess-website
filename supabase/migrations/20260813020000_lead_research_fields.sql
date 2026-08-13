-- Background research fields for inbound lead spam scan.

alter table public.leads
  add column if not exists research_summary text,
  add column if not exists research_sources jsonb,
  add column if not exists researched_at timestamptz;

comment on column public.leads.research_summary is
  'Short AI briefing from public website research on the lead business/domain.';

comment on column public.leads.research_sources is
  'JSON array of {url, title?} pages used for research_summary.';

comment on column public.leads.researched_at is
  'When AI last researched this lead.';
