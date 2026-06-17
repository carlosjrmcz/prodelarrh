alter table public.email_event_status_history enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'email_event_status_history'
      and policyname = 'authenticated_insert_email_event_status_history'
  ) then
    create policy "authenticated_insert_email_event_status_history"
    on public.email_event_status_history
    for insert to authenticated
    with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'email_event_status_history'
      and policyname = 'service_role_all_email_event_status_history'
  ) then
    create policy "service_role_all_email_event_status_history"
    on public.email_event_status_history
    for all to service_role
    using (true)
    with check (true);
  end if;
end $$;
