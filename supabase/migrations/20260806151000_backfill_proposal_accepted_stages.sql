-- Backfill pipeline stages for leads whose proposal was already accepted.
update public.leads as l
set stage = 'proposal_accepted',
    updated_at = now()
where l.stage in (
    'proposal_sent',
    'review_completed',
    'follow_up',
    'review_booked',
    'new_inquiry'
  )
  and exists (
    select 1
    from public.proposals as p
    where p.lead_id = l.id
      and p.status = 'accepted'
  );
