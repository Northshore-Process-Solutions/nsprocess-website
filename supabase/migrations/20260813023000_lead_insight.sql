-- Structured AI lead insight (sales briefing), separate from spam flag.

alter table public.leads
  add column if not exists lead_insight jsonb,
  add column if not exists insight_generated_at timestamptz;

comment on column public.leads.lead_insight is
  'AI sales briefing: companySnapshot, fit, talkingPoints, nextStep, risks.';

comment on column public.leads.insight_generated_at is
  'When lead_insight was last generated.';
