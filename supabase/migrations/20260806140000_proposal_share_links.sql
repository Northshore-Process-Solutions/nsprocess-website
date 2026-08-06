-- Client share links for proposals (view + accept/decline with comment).

alter table public.proposals
  add column if not exists share_token text,
  add column if not exists client_response text,
  add column if not exists client_responded_at timestamptz,
  add column if not exists declined_at timestamptz;

create unique index if not exists proposals_share_token_uidx
  on public.proposals (share_token)
  where share_token is not null;
