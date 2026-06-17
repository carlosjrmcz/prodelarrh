-- Acesso seguro a documentos do Google Drive via Edge Function.
-- O app não deve expor links diretos de pasta/arquivo do Drive para usuários finais.

ALTER TABLE public.hr_profiles
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);

ALTER TABLE public.hr_employees
  ADD COLUMN IF NOT EXISTS supervisor_employee_id uuid REFERENCES public.hr_employees(id),
  ADD COLUMN IF NOT EXISTS leadership_level text DEFAULT 'employee';

CREATE INDEX IF NOT EXISTS idx_hr_profiles_auth_user_id
  ON public.hr_profiles (auth_user_id);

ALTER TABLE public.hr_employee_documents
  ADD COLUMN IF NOT EXISTS drive_file_id text,
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS raw_metadata jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_hr_employee_documents_drive_file
  ON public.hr_employee_documents (drive_file_id);

DROP POLICY IF EXISTS "hr_employee_documents_insert_own_or_rh" ON public.hr_employee_documents;
CREATE POLICY "hr_employee_documents_insert_own_or_rh"
ON public.hr_employee_documents
FOR INSERT TO authenticated
WITH CHECK (
  employee_id = (
    SELECT p.employee_id
    FROM public.hr_profiles p
    WHERE p.auth_user_id = auth.uid() OR p.id = auth.uid()
    LIMIT 1
  )
  OR EXISTS (
    SELECT 1
    FROM public.hr_profiles p
    WHERE (p.auth_user_id = auth.uid() OR p.id = auth.uid())
      AND COALESCE(p.is_active, true) = true
      AND p.role_code IN ('rh_admin', 'gestor_rh', 'rh', 'diretoria', 'diretor')
  )
);

ALTER TABLE public.hr_request_attachments
  ADD COLUMN IF NOT EXISTS drive_file_id text,
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS raw_metadata jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_hr_request_attachments_request
  ON public.hr_request_attachments (request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hr_request_attachments_document
  ON public.hr_request_attachments (document_id);

CREATE INDEX IF NOT EXISTS idx_hr_request_attachments_drive_file
  ON public.hr_request_attachments (drive_file_id);

DROP POLICY IF EXISTS "hr_request_attachments_all_scoped" ON public.hr_request_attachments;
CREATE POLICY "hr_request_attachments_all_scoped"
ON public.hr_request_attachments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.hr_requests r
    JOIN public.hr_profiles p
      ON (p.auth_user_id = auth.uid() OR p.id = auth.uid())
    WHERE r.id = request_id
      AND (
        r.employee_id = p.employee_id
        OR r.requester_employee_id = p.employee_id
        OR p.role_code IN ('rh_admin', 'gestor_rh', 'rh', 'diretoria', 'diretor', 'gestor', 'supervisor', 'gestor_financeiro')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.hr_requests r
    JOIN public.hr_profiles p
      ON (p.auth_user_id = auth.uid() OR p.id = auth.uid())
    WHERE r.id = request_id
      AND (
        r.employee_id = p.employee_id
        OR r.requester_employee_id = p.employee_id
        OR p.role_code IN ('rh_admin', 'gestor_rh', 'rh', 'diretoria', 'diretor', 'gestor', 'supervisor', 'gestor_financeiro')
      )
  )
);

ALTER TABLE public.hr_aso
  ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES public.hr_employee_documents(id),
  ADD COLUMN IF NOT EXISTS drive_file_id text;

ALTER TABLE public.hr_atestados
  ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES public.hr_employee_documents(id),
  ADD COLUMN IF NOT EXISTS drive_file_id text;

ALTER TABLE public.hr_epi
  ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES public.hr_employee_documents(id),
  ADD COLUMN IF NOT EXISTS drive_file_id text;

CREATE INDEX IF NOT EXISTS idx_hr_aso_document_id
  ON public.hr_aso (document_id);

CREATE INDEX IF NOT EXISTS idx_hr_atestados_document_id
  ON public.hr_atestados (document_id);

CREATE INDEX IF NOT EXISTS idx_hr_epi_document_id
  ON public.hr_epi (document_id);

CREATE TABLE IF NOT EXISTS public.hr_accounting_package_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accounting_package_id uuid REFERENCES public.hr_accounting_packages(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.hr_companies(id),
  competence_month date NOT NULL,
  item_key text NOT NULL,
  item_title text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'uploaded',
  original_file_name text,
  file_name text,
  storage_bucket text DEFAULT 'google_drive',
  storage_path text,
  drive_file_id text,
  file_url text,
  file_size_bytes bigint,
  mime_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  raw_metadata jsonb DEFAULT '{}'::jsonb,
  uploaded_by uuid REFERENCES public.hr_profiles(id),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, competence_month, item_key)
);

CREATE INDEX IF NOT EXISTS idx_hr_accounting_package_files_package
  ON public.hr_accounting_package_files (accounting_package_id);

CREATE INDEX IF NOT EXISTS idx_hr_accounting_package_files_scope
  ON public.hr_accounting_package_files (company_id, competence_month, item_key);

CREATE INDEX IF NOT EXISTS idx_hr_accounting_package_files_drive_file
  ON public.hr_accounting_package_files (drive_file_id);

ALTER TABLE public.hr_accounting_package_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hr_accounting_package_files_select_rh" ON public.hr_accounting_package_files;
CREATE POLICY "hr_accounting_package_files_select_rh"
ON public.hr_accounting_package_files
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.hr_profiles p
    WHERE (p.auth_user_id = auth.uid() OR p.id = auth.uid())
      AND COALESCE(p.is_active, true) = true
      AND p.role_code IN ('gestor_rh', 'rh', 'diretor', 'diretoria', 'gestor_financeiro', 'financeiro')
  )
);

DROP POLICY IF EXISTS "hr_accounting_package_files_write_rh" ON public.hr_accounting_package_files;
CREATE POLICY "hr_accounting_package_files_write_rh"
ON public.hr_accounting_package_files
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.hr_profiles p
    WHERE (p.auth_user_id = auth.uid() OR p.id = auth.uid())
      AND COALESCE(p.is_active, true) = true
      AND p.role_code IN ('gestor_rh', 'rh', 'diretoria', 'diretor', 'gestor_financeiro', 'financeiro')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.hr_profiles p
    WHERE (p.auth_user_id = auth.uid() OR p.id = auth.uid())
      AND COALESCE(p.is_active, true) = true
      AND p.role_code IN ('gestor_rh', 'rh', 'diretoria', 'diretor', 'gestor_financeiro', 'financeiro')
  )
);

DROP POLICY IF EXISTS "service_role_all" ON public.hr_accounting_package_files;
CREATE POLICY "service_role_all"
ON public.hr_accounting_package_files
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.hr_document_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL DEFAULT 'employee_document',
  source_id uuid,
  document_id uuid REFERENCES public.hr_employee_documents(id) ON DELETE CASCADE,
  request_attachment_id uuid REFERENCES public.hr_request_attachments(id) ON DELETE SET NULL,
  accounting_file_id uuid REFERENCES public.hr_accounting_package_files(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES public.hr_employees(id),
  requester_profile_id uuid REFERENCES public.hr_profiles(id),
  requester_auth_user_id uuid,
  action text NOT NULL CHECK (action IN ('view', 'download')),
  allowed boolean NOT NULL DEFAULT false,
  reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_document_access_logs
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'employee_document',
  ADD COLUMN IF NOT EXISTS source_id uuid,
  ADD COLUMN IF NOT EXISTS request_attachment_id uuid REFERENCES public.hr_request_attachments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accounting_file_id uuid REFERENCES public.hr_accounting_package_files(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hr_document_access_logs_document
  ON public.hr_document_access_logs (document_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hr_document_access_logs_source
  ON public.hr_document_access_logs (source_type, source_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hr_document_access_logs_employee
  ON public.hr_document_access_logs (employee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hr_document_access_logs_requester
  ON public.hr_document_access_logs (requester_profile_id, created_at DESC);

ALTER TABLE public.hr_document_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hr_document_access_logs_select_rh" ON public.hr_document_access_logs;
CREATE POLICY "hr_document_access_logs_select_rh"
ON public.hr_document_access_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.hr_profiles p
    WHERE (p.auth_user_id = auth.uid() OR p.id = auth.uid())
      AND COALESCE(p.is_active, true) = true
      AND p.role_code IN ('gestor_rh', 'rh', 'diretor', 'diretoria')
  )
);

DROP POLICY IF EXISTS "service_role_all" ON public.hr_document_access_logs;
CREATE POLICY "service_role_all"
ON public.hr_document_access_logs
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all" ON public.hr_employee_documents;
CREATE POLICY "service_role_all"
ON public.hr_employee_documents
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all" ON public.hr_request_attachments;
CREATE POLICY "service_role_all"
ON public.hr_request_attachments
FOR ALL TO service_role
USING (true)
WITH CHECK (true);
