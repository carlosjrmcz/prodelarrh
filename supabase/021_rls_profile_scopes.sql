drop policy if exists "authenticated_only" on public.hr_vacation_periods;
drop policy if exists "scope_by_role" on public.hr_vacation_periods;

create policy "scope_by_role"
on public.hr_vacation_periods
for select
to authenticated
using (
  employee_id = (
    select p.employee_id
    from public.hr_profiles p
    where p.id = auth.uid() or p.auth_user_id = auth.uid()
    limit 1
  )
  or exists (
    select 1
    from public.hr_profiles p
    where (p.id = auth.uid() or p.auth_user_id = auth.uid())
      and p.role_code in (
        'rh_admin',
        'gestor_rh',
        'diretoria',
        'diretor',
        'gestor',
        'supervisor',
        'gestor_financeiro'
      )
  )
);

drop policy if exists "authenticated_only" on public.hr_requests;
drop policy if exists "scope_by_role" on public.hr_requests;

create policy "scope_by_role"
on public.hr_requests
for select
to authenticated
using (
  employee_id = (
    select p.employee_id
    from public.hr_profiles p
    where p.id = auth.uid() or p.auth_user_id = auth.uid()
    limit 1
  )
  or requester_employee_id = (
    select p.employee_id
    from public.hr_profiles p
    where p.id = auth.uid() or p.auth_user_id = auth.uid()
    limit 1
  )
  or exists (
    select 1
    from public.hr_profiles p
    where (p.id = auth.uid() or p.auth_user_id = auth.uid())
      and p.role_code in (
        'rh_admin',
        'gestor_rh',
        'diretoria',
        'diretor',
        'gestor',
        'supervisor',
        'gestor_financeiro'
      )
  )
);

drop policy if exists "authenticated_only" on public.hr_employee_documents;
drop policy if exists "scope_by_role" on public.hr_employee_documents;

create policy "scope_by_role"
on public.hr_employee_documents
for select
to authenticated
using (
  employee_id = (
    select p.employee_id
    from public.hr_profiles p
    where p.id = auth.uid() or p.auth_user_id = auth.uid()
    limit 1
  )
  or exists (
    select 1
    from public.hr_profiles p
    where (p.id = auth.uid() or p.auth_user_id = auth.uid())
      and p.role_code in (
        'rh_admin',
        'gestor_rh',
        'diretoria',
        'diretor'
      )
  )
);
