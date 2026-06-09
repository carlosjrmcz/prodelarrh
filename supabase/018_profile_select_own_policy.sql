drop policy if exists profile_select_own on public.hr_profiles;

create policy profile_select_own
on public.hr_profiles
for select
to authenticated
using (
  auth_user_id = auth.uid()
  or id = auth.uid()
);

