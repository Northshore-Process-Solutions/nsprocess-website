-- Add proposal_accepted between proposal_sent and deposit_received.

alter table public.leads drop constraint if exists leads_stage_check;

alter table public.leads
  add constraint leads_stage_check
  check (
    stage in (
      'new_inquiry',
      'follow_up',
      'review_booked',
      'review_completed',
      'proposal_sent',
      'proposal_accepted',
      'deposit_received',
      'won',
      'lost'
    )
  );
