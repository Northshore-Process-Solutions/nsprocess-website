alter table public.activities
  add column if not exists email_direction text
  check (
    email_direction is null
    or email_direction in ('sent', 'received')
  );

update public.activities
set email_direction = 'sent'
where activity_type = 'email'
  and email_direction is null;

alter table public.activities
  drop constraint if exists activities_email_direction_matches_type;

alter table public.activities
  add constraint activities_email_direction_matches_type
  check (
    (activity_type = 'email' and email_direction in ('sent', 'received'))
    or (activity_type <> 'email' and email_direction is null)
  );
