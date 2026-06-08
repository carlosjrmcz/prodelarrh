-- Prodelar RH
-- Hierarchy and master-data fields for permissions.
-- Permission should be driven by explicit employee links, not by job title text.

alter table public.hr_employees
  add column if not exists supervisor_employee_id uuid references public.hr_employees(id),
  add column if not exists leadership_level text not null default 'employee'
    check (leadership_level in ('employee', 'supervisor', 'manager', 'director', 'hr'));

alter table public.hr_departments
  add column if not exists supervisor_employee_id uuid references public.hr_employees(id),
  add column if not exists manager_employee_id uuid references public.hr_employees(id),
  add column if not exists director_employee_id uuid references public.hr_employees(id);

alter table public.hr_companies
  add column if not exists director_employee_id uuid references public.hr_employees(id);

create index if not exists hr_employees_supervisor_idx
  on public.hr_employees (supervisor_employee_id);

create index if not exists hr_employees_manager_idx
  on public.hr_employees (manager_employee_id);

create index if not exists hr_employees_cpf_idx
  on public.hr_employees (cpf);

create or replace view public.hr_employee_directory as
select
  e.id,
  e.employee_code,
  e.full_name,
  e.status,
  e.admission_date,
  e.termination_date,
  e.leadership_level,
  c.name as company_name,
  d.name as department_name,
  p.name as position_name,
  s.full_name as supervisor_name,
  m.full_name as manager_name
from public.hr_employees e
left join public.hr_companies c on c.id = e.company_id
left join public.hr_departments d on d.id = e.department_id
left join public.hr_positions p on p.id = e.position_id
left join public.hr_employees s on s.id = e.supervisor_employee_id
left join public.hr_employees m on m.id = e.manager_employee_id;

create or replace view public.hr_leadership_scope as
select
  e.id as employee_id,
  e.full_name as employee_name,
  e.company_id,
  e.department_id,
  e.supervisor_employee_id,
  s.full_name as supervisor_name,
  e.manager_employee_id,
  m.full_name as manager_name
from public.hr_employees e
left join public.hr_employees s on s.id = e.supervisor_employee_id
left join public.hr_employees m on m.id = e.manager_employee_id;
