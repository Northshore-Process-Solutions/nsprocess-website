-- AI feature preferences for proposal drafting and related assistants.

alter table public.app_settings
  add column if not exists ai_industry text,
  add column if not exists ai_custom_instructions text;

comment on column public.app_settings.ai_industry is
  'Short description of what the company sells / industry for AI drafts.';

comment on column public.app_settings.ai_custom_instructions is
  'Extra instructions appended to AI system prompts (not a full prompt replace).';
