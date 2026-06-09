-- Prodelar RH
-- Monthly HR routines and task tracking.

alter table public.hr_monthly_routines
  add column if not exists due_date date,
  add column if not exists owner_profile_id uuid references public.hr_profiles(id),
  add column if not exists priority text not null default 'normal',
  add column if not exists checklist jsonb not null default '[]'::jsonb,
  add column if not exists notes text;

create table if not exists public.hr_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.hr_companies(id),
  employee_id uuid references public.hr_employees(id) on delete set null,
  routine_id uuid references public.hr_monthly_routines(id) on delete set null,
  title text not null,
  description text,
  task_type text not null default 'general',
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'critical')),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'waiting', 'done', 'cancelled')),
  due_date date,
  assigned_to uuid references public.hr_profiles(id),
  created_by uuid references public.hr_profiles(id),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hr_tasks_status_due_idx
  on public.hr_tasks (status, due_date);

create index if not exists hr_tasks_employee_idx
  on public.hr_tasks (employee_id, created_at desc);

drop trigger if exists set_updated_at_hr_tasks on public.hr_tasks;
create trigger set_updated_at_hr_tasks
before update on public.hr_tasks
for each row execute function public.set_updated_at();

alter table public.hr_tasks enable row level security;

drop policy if exists authenticated_all_hr_tasks on public.hr_tasks;
create policy authenticated_all_hr_tasks
on public.hr_tasks for all to authenticated
using (true)
with check (true);

