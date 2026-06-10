create table if not exists public.hr_scheduled_communications (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  employee_id uuid references public.hr_employees(id),
  recorrencia text not null,
  proximo_envio date not null,
  payload jsonb default '{}',
  ativo boolean default true,
  created_by uuid references public.hr_profiles(id),
  created_at timestamptz default now()
);

alter table public.hr_scheduled_communications enable row level security;

drop policy if exists authenticated_only on public.hr_scheduled_communications;
create policy authenticated_only
on public.hr_scheduled_communications
for all to authenticated
using (true)
with check (true);
