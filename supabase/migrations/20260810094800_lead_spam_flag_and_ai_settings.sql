-- AI spam classification for pipeline inquiries.

alter table public.leads
  add column if not exists spam_flag boolean not null default false,
  add column if not exists spam_reason text,
  add column if not exists spam_scanned_at timestamptz;

alter table public.app_settings
  add column if not exists ai_spam_instructions text;

comment on column public.leads.spam_flag is
  'Set by AI when an inquiry looks like spam or unsolicited advertising.';

comment on column public.leads.spam_reason is
  'Short AI explanation when spam_flag is true.';

comment on column public.leads.spam_scanned_at is
  'When AI last classified this lead for spam.';

comment on column public.app_settings.ai_spam_instructions is
  'Extra instructions for AI spam/ad classification on new inquiries.';

create index if not exists leads_spam_flag_idx
  on public.leads (spam_flag)
  where spam_flag = true;
