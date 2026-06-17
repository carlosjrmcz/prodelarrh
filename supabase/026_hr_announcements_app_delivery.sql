alter table public.hr_announcements
  add column if not exists target_employee_id uuid references public.hr_employees(id),
  add column if not exists template_key text,
  add column if not exists delivery_channel text default 'app',
  add column if not exists payload jsonb default '{}'::jsonb,
  add column if not exists status text default 'published';

create index if not exists idx_hr_announcements_target_employee
  on public.hr_announcements(target_employee_id);

create index if not exists idx_hr_announcements_template_key
  on public.hr_announcements(template_key);
