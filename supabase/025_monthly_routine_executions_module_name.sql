alter table public.hr_monthly_routine_executions
  add column if not exists module_name text;

create index if not exists idx_hr_monthly_routine_executions_module
  on public.hr_monthly_routine_executions (module_name, competence_month);
