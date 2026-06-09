-- Prodelar RH
-- Employee profile history support: timeline and document metadata.

create table if not exists public.hr_employee_timeline (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  event_type text not null,
  module_name text not null,
  title text not null,
  description text,
  related_table text,
  related_record_id uuid,
  status text,
  metadata jsonb default '{}'::jsonb,
  created_by uuid references public.hr_profiles(id),
  created_at timestamptz default now()
);

create index if not exists idx_timeline_employee
  on public.hr_employee_timeline (employee_id);

create index if not exists idx_timeline_event_type
  on public.hr_employee_timeline (event_type);

create index if not exists idx_timeline_created
  on public.hr_employee_timeline (created_at desc);

alter table public.hr_employee_timeline enable row level security;

drop policy if exists authenticated_only on public.hr_employee_timeline;
create policy authenticated_only
on public.hr_employee_timeline for all to authenticated
using (true)
with check (true);

create or replace function public.register_timeline_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  return new;
end;
$$;

alter table public.hr_employee_timeline_events
  add column if not exists source text not null default 'manual',
  add column if not exists event_status text not null default 'active',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.hr_employee_documents
  add column if not exists document_type text,
  add column if not exists description text,
  add column if not exists file_name text,
  add column if not exists file_url text,
  add column if not exists drive_file_id text,
  add column if not exists file_size_bytes bigint,
  add column if not exists mime_type text,
  add column if not exists validity_date date,
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

create index if not exists idx_docs_employee
  on public.hr_employee_documents (employee_id);

create index if not exists idx_docs_type
  on public.hr_employee_documents (document_type);

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
