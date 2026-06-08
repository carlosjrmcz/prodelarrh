-- Prodelar RH
-- Test flow seed. Execute in Supabase SQL Editor.
-- Creates a clearly marked TESTE employee and simulates the main MVP flows.

do $$
declare
  v_prodelar uuid;
  v_colmob uuid;
  v_servimec uuid;
  v_department uuid;
  v_position uuid;
  v_employee uuid;
  v_admission_type uuid;
  v_vacation_type uuid;
  v_time_type uuid;
  v_admission_request uuid;
  v_vacation_request uuid;
  v_doc record;
begin
  select id into v_employee from public.hr_employees where employee_code = 'TESTE-0001';

  if v_employee is not null then
    delete from public.hr_employee_timeline_events where employee_id = v_employee;
    delete from public.hr_accounting_packages where summary->>'test_employee' = 'Colaborador Teste Fluxo Completo';
    delete from public.hr_time_clock_closures where summary->>'employees' = '1' and notes ilike 'TESTE%';
    delete from public.hr_time_bank_months where employee_id = v_employee;
    delete from public.hr_time_clock_adjustments where employee_id = v_employee;
    delete from public.hr_overtime_authorizations where employee_id = v_employee;
    delete from public.hr_vacation_periods where employee_id = v_employee;
    delete from public.hr_employee_documents where employee_id = v_employee;
    delete from public.hr_onboarding_processes where employee_id = v_employee;
    delete from public.hr_request_status_history
      where request_id in (select id from public.hr_requests where employee_id = v_employee);
    delete from public.hr_request_attachments
      where request_id in (select id from public.hr_requests where employee_id = v_employee);
    delete from public.hr_request_comments
      where request_id in (select id from public.hr_requests where employee_id = v_employee);
    delete from public.hr_requests where employee_id = v_employee;
    delete from public.hr_employees where id = v_employee;
  end if;

  insert into public.hr_companies (code, name, legal_name)
  values
    ('PRODELAR', 'Prodelar', 'PRODELAR MOVEIS PLANEJADOS LTDA'),
    ('COLMOB', 'Colmob', 'COLMOB INDUSTRIA E COMERCIO DE MOVEIS LTDA.'),
    ('SERVIMEC', 'Servimec', 'SERVIMEC SERVICOS MECANICOS E ELETRICOS LTDA')
  on conflict (name) do update set
    code = excluded.code,
    legal_name = excluded.legal_name,
    updated_at = now();

  select id into v_prodelar from public.hr_companies where code = 'PRODELAR';
  select id into v_colmob from public.hr_companies where code = 'COLMOB';
  select id into v_servimec from public.hr_companies where code = 'SERVIMEC';

  insert into public.hr_departments (company_id, code, name)
  values (v_prodelar, 'TESTE-RH', 'RH - Testes')
  on conflict (company_id, name) do update set code = excluded.code, updated_at = now()
  returning id into v_department;

  insert into public.hr_positions (code, name, description)
  values ('TESTE-ASSISTENTE-RH', 'Assistente de RH - Teste', 'Cargo criado para validar o fluxo completo do app de RH.')
  on conflict (name) do update set code = excluded.code, description = excluded.description, updated_at = now()
  returning id into v_position;

  insert into public.hr_request_types (code, name, default_sla_business_days, requires_approval, approval_role_code)
  values
    ('admission', 'Admissão', 3, true, 'rh'),
    ('vacation_schedule', 'Programação de férias', 5, true, 'gestor'),
    ('time_clock_adjustment', 'Ajuste de ponto', 2, true, 'gestor')
  on conflict (code) do update set
    name = excluded.name,
    default_sla_business_days = excluded.default_sla_business_days,
    requires_approval = excluded.requires_approval,
    approval_role_code = excluded.approval_role_code,
    updated_at = now();

  select id into v_admission_type from public.hr_request_types where code = 'admission';
  select id into v_vacation_type from public.hr_request_types where code = 'vacation_schedule';
  select id into v_time_type from public.hr_request_types where code = 'time_clock_adjustment';

  insert into public.hr_document_types (code, name, category, default_sensitivity, is_required_on_admission)
  values
    ('admission_request', 'Solicitação de admissão', 'admissao', 'hr_restricted', false),
    ('occupational_health_certificate', 'ASO - Atestado de Saúde Ocupacional', 'saude_ocupacional', 'legal_restricted', true),
    ('employment_contract', 'Contrato de trabalho assinado', 'contrato', 'legal_restricted', true),
    ('paystub', 'Contracheque / holerite', 'folha', 'employee_private', false)
  on conflict (code) do update set
    name = excluded.name,
    category = excluded.category,
    default_sensitivity = excluded.default_sensitivity,
    is_required_on_admission = excluded.is_required_on_admission;

  insert into public.hr_employees (
    company_id,
    department_id,
    position_id,
    employee_code,
    full_name,
    preferred_name,
    cpf,
    admission_date,
    status,
    base_salary,
    payment_type,
    work_schedule,
    email,
    notes,
    raw_import
  )
  values (
    v_prodelar,
    v_department,
    v_position,
    'TESTE-0001',
    'Colaborador Teste Fluxo Completo',
    'Teste RH',
    '000.000.000-00',
    current_date,
    'active',
    2500,
    'Mensal',
    '44h semanais com banco de horas',
    'teste.rh@prodelar.local',
    'Cadastro criado automaticamente para validar todos os fluxos do MVP RH.',
    '{"source":"002_seed_test_flow","test":true}'::jsonb
  )
  returning id into v_employee;

  insert into public.hr_requests (
    protocol_number,
    request_type_id,
    company_id,
    employee_id,
    requester_employee_id,
    status,
    title,
    description,
    due_at,
    completed_at,
    raw_data
  )
  values (
    'RH-TESTE-0001',
    v_admission_type,
    v_prodelar,
    v_employee,
    v_employee,
    'completed',
    'TESTE - Admissão fluxo completo',
    'Solicitação criada para simular admissão aprovada, documentação validada, ASO apto e checklist concluído.',
    now(),
    now(),
    '{"test":true,"trigger":"fluxo_completo"}'::jsonb
  )
  returning id into v_admission_request;

  insert into public.hr_request_status_history (request_id, new_status, notes)
  values
    (v_admission_request, 'open', 'TESTE - solicitação aberta'),
    (v_admission_request, 'in_analysis', 'TESTE - RH analisou'),
    (v_admission_request, 'waiting_approval', 'TESTE - aguardou aprovação'),
    (v_admission_request, 'approved', 'TESTE - aprovado'),
    (v_admission_request, 'in_execution', 'TESTE - documentação e ASO'),
    (v_admission_request, 'completed', 'TESTE - admissão concluída');

  insert into public.hr_onboarding_processes (
    request_id,
    employee_id,
    planned_start_date,
    status,
    checklist,
    sent_to_accounting_at,
    completed_at
  )
  values (
    v_admission_request,
    v_employee,
    current_date,
    'completed',
    '{"formulario_aprovado":true,"documentacao_completa":true,"aso_apto":true,"beneficios":true,"contrato_assinado":true,"enviado_contabilidade":true}'::jsonb,
    now(),
    now()
  );

  for v_doc in
    select * from public.hr_document_types
    where code in ('admission_request', 'occupational_health_certificate', 'employment_contract', 'paystub')
  loop
    insert into public.hr_employee_documents (
      employee_id,
      company_id,
      document_type_id,
      title,
      competence_month,
      issued_at,
      sensitivity,
      storage_path,
      original_file_name,
      raw_metadata
    )
    values (
      v_employee,
      v_prodelar,
      v_doc.id,
      'TESTE - ' || v_doc.name,
      date '2026-05-01',
      current_date,
      v_doc.default_sensitivity,
      'teste/TESTE-0001/' || v_doc.code || '.pdf',
      v_doc.code || '-teste.pdf',
      '{"test":true}'::jsonb
    );
  end loop;

  insert into public.hr_requests (
    protocol_number,
    request_type_id,
    company_id,
    employee_id,
    requester_employee_id,
    status,
    title,
    description,
    due_at,
    raw_data
  )
  values (
    'RH-TESTE-0002',
    v_vacation_type,
    v_prodelar,
    v_employee,
    v_employee,
    'approved',
    'TESTE - Programação de férias',
    'Programação simulada para validar consulta de férias por líder.',
    timestamp '2026-06-01 12:00:00+00',
    '{"test":true}'::jsonb
  )
  returning id into v_vacation_request;

  insert into public.hr_vacation_periods (
    employee_id,
    acquisition_start,
    acquisition_end,
    legal_limit_date,
    balance_days,
    planned_start,
    planned_end,
    allowance_requested,
    status,
    source_competence_month,
    raw_import
  )
  values (
    v_employee,
    date '2026-05-19',
    date '2027-05-18',
    date '2028-04-18',
    30,
    date '2027-06-01',
    date '2027-06-30',
    false,
    'approved',
    date '2026-05-01',
    jsonb_build_object('request_id', v_vacation_request, 'test', true)
  );

  insert into public.hr_overtime_authorizations (
    employee_id,
    company_id,
    work_date,
    requested_minutes,
    approved_minutes,
    reason,
    status,
    approved_at
  )
  values (
    v_employee,
    v_prodelar,
    current_date,
    60,
    60,
    'TESTE - validação de autorização prévia de hora extra.',
    'approved',
    now()
  );

  insert into public.hr_time_clock_adjustments (
    employee_id,
    company_id,
    work_date,
    adjustment_type,
    requested_time,
    reason,
    status,
    approved_at
  )
  values (
    v_employee,
    v_prodelar,
    current_date,
    'missing_clock_in',
    time '08:00',
    'TESTE - simulação de ajuste de ponto esquecido.',
    'approved',
    now()
  );

  insert into public.hr_time_bank_months (
    employee_id,
    company_id,
    competence_month,
    balance_minutes,
    overtime_minutes_received,
    overtime_minutes_pending,
    estimated_amount,
    payroll_listed_amount,
    notes,
    raw_import
  )
  values (
    v_employee,
    v_prodelar,
    date '2026-05-01',
    60,
    60,
    0,
    25,
    25,
    'TESTE - banco de horas validado.',
    '{"test":true}'::jsonb
  );

  insert into public.hr_time_clock_closures (
    company_id,
    department_id,
    competence_month,
    status,
    employee_validated_at,
    manager_validated_at,
    dp_validated_at,
    sent_to_payroll_at,
    checklist,
    summary,
    notes
  )
  values (
    v_prodelar,
    v_department,
    date '2026-05-01',
    'completed',
    now(),
    now(),
    now(),
    now(),
    '{"colaborador":true,"gestor":true,"dp":true,"enviado_folha":true}'::jsonb,
    '{"employees":1,"overtime_minutes":60,"pending_adjustments":0}'::jsonb,
    'TESTE - fechamento mensal validado.'
  );

  insert into public.hr_accounting_packages (
    company_id,
    competence_month,
    status,
    checklist,
    summary,
    sent_to_accounting_at,
    notes
  )
  values (
    v_prodelar,
    date '2026-05-01',
    'sent',
    '{"admissoes":true,"ferias":true,"ponto":true,"documentos":true}'::jsonb,
    '{"test_employee":"Colaborador Teste Fluxo Completo","requests":2,"documents":4}'::jsonb,
    now(),
    'TESTE - pacote mensal disparado/simulado para contabilidade.'
  );

  insert into public.hr_announcements (
    company_id,
    department_id,
    title,
    body,
    published_at
  )
  values (
    v_prodelar,
    v_department,
    'TESTE - Comunicado do RH',
    'Comunicado criado para validar publicação no portal do colaborador.',
    now()
  );

  insert into public.hr_employee_timeline_events (employee_id, event_date, event_type, title, description, related_table, related_record_id, visibility)
  values
    (v_employee, current_date, 'admission', 'TESTE - Admissão concluída', 'Documentação completa, ASO apto e checklist finalizado.', 'hr_employees', v_employee, 'internal_only'),
    (v_employee, current_date, 'vacation', 'TESTE - Férias programadas', 'Período aprovado para 01/06/2027 a 30/06/2027.', 'hr_employees', v_employee, 'internal_only'),
    (v_employee, current_date, 'time_clock', 'TESTE - Ponto fechado', 'Banco de horas e ajuste de ponto validados.', 'hr_employees', v_employee, 'internal_only'),
    (v_employee, current_date, 'accounting_package', 'TESTE - Pacote mensal enviado', 'Competência 05/2026 simulada como enviada.', 'hr_employees', v_employee, 'internal_only');

  raise notice 'Fluxo de teste criado. Colaborador: %, código: TESTE-0001, empresas: %, %, %', v_employee, v_prodelar, v_colmob, v_servimec;
end $$;
