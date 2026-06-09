-- Prodelar RH
-- Employee profile history support: timeline and document metadata.

alter table public.hr_employee_timeline_events
  add column if not exists source text not null default 'manual',
  add column if not exists event_status text not null default 'active',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.hr_employee_documents
  add column if not exists status text not null default 'active',
  add column if not exists document_number text,
  add column if not exists issuer text,
  add column if not exists validation_status text not null default 'pending',
  add column if not exists validated_by uuid references public.hr_profiles(id),
  add column if not exists validated_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists hr_employee_timeline_events_employee_date_idx
  on public.hr_employee_timeline_events (employee_id, event_date desc, created_at desc);

create index if not exists hr_employee_documents_employee_status_idx
  on public.hr_employee_documents (employee_id, status, created_at desc);

drop policy if exists authenticated_read_employee_timeline_events on public.hr_employee_timeline_events;
create policy authenticated_read_employee_timeline_events
on public.hr_employee_timeline_events for select to authenticated
using (true);

drop policy if exists authenticated_insert_employee_timeline_events on public.hr_employee_timeline_events;
create policy authenticated_insert_employee_timeline_events
on public.hr_employee_timeline_events for insert to authenticated
with check (true);

drop policy if exists authenticated_read_employee_documents on public.hr_employee_documents;
create policy authenticated_read_employee_documents
on public.hr_employee_documents for select to authenticated
using (true);

