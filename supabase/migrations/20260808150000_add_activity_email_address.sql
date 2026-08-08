alter table public.activities
  add column if not exists email_address text;

comment on column public.activities.email_address is
  'Counterpart email: To for sent, From for received.';
