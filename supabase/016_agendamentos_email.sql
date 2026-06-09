-- Prodelar RH
-- Scheduled email events and worker service-role access.

alter table public.email_events
  add column if not exists priority text not null default 'normal',
  add column if not exists locked_by text,
  add column if not exists locked_at timestamptz;

create index if not exists email_events_pending_schedule_idx
  on public.email_events (status, scheduled_for, created_at)
  where status = 'pending';

drop policy if exists service_role_all_email_events on public.email_events;
create policy service_role_all_email_events
on public.email_events for all to service_role
using (true)
with check (true);

alter function public.claim_pending_email_events(integer) owner to postgres;

