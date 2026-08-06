-- Client share links for agreements (view + typed-name signature).

alter table public.agreements
  add column if not exists share_token text;

create unique index if not exists agreements_share_token_uidx
  on public.agreements (share_token)
  where share_token is not null;
