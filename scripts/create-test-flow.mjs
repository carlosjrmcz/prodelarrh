import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de rodar este script.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const today = new Date().toISOString().slice(0, 10);
const now = new Date().toISOString();

async function upsertOne(table, row, onConflict) {
  const { data, error } = await supabase.from(table).upsert(row, { onConflict }).select().single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

async function insertOne(table, row) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

const prodelar = await upsertOne(
  "hr_companies",
  { code: "PRODELAR", name: "Prodelar", legal_name: "PRODELAR MOVEIS PLANEJADOS LTDA" },
  "name",
);

const colmob = await upsertOne(
  "hr_companies",
  { code: "COLMOB", name: "Colmob", legal_name: "COLMOB INDUSTRIA E COMERCIO DE MOVEIS LTDA." },
  "name",
);

const servimec = await upsertOne(
  "hr_companies",
  { code: "SERVIMEC", name: "Servimec", legal_name: "SERVIMEC SERVICOS MECANICOS E ELETRICOS LTDA" },
  "name",
);

const department = await upsertOne(
  "hr_departments",
  { company_id: prodelar.id, code: "TESTE-RH", name: "RH - Testes" },
  "company_id,name",
);

const position = await upsertOne(
  "hr_positions",
  { code: "TESTE-ASSISTENTE-RH", name: "Assistente de RH - Teste", description: "Cargo criado para validar o fluxo completo do app de RH." },
  "name",
);

const admissionType = await upsertOne(
  "hr_request_types",
  { code: "admission", name: "Admissão", default_sla_business_days: 3, requires_approval: true, approval_role_code: "rh" },
  "code",
);

const vacationType = await upsertOne(
  "hr_request_types",
  { code: "vacation_schedule", name: "Programação de férias", default_sla_business_days: 5, requires_approval: true, approval_role_code: "gestor" },
  "code",
);

const timeType = await upsertOne(
  "hr_request_types",
  { code: "time_clock_adjustment", name: "Ajuste de ponto", default_sla_business_days: 2, requires_approval: true, approval_role_code: "gestor" },
  "code",
);

const docs = await Promise.all([
  upsertOne("hr_document_types", { code: "admission_request", name: "Solicitação de admissão", category: "admissao", default_sensitivity: "hr_restricted", is_required_on_admission: false }, "code"),
  upsertOne("hr_document_types", { code: "occupational_health_certificate", name: "ASO - Atestado de Saúde Ocupacional", category: "saude_ocupacional", default_sensitivity: "legal_restricted", is_required_on_admission: true }, "code"),
  upsertOne("hr_document_types", { code: "employment_contract", name: "Contrato de trabalho assinado", category: "contrato", default_sensitivity: "legal_restricted", is_required_on_admission: true }, "code"),
  upsertOne("hr_document_types", { code: "paystub", name: "Contracheque / holerite", category: "folha", default_sensitivity: "employee_private", is_required_on_admission: false }, "code"),
]);

const employee = await upsertOne(
  "hr_employees",
  {
    company_id: prodelar.id,
    department_id: department.id,
    position_id: position.id,
    employee_code: "TESTE-0001",
    full_name: "Colaborador Teste Fluxo Completo",
    preferred_name: "Teste RH",
    cpf: "000.000.000-00",
    admission_date: today,
    status: "active",
    base_salary: 2500,
    payment_type: "Mensal",
    work_schedule: "44h semanais com banco de horas",
    email: "teste.rh@prodelar.local",
    notes: "Cadastro criado automaticamente para validar todos os fluxos do MVP RH.",
    raw_import: { source: "create-test-flow", test: true },
  },
  "company_id,employee_code",
);

const admissionRequest = await upsertOne(
  "hr_requests",
  {
    protocol_number: "RH-TESTE-0001",
    request_type_id: admissionType.id,
    company_id: prodelar.id,
    employee_id: employee.id,
    requester_employee_id: employee.id,
    status: "completed",
    title: "TESTE - Admissão fluxo completo",
    description: "Solicitação criada para simular admissão aprovada, documentação validada, ASO apto e checklist concluído.",
    due_at: now,
    completed_at: now,
    raw_data: { test: true, trigger: "fluxo_completo" },
  },
  "protocol_number",
);

for (const newStatus of ["open", "in_analysis", "waiting_approval", "approved", "in_execution", "completed"]) {
  await insertOne("hr_request_status_history", {
    request_id: admissionRequest.id,
    new_status: newStatus,
    notes: `TESTE - etapa ${newStatus}`,
  });
}

await insertOne("hr_onboarding_processes", {
  request_id: admissionRequest.id,
  employee_id: employee.id,
  planned_start_date: today,
  status: "completed",
  checklist: {
    formulario_aprovado: true,
    documentacao_completa: true,
    aso_apto: true,
    beneficios: true,
    contrato_assinado: true,
    enviado_contabilidade: true,
  },
  sent_to_accounting_at: now,
  completed_at: now,
});

for (const doc of docs) {
  await insertOne("hr_employee_documents", {
    employee_id: employee.id,
    company_id: prodelar.id,
    document_type_id: doc.id,
    title: `TESTE - ${doc.name}`,
    competence_month: "2026-05-01",
    issued_at: today,
    sensitivity: doc.default_sensitivity,
    storage_path: `teste/${employee.employee_code}/${doc.code}.pdf`,
    original_file_name: `${doc.code}-teste.pdf`,
    raw_metadata: { test: true },
  });
}

const vacationRequest = await upsertOne(
  "hr_requests",
  {
    protocol_number: "RH-TESTE-0002",
    request_type_id: vacationType.id,
    company_id: prodelar.id,
    employee_id: employee.id,
    requester_employee_id: employee.id,
    status: "approved",
    title: "TESTE - Programação de férias",
    description: "Programação simulada para validar consulta de férias por líder.",
    due_at: "2026-06-01T12:00:00.000Z",
    raw_data: { test: true },
  },
  "protocol_number",
);

await insertOne("hr_vacation_periods", {
  employee_id: employee.id,
  acquisition_start: "2026-05-19",
  acquisition_end: "2027-05-18",
  legal_limit_date: "2028-04-18",
  balance_days: 30,
  planned_start: "2027-06-01",
  planned_end: "2027-06-30",
  allowance_requested: false,
  status: "approved",
  source_competence_month: "2026-05-01",
  raw_import: { request_id: vacationRequest.id, test: true },
});

await insertOne("hr_overtime_authorizations", {
  employee_id: employee.id,
  company_id: prodelar.id,
  work_date: today,
  requested_minutes: 60,
  approved_minutes: 60,
  reason: "TESTE - validação de autorização prévia de hora extra.",
  status: "approved",
  approved_at: now,
});

await insertOne("hr_time_clock_adjustments", {
  employee_id: employee.id,
  company_id: prodelar.id,
  work_date: today,
  adjustment_type: "missing_clock_in",
  requested_time: "08:00",
  reason: "TESTE - simulação de ajuste de ponto esquecido.",
  status: "approved",
  approved_at: now,
});

await insertOne("hr_time_bank_months", {
  employee_id: employee.id,
  company_id: prodelar.id,
  competence_month: "2026-05-01",
  balance_minutes: 60,
  overtime_minutes_received: 60,
  overtime_minutes_pending: 0,
  estimated_amount: 25,
  payroll_listed_amount: 25,
  notes: "TESTE - banco de horas validado.",
  raw_import: { test: true },
});

await insertOne("hr_time_clock_closures", {
  company_id: prodelar.id,
  department_id: department.id,
  competence_month: "2026-05-01",
  status: "completed",
  employee_validated_at: now,
  manager_validated_at: now,
  dp_validated_at: now,
  sent_to_payroll_at: now,
  checklist: { colaborador: true, gestor: true, dp: true, enviado_folha: true },
  summary: { employees: 1, overtime_minutes: 60, pending_adjustments: 0 },
  notes: "TESTE - fechamento mensal validado.",
});

await insertOne("hr_accounting_packages", {
  company_id: prodelar.id,
  competence_month: "2026-05-01",
  status: "sent",
  checklist: { admissoes: true, ferias: true, ponto: true, documentos: true },
  summary: { test_employee: employee.full_name, requests: 2, documents: docs.length },
  sent_to_accounting_at: now,
  notes: "TESTE - pacote mensal disparado/simulado para contabilidade.",
});

await insertOne("hr_announcements", {
  company_id: prodelar.id,
  department_id: department.id,
  title: "TESTE - Comunicado do RH",
  body: "Comunicado criado para validar publicação no portal do colaborador.",
  published_at: now,
});

for (const event of [
  ["admission", "Admissão concluída", "Documentação completa, ASO apto e checklist finalizado."],
  ["vacation", "Férias programadas", "Período aprovado para 01/06/2027 a 30/06/2027."],
  ["time_clock", "Ponto fechado", "Banco de horas e ajuste de ponto validados."],
  ["accounting_package", "Pacote mensal enviado", "Competência 05/2026 simulada como enviada."],
]) {
  await insertOne("hr_employee_timeline_events", {
    employee_id: employee.id,
    event_date: today,
    event_type: event[0],
    title: `TESTE - ${event[1]}`,
    description: event[2],
    related_table: "hr_employees",
    related_record_id: employee.id,
    visibility: "internal_only",
  });
}

console.log(
  JSON.stringify(
    {
      ok: true,
      employee_id: employee.id,
      employee_code: employee.employee_code,
      employee_name: employee.full_name,
      admission_protocol: admissionRequest.protocol_number,
      companies: [prodelar.name, colmob.name, servimec.name],
    },
    null,
    2,
  ),
);
