-- Split AI custom instructions by feature (proposal vs email reply).

alter table public.app_settings
  add column if not exists ai_proposal_instructions text,
  add column if not exists ai_reply_instructions text;

-- Preserve any previously saved shared instructions into both feature fields.
update public.app_settings
set
  ai_proposal_instructions = coalesce(
    ai_proposal_instructions,
    ai_custom_instructions
  ),
  ai_reply_instructions = coalesce(
    ai_reply_instructions,
    ai_custom_instructions
  )
where ai_custom_instructions is not null
  and (
    ai_proposal_instructions is null
    or ai_reply_instructions is null
  );

alter table public.app_settings
  drop column if exists ai_custom_instructions;

comment on column public.app_settings.ai_proposal_instructions is
  'Extra instructions for AI proposal drafting only.';

comment on column public.app_settings.ai_reply_instructions is
  'Extra instructions for AI email reply drafting only.';
