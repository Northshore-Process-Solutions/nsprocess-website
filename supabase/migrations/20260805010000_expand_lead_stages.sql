-- Align Pipeline stages with the Free Process Review → project kickoff flow.
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
      'deposit_received',
      'won',
      'lost'
    )
  );
