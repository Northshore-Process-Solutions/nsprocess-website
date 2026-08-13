-- Track automated unpaid-invoice reminder emails.

alter table public.invoices
  add column if not exists payment_nudge_sent_at timestamptz;

comment on column public.invoices.payment_nudge_sent_at is
  'When the last automated unpaid payment reminder email was sent.';
