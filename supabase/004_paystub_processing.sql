-- Prodelar RH
-- Paystub PDF processing tables.

create table if not exists public.hr_paystub_import_batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.hr_companies(id),
  competence_month date,
  source_file_name text not null,
  source_storage_path text,
  local_input_path text,
  total_pages integer not null default 0,
  matched_pages integer not null default 0,
  unmatched_pages integer not null default 0,
  status text not null default 'uploaded',
  processed_at timestamptz,
  manifest jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_paystub_import_pages (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.hr_paystub_import_batches(id) on delete cascade,
  employee_id uuid references public.hr_employees(id),
  employee_code text,
  employee_name text,
  cpf text,
  page_number integer not null,
  output_file_name text,
  output_storage_path text,
  local_output_path text,
  match_method text,
  match_confidence text,
  extracted_text_sample text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists hr_paystub_import_pages_batch_idx
  on public.hr_paystub_import_pages(batch_id);

create index if not exists hr_paystub_import_pages_employee_idx
  on public.hr_paystub_import_pages(employee_id);

insert into public.hr_document_types (code, name, category, default_sensitivity, is_required_on_admission)
values ('paystub_processed', 'Contracheque processado individualmente', 'folha', 'employee_private', false)
on conflict (code) do update set
  name = excluded.name,
  category = excluded.category,
  default_sensitivity = excluded.default_sensitivity;
