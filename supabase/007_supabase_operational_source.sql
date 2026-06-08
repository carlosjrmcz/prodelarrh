-- Prodelar RH
-- Source-of-truth operational tables for the production app.
-- Local folders are only inbox/staging for imports; the app should read from Supabase.

create table if not exists public.hr_monthly_routines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.hr_companies(id),
  competence_month date not null,
  routine_key text not null,
  routine_name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'file_selected', 'processing', 'processed', 'failed', 'skipped')),
  source_mode text not null default 'manual'
    check (source_mode in ('manual', 'folder_scan', 'upload', 'system')),
  storage_bucket text,
  storage_path text,
  original_file_name text,
  processed_count integer not null default 0,
  rejected_count integer not null default 0,
  last_error text,
  processed_by uuid references public.hr_profiles(id),
  processed_at timestamptz,
  raw_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, competence_month, routine_key)
);

create table if not exists public.hr_point_adjustment_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  company_id uuid references public.hr_companies(id),
  department_id uuid references public.hr_departments(id),
  requester_profile_id uuid references public.hr_profiles(id),
  current_owner_employee_id uuid references public.hr_employees(id),
  current_owner_role text not null default 'supervisor',
  work_date date not null,
  reason text not null,
  requested_entry time,
  requested_lunch_start time,
  requested_lunch_end time,
  requested_exit time,
  comment text,
  status text not null default 'pending_supervisor'
    check (status in (
      'pending_supervisor',
      'pending_manager',
      'pending_rh',
      'waiting_information',
      'sent_to_time_clock',
      'rejected',
      'cancelled'
    )),
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_monthly_point_reviews (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  company_id uuid references public.hr_companies(id),
  department_id uuid references public.hr_departments(id),
  competence_month date not null,
  current_owner_employee_id uuid references public.hr_employees(id),
  current_owner_role text not null default 'supervisor',
  storage_bucket text,
  storage_path text,
  original_file_name text,
  status text not null default 'pending_supervisor'
    check (status in ('pending_supervisor', 'pending_manager', 'pending_rh', 'sent_to_time_clock', 'returned', 'cancelled')),
  last_comment text,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, competence_month)
);

create table if not exists public.hr_vacation_change_events (
  id uuid primary key default gen_random_uuid(),
  vacation_period_id uuid not null references public.hr_vacation_periods(id) on delete cascade,
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  company_id uuid references public.hr_companies(id),
  previous_planned_start date,
  previous_planned_end date,
  new_planned_start date,
  new_planned_end date,
  source text not null default 'manual'
    check (source in ('monthly_import', 'manual', 'employee_request', 'leader_update')),
  status text not null default 'pending_supervisor'
    check (status in ('pending_supervisor', 'pending_manager', 'pending_rh', 'notified_employee', 'sent_to_payroll', 'cancelled')),
  current_owner_employee_id uuid references public.hr_employees(id),
  changed_by uuid references public.hr_profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_employee_timeline_notes (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  company_id uuid references public.hr_companies(id),
  event_type text not null,
  title text not null,
  description text,
  visibility public.hr_request_visibility not null default 'internal_only',
  related_table text,
  related_record_id uuid,
  created_by uuid references public.hr_profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists hr_monthly_routines_company_month_idx
  on public.hr_monthly_routines (company_id, competence_month);

create index if not exists hr_point_adjustment_owner_idx
  on public.hr_point_adjustment_requests (current_owner_employee_id, status);

create index if not exists hr_monthly_point_reviews_owner_idx
  on public.hr_monthly_point_reviews (current_owner_employee_id, status);

create index if not exists hr_vacation_change_events_owner_idx
  on public.hr_vacation_change_events (current_owner_employee_id, status);

create index if not exists hr_employee_timeline_notes_employee_idx
  on public.hr_employee_timeline_notes (employee_id, created_at desc);

drop trigger if exists set_updated_at_hr_monthly_routines on public.hr_monthly_routines;
create trigger set_updated_at_hr_monthly_routines
before update on public.hr_monthly_routines
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_hr_point_adjustment_requests on public.hr_point_adjustment_requests;
create trigger set_updated_at_hr_point_adjustment_requests
before update on public.hr_point_adjustment_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_hr_monthly_point_reviews on public.hr_monthly_point_reviews;
create trigger set_updated_at_hr_monthly_point_reviews
before update on public.hr_monthly_point_reviews
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_hr_vacation_change_events on public.hr_vacation_change_events;
create trigger set_updated_at_hr_vacation_change_events
before update on public.hr_vacation_change_events
for each row execute function public.set_updated_at();

alter table public.hr_monthly_routines enable row level security;
alter table public.hr_point_adjustment_requests enable row level security;
alter table public.hr_monthly_point_reviews enable row level security;
alter table public.hr_vacation_change_events enable row level security;
alter table public.hr_employee_timeline_notes enable row level security;

-- Development policy used by the current MVP while authentication/RLS is finalized.
-- Replace with profile-based policies before exposing the app outside the internal test group.
do $$
declare
  t text;
begin
  foreach t in array array[
    'hr_monthly_routines',
    'hr_point_adjustment_requests',
    'hr_monthly_point_reviews',
    'hr_vacation_change_events',
    'hr_employee_timeline_notes'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', 'dev_all_' || t, t);
    execute format('create policy %I on public.%I for all using (true) with check (true)', 'dev_all_' || t, t);
  end loop;
end $$;
