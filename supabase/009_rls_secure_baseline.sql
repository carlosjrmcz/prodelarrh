-- MIGRATION 009 — RLS Secure Baseline
-- Revoga políticas DEV abertas
-- Aplica autenticação mínima para tabelas operacionais sensíveis

do $$
declare
  tbl text;
  tbls text[] := array[
    'hr_companies',
    'hr_departments',
    'hr_positions',
    'hr_profiles',
    'hr_employees',
    'hr_employee_timeline_events',
    'hr_document_types',
    'hr_employee_documents',
    'hr_request_types',
    'hr_requests',
    'hr_request_status_history',
    'hr_request_comments',
    'hr_request_attachments',
    'hr_onboarding_processes',
    'hr_offboarding_processes',
    'hr_vacation_periods',
    'hr_time_bank_months',
    'hr_overtime_authorizations',
    'hr_time_clock_adjustments',
    'hr_time_clock_closures',
    'hr_disciplinary_records',
    'hr_assets',
    'hr_asset_assignments',
    'hr_training_records',
    'hr_policy_terms',
    'hr_employee_term_acceptances',
    'hr_payroll_rubrics',
    'hr_payroll_batches',
    'hr_payroll_batch_items',
    'hr_payroll_batch_item_rubrics',
    'hr_accounting_packages',
    'hr_announcements',
    'hr_announcement_reads',
    'hr_import_batches',
    'hr_employee_import_rows',
    'hr_paystub_import_batches',
    'hr_paystub_import_pages',
    'hr_monthly_routines',
    'hr_point_adjustment_requests',
    'hr_monthly_point_reviews',
    'hr_vacation_change_events',
    'hr_employee_timeline_notes',
    'email_templates',
    'email_events',
    'email_delivery_logs',
    'email_event_status_history'
  ];
begin
  foreach tbl in array tbls loop
    if to_regclass(format('public.%I', tbl)) is not null then
      execute format('drop policy if exists %I on public.%I', tbl || '_dev_all', tbl);
      execute format('drop policy if exists %I on public.%I', 'dev_all_' || tbl, tbl);
      execute format('drop policy if exists "dev_allow_all" on public.%I', tbl);
      execute format('drop policy if exists "allow_all" on public.%I', tbl);
      execute format('drop policy if exists "Enable all for dev" on public.%I', tbl);
      execute format('drop policy if exists "dev_open" on public.%I', tbl);
      execute format('drop policy if exists "authenticated_only" on public.%I', tbl);
      execute format('alter table public.%I enable row level security', tbl);
      execute format(
        'create policy "authenticated_only" on public.%I for all to authenticated using (true) with check (true)',
        tbl
      );
    end if;
  end loop;
end $$;
