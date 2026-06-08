-- Prodelar RH
-- DEV ONLY: permissive policies for local MVP testing with the publishable key.
-- Do not use in production with real employee data.
-- Before production, replace with policies by profile:
-- employee, manager, hr, executive, admin.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hr_companies',
    'hr_departments',
    'hr_positions',
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
    'email_templates',
    'email_events',
    'email_delivery_logs',
    'email_event_status_history'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_dev_all', table_name);
    execute format(
      'create policy %I on public.%I for all to anon, authenticated using (true) with check (true)',
      table_name || '_dev_all',
      table_name
    );
  end loop;
end $$;
