-- Invoice online payment (Stripe Checkout) share tokens.

alter table public.invoices
  add column if not exists share_token text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text;

create unique index if not exists invoices_share_token_uidx
  on public.invoices (share_token)
  where share_token is not null;

comment on column public.invoices.share_token is
  'Public token for client pay page (/i/[token]).';

comment on column public.invoices.stripe_checkout_session_id is
  'Latest Stripe Checkout session id for this invoice.';

comment on column public.invoices.stripe_payment_intent_id is
  'Stripe PaymentIntent id recorded when checkout completes.';
