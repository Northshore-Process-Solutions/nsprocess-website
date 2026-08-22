-- Agreement-specific AI drafting instructions.

alter table public.app_settings
  add column if not exists ai_agreement_instructions text;

comment on column public.app_settings.ai_agreement_instructions is
  'Extra instructions for AI agreement drafting only.';
