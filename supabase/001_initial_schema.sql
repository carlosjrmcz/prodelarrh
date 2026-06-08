-- Prodelar RH
-- Initial Supabase schema draft.
-- Goal: operational HR database for documents, requests, consultation,
-- approvals, monthly payroll/accounting packages, and audit history.
-- It does not calculate payroll, vacation pay, taxes, or severance.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  create type public.hr_employee_status as enum ('active', 'inactive', 'on_leave', 'terminated');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.hr_request_status as enum (
    'draft',
    'open',
    'in_analysis',
    'waiting_approval',
    'approved',
    'rejected',
    'waiting_documents',
    'in_execution',
    'completed',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.hr_request_visibility as enum ('employee_visible', 'internal_only', 'leadership_visible');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.hr_document_sensitivity as enum ('public_policy', 'employee_private', 'leader_visible', 'hr_restricted', 'legal_restricted');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.hr_payroll_rubric_kind as enum ('earning', 'deduction', 'base', 'informational');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.hr_batch_status as enum ('draft', 'in_review', 'sent', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Organization and access
-- ---------------------------------------------------------------------------

create table if not exists public.hr_companies (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null unique,
  legal_name text,
  document_number text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.hr_companies(id),
  code text,
  name text not null,
  parent_department_id uuid references public.hr_departments(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists public.hr_positions (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null unique,
  description text,
  cbo_code text,
  is_leadership boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  employee_id uuid,
  role_code text not null default 'employee',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Employees
-- ---------------------------------------------------------------------------

create table if not exists public.hr_employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.hr_companies(id),
  department_id uuid references public.hr_departments(id),
  position_id uuid references public.hr_positions(id),
  manager_employee_id uuid references public.hr_employees(id),
  employee_code text,
  esocial_registration text,
  full_name text not null,
  preferred_name text,
  cpf text,
  pis_pasep text,
  birth_date date,
  admission_date date,
  termination_date date,
  status public.hr_employee_status not null default 'active',
  base_salary numeric(14,2),
  payment_type text,
  work_schedule text,
  phone text,
  email text,
  address_raw text,
  notes text,
  raw_import jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, employee_code)
);

do $$
begin
  alter table public.hr_profiles
    add constraint hr_profiles_employee_fk
    foreign key (employee_id) references public.hr_employees(id);
exception when duplicate_object then null;
end $$;

create table if not exists public.hr_employee_timeline_events (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  event_date date not null default current_date,
  event_type text not null,
  title text not null,
  description text,
  related_table text,
  related_record_id uuid,
  visibility public.hr_request_visibility not null default 'internal_only',
  created_by uuid references public.hr_profiles(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------------

create table if not exists public.hr_document_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null,
  default_sensitivity public.hr_document_sensitivity not null default 'employee_private',
  is_required_on_admission boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.hr_employees(id) on delete cascade,
  company_id uuid references public.hr_companies(id),
  document_type_id uuid references public.hr_document_types(id),
  title text not null,
  competence_month date,
  issued_at date,
  expires_at date,
  sensitivity public.hr_document_sensitivity not null default 'employee_private',
  storage_bucket text not null default 'hr-employee-documents',
  storage_path text not null,
  original_file_name text,
  uploaded_by uuid references public.hr_profiles(id),
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Request/ticket engine
-- ---------------------------------------------------------------------------

create table if not exists public.hr_request_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  default_sla_business_days integer,
  requires_approval boolean not null default false,
  approval_role_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_requests (
  id uuid primary key default gen_random_uuid(),
  protocol_number text not null unique,
  request_type_id uuid not null references public.hr_request_types(id),
  company_id uuid references public.hr_companies(id),
  employee_id uuid references public.hr_employees(id),
  requester_profile_id uuid references public.hr_profiles(id),
  requester_employee_id uuid references public.hr_employees(id),
  current_owner_profile_id uuid references public.hr_profiles(id),
  status public.hr_request_status not null default 'open',
  title text not null,
  description text,
  due_at timestamptz,
  completed_at timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.hr_requests(id) on delete cascade,
  old_status public.hr_request_status,
  new_status public.hr_request_status not null,
  changed_by uuid references public.hr_profiles(id),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.hr_requests(id) on delete cascade,
  author_profile_id uuid references public.hr_profiles(id),
  visibility public.hr_request_visibility not null default 'internal_only',
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_request_attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.hr_requests(id) on delete cascade,
  document_id uuid references public.hr_employee_documents(id),
  storage_bucket text not null default 'hr-request-attachments',
  storage_path text not null,
  original_file_name text,
  uploaded_by uuid references public.hr_profiles(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Operational HR modules
-- ---------------------------------------------------------------------------

create table if not exists public.hr_onboarding_processes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.hr_requests(id),
  employee_id uuid references public.hr_employees(id),
  planned_start_date date,
  status text not null default 'open',
  checklist jsonb not null default '{}'::jsonb,
  sent_to_accounting_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_offboarding_processes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.hr_requests(id),
  employee_id uuid not null references public.hr_employees(id),
  termination_date date,
  termination_reason text,
  status text not null default 'open',
  checklist jsonb not null default '{}'::jsonb,
  sent_to_accounting_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_vacation_periods (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  acquisition_start date not null,
  acquisition_end date not null,
  legal_limit_date date,
  balance_days numeric(6,2),
  planned_start date,
  planned_end date,
  allowance_requested boolean,
  status text not null default 'forecast',
  source_competence_month date,
  raw_import jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_time_bank_months (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  company_id uuid references public.hr_companies(id),
  competence_month date not null,
  balance_minutes integer,
  overtime_minutes_received integer,
  overtime_minutes_pending integer,
  estimated_amount numeric(14,2),
  payroll_listed_amount numeric(14,2),
  notes text,
  raw_import jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, competence_month)
);

create table if not exists public.hr_overtime_authorizations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  manager_employee_id uuid references public.hr_employees(id),
  company_id uuid references public.hr_companies(id),
  work_date date not null,
  requested_minutes integer,
  approved_minutes integer,
  reason text not null,
  status text not null default 'requested',
  approved_by uuid references public.hr_profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_time_clock_adjustments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  manager_employee_id uuid references public.hr_employees(id),
  company_id uuid references public.hr_companies(id),
  work_date date not null,
  adjustment_type text not null,
  requested_time time,
  reason text not null,
  status text not null default 'requested',
  approved_by uuid references public.hr_profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_time_clock_closures (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.hr_companies(id),
  department_id uuid references public.hr_departments(id),
  competence_month date not null,
  status text not null default 'draft',
  employee_validated_at timestamptz,
  manager_validated_at timestamptz,
  dp_validated_at timestamptz,
  sent_to_payroll_at timestamptz,
  checklist jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, department_id, competence_month)
);

create table if not exists public.hr_disciplinary_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  company_id uuid references public.hr_companies(id),
  record_type text not null,
  occurrence_date date not null,
  reason text not null,
  manager_employee_id uuid references public.hr_employees(id),
  formalized_by uuid references public.hr_profiles(id),
  document_id uuid references public.hr_employee_documents(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.hr_companies(id),
  asset_type text not null,
  name text not null,
  patrimony_code text,
  status text not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_asset_assignments (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.hr_assets(id),
  employee_id uuid not null references public.hr_employees(id),
  assigned_at date not null default current_date,
  returned_at date,
  assignment_document_id uuid references public.hr_employee_documents(id),
  return_document_id uuid references public.hr_employee_documents(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_training_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  training_name text not null,
  provider text,
  completed_at date,
  workload_hours numeric(8,2),
  expires_at date,
  certificate_document_id uuid references public.hr_employee_documents(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_policy_terms (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.hr_companies(id),
  code text not null,
  title text not null,
  version_label text not null default '1.0',
  body text,
  valid_from date,
  valid_until date,
  storage_bucket text default 'hr-policy-terms',
  storage_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code, version_label)
);

create table if not exists public.hr_employee_term_acceptances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  policy_term_id uuid not null references public.hr_policy_terms(id),
  signed_document_id uuid references public.hr_employee_documents(id),
  accepted_at timestamptz,
  expires_at date,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, policy_term_id)
);

-- ---------------------------------------------------------------------------
-- Payroll/accounting reference and monthly packages
-- ---------------------------------------------------------------------------

create table if not exists public.hr_payroll_rubrics (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  kind public.hr_payroll_rubric_kind not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_payroll_batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.hr_companies(id),
  competence_month date not null,
  batch_type text not null,
  status public.hr_batch_status not null default 'draft',
  source_system text not null default 'mastermaq',
  source_file_name text,
  storage_bucket text default 'hr-payroll-imports',
  storage_path text,
  sent_to_accounting_at timestamptz,
  sent_by uuid references public.hr_profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_payroll_batch_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.hr_payroll_batches(id) on delete cascade,
  employee_id uuid references public.hr_employees(id),
  employee_code text,
  employee_name text,
  department_name text,
  position_name text,
  admission_date date,
  termination_date date,
  base_salary numeric(14,2),
  raw_import jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_payroll_batch_item_rubrics (
  id uuid primary key default gen_random_uuid(),
  payroll_batch_item_id uuid not null references public.hr_payroll_batch_items(id) on delete cascade,
  rubric_id uuid references public.hr_payroll_rubrics(id),
  rubric_code text,
  rubric_name text,
  reference_value numeric(14,4),
  amount numeric(14,2),
  kind public.hr_payroll_rubric_kind,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_accounting_packages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.hr_companies(id),
  competence_month date not null,
  status public.hr_batch_status not null default 'draft',
  checklist jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  sent_to_accounting_at timestamptz,
  sent_by uuid references public.hr_profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, competence_month)
);

-- ---------------------------------------------------------------------------
-- Communication and initial imports
-- ---------------------------------------------------------------------------

create table if not exists public.hr_announcements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.hr_companies(id),
  department_id uuid references public.hr_departments(id),
  title text not null,
  body text not null,
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid references public.hr_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_announcement_reads (
  announcement_id uuid not null references public.hr_announcements(id) on delete cascade,
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, employee_id)
);

create table if not exists public.hr_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_file_name text,
  company_id uuid references public.hr_companies(id),
  competence_month date,
  imported_by uuid references public.hr_profiles(id),
  imported_at timestamptz not null default now(),
  summary jsonb not null default '{}'::jsonb,
  raw_metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.hr_employee_import_rows (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid references public.hr_import_batches(id) on delete cascade,
  employee_id uuid references public.hr_employees(id),
  employee_code text,
  full_name text not null,
  company_name text,
  department_name text,
  position_name text,
  status public.hr_employee_status not null default 'active',
  net_amount numeric(14,2),
  raw_row jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------

create or replace view public.hr_employee_directory as
select
  e.id,
  e.employee_code,
  e.full_name,
  e.status,
  e.admission_date,
  e.termination_date,
  c.name as company_name,
  d.name as department_name,
  p.name as position_name,
  m.full_name as manager_name
from public.hr_employees e
left join public.hr_companies c on c.id = e.company_id
left join public.hr_departments d on d.id = e.department_id
left join public.hr_positions p on p.id = e.position_id
left join public.hr_employees m on m.id = e.manager_employee_id;

create or replace view public.hr_open_requests_dashboard as
select
  r.id,
  r.protocol_number,
  rt.name as request_type,
  r.title,
  r.status,
  r.due_at,
  r.created_at,
  e.full_name as employee_name,
  c.name as company_name
from public.hr_requests r
join public.hr_request_types rt on rt.id = r.request_type_id
left join public.hr_employees e on e.id = r.employee_id
left join public.hr_companies c on c.id = r.company_id
where r.status not in ('completed', 'cancelled', 'rejected');

create or replace view public.hr_vacation_forecast_dashboard as
select
  v.id,
  e.full_name as employee_name,
  c.name as company_name,
  p.name as position_name,
  v.acquisition_start,
  v.acquisition_end,
  v.legal_limit_date,
  v.balance_days,
  v.planned_start,
  v.planned_end,
  v.status
from public.hr_vacation_periods v
join public.hr_employees e on e.id = v.employee_id
left join public.hr_companies c on c.id = e.company_id
left join public.hr_positions p on p.id = e.position_id;

-- ---------------------------------------------------------------------------
-- Initial seed from observed Prodelar RH files
-- ---------------------------------------------------------------------------

insert into public.hr_companies (code, name, legal_name)
values
  ('PRODELAR', 'Prodelar', 'PRODELAR MOVEIS PLANEJADOS LTDA'),
  ('COLMOB', 'Colmob', 'COLMOB INDUSTRIA E COMERCIO DE MOVEIS LTDA.'),
  ('SERVIMEC', 'Servimec', 'SERVIMEC SERVICOS MECANICOS E ELETRICOS LTDA')
on conflict (name) do update set
  code = excluded.code,
  legal_name = excluded.legal_name,
  updated_at = now();

insert into public.hr_document_types (code, name, category, default_sensitivity, is_required_on_admission)
values
  ('paystub', 'Contracheque / holerite', 'folha', 'employee_private', false),
  ('registration_card', 'Ficha de registro de empregado', 'registro', 'hr_restricted', true),
  ('admission_request', 'Solicitação de admissão', 'admissao', 'hr_restricted', false),
  ('ctps', 'CTPS física ou digital', 'admissao', 'hr_restricted', true),
  ('cpf', 'CPF', 'admissao', 'hr_restricted', true),
  ('rg', 'RG / documento de identidade', 'admissao', 'hr_restricted', true),
  ('pis', 'PIS / espelho do PIS', 'admissao', 'hr_restricted', true),
  ('proof_of_address', 'Comprovante de endereço', 'admissao', 'hr_restricted', true),
  ('proof_of_education', 'Comprovante de escolaridade', 'admissao', 'hr_restricted', true),
  ('civil_certificate', 'Certidão de nascimento ou casamento', 'admissao', 'hr_restricted', true),
  ('voter_registration', 'Título de eleitor', 'admissao', 'hr_restricted', true),
  ('reservist_certificate', 'Certificado de reservista', 'admissao', 'hr_restricted', false),
  ('driver_license', 'CNH', 'admissao', 'hr_restricted', false),
  ('photo_3x4', 'Foto 3x4', 'admissao', 'hr_restricted', true),
  ('bank_details', 'Dados bancários', 'admissao', 'hr_restricted', true),
  ('dependent_documents', 'Documentos de dependentes', 'admissao', 'hr_restricted', false),
  ('food_allowance_court_order', 'Pensão alimentícia / documentação judicial', 'admissao', 'legal_restricted', false),
  ('occupational_health_certificate', 'ASO - Atestado de Saúde Ocupacional', 'saude_ocupacional', 'legal_restricted', true),
  ('toxicology_exam', 'Exame toxicológico', 'saude_ocupacional', 'legal_restricted', false),
  ('transport_voucher_request_or_refusal', 'Solicitação ou recusa de vale-transporte', 'beneficios', 'employee_private', false),
  ('health_plan_request_or_refusal', 'Adesão ou recusa de plano de saúde', 'beneficios', 'employee_private', false),
  ('employment_contract', 'Contrato de trabalho assinado', 'contrato', 'legal_restricted', true),
  ('responsibility_term', 'Termo de responsabilidade', 'contrato', 'employee_private', false),
  ('equipment_use_term', 'Termo de uso de equipamento', 'contrato', 'employee_private', false),
  ('discount_authorization', 'Autorização de desconto', 'contrato', 'employee_private', false),
  ('termination_docs', 'Documentação rescisória', 'desligamento', 'legal_restricted', false),
  ('vacation_forecast', 'Previsão de férias', 'ferias', 'leader_visible', false),
  ('time_bank_report', 'Relatório de ponto / banco de horas', 'ponto', 'leader_visible', false),
  ('work_schedule_compensation_term', 'Termo de compensação de jornada', 'contrato', 'employee_private', true),
  ('policy_manual', 'Manual / política interna', 'politicas', 'public_policy', false)
on conflict (code) do nothing;

insert into public.hr_request_types (code, name, default_sla_business_days, requires_approval, approval_role_code)
values
  ('admission', 'Admissão', 3, true, 'rh'),
  ('promotion', 'Promoção', 5, true, 'diretoria'),
  ('termination', 'Desligamento', 3, true, 'diretoria'),
  ('vacation_schedule', 'Programação de férias', 5, true, 'gestor'),
  ('functional_movement', 'Movimentação funcional', 5, true, 'diretoria'),
  ('document_request', 'Solicitação de documento', 3, false, null),
  ('time_bank_review', 'Conferência de ponto / banco de horas', 5, false, null),
  ('overtime_authorization', 'Autorização de hora extra', 1, true, 'gestor'),
  ('time_clock_adjustment', 'Ajuste de ponto', 2, true, 'gestor'),
  ('time_clock_closure', 'Fechamento mensal de ponto', 3, true, 'rh'),
  ('disciplinary_record', 'Ocorrência disciplinar', 2, true, 'rh'),
  ('asset_delivery', 'Entrega/devolução de EPI ou equipamento', 2, false, null)
on conflict (code) do nothing;

insert into public.hr_policy_terms (company_id, code, title, version_label, body, valid_from)
select
  c.id,
  'time_bank_compensation_agreement',
  'Termo de acordo de compensação de jornada de trabalho e banco de horas',
  '2024-2025',
  'Jornada semanal de 44 horas, regime de compensação e banco de horas, prazo máximo de compensação de 110 dias, limite diário de 10 horas, máximo de 2 horas extras por dia, tolerância de 5 minutos por registro e 10 minutos diários, pagamento de saldo não compensado com adicional de 50% de segunda a sábado e 100% em domingos e feriados.',
  date '2024-01-01'
from public.hr_companies c
where c.code = 'SERVIMEC'
on conflict (company_id, code, version_label) do nothing;

insert into public.hr_payroll_rubrics (code, name, kind)
values
  ('0001', 'Salário', 'earning'),
  ('0010', 'Adiantamento de salário', 'earning'),
  ('0107', 'Insalubridade 20%', 'earning'),
  ('0118', 'Gratificação de função', 'earning'),
  ('0500', 'Salário família', 'earning'),
  ('0622', 'Bolsa estágio', 'earning'),
  ('0720', 'Férias', 'earning'),
  ('0721', '1/3 abono obrigatório de férias', 'earning'),
  ('1003', 'Auxílio transporte', 'earning'),
  ('0028', 'Desconto de férias', 'deduction'),
  ('0089', 'Desconto de faltas', 'deduction'),
  ('0093', 'Vale transporte', 'deduction'),
  ('0098', 'Desconto de adiantamento de salário', 'deduction'),
  ('0217', 'Plano de saúde', 'deduction'),
  ('0242', 'Empréstimo consignado CLT', 'deduction'),
  ('0246', 'Empréstimo consignado CLT', 'deduction'),
  ('0247', 'Empréstimo consignado CLT', 'deduction'),
  ('0248', 'Empréstimo consignado CLT', 'deduction'),
  ('0515', 'Desconto adiantamento quinzenal', 'deduction'),
  ('0520', 'Desconto INSS', 'deduction'),
  ('0723', 'Desconto INSS férias', 'deduction'),
  ('1010', 'Seguro de vida', 'deduction'),
  ('1013', 'Desconto farmácia', 'deduction'),
  ('1025', 'Plano odontológico Bradesco', 'deduction'),
  ('001', 'Base INSS', 'base'),
  ('003', 'Base IRRF', 'base'),
  ('006', 'Base FGTS', 'base'),
  ('008', 'Valor FGTS', 'base'),
  ('017', 'RAIS', 'base'),
  ('018', 'GPS empresa', 'base'),
  ('019', 'GPS terceiros', 'base'),
  ('020', 'GPS RAT', 'base'),
  ('031', 'INSS folha', 'base'),
  ('032', 'INSS férias', 'base'),
  ('052', 'GPS INSS', 'base')
on conflict (code) do update set
  name = excluded.name,
  kind = excluded.kind,
  updated_at = now();

-- RLS should be enabled before production with policies by role:
-- employee, manager, hr, executive, admin.
-- During prototype, leave disabled or use development-only policies.
