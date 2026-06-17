CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.hr_admission_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  request_id uuid REFERENCES public.hr_requests(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.hr_companies(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.hr_departments(id) ON DELETE SET NULL,
  position_id uuid REFERENCES public.hr_positions(id) ON DELETE SET NULL,
  converted_employee_id uuid REFERENCES public.hr_employees(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  cpf text,
  email text,
  phone text,
  company_name text,
  department_name text,
  role_name text,
  planned_admission_date date,
  notes text,
  status text NOT NULL DEFAULT 'waiting_candidate',
  candidate_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  document_manifest jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES public.hr_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  converted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hr_admission_candidates_token ON public.hr_admission_candidates(public_token);
CREATE INDEX IF NOT EXISTS idx_hr_admission_candidates_status ON public.hr_admission_candidates(status);
CREATE INDEX IF NOT EXISTS idx_hr_admission_candidates_request ON public.hr_admission_candidates(request_id);

ALTER TABLE public.hr_admission_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_manage_admission_candidates" ON public.hr_admission_candidates;
CREATE POLICY "authenticated_manage_admission_candidates"
ON public.hr_admission_candidates
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.get_admission_candidate_by_token(p_token text)
RETURNS TABLE (
  public_token text,
  full_name text,
  cpf text,
  email text,
  phone text,
  company_name text,
  department_name text,
  role_name text,
  planned_admission_date date,
  status text,
  candidate_payload jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.public_token,
    c.full_name,
    c.cpf,
    c.email,
    c.phone,
    c.company_name,
    c.department_name,
    c.role_name,
    c.planned_admission_date,
    c.status,
    c.candidate_payload
  FROM public.hr_admission_candidates c
  WHERE c.public_token = p_token
    AND c.status IN ('waiting_candidate', 'submitted');
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_admission_candidate_by_token(
  p_token text,
  p_payload jsonb,
  p_documents jsonb DEFAULT '[]'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.hr_admission_candidates
  SET
    candidate_payload = COALESCE(p_payload, '{}'::jsonb),
    document_manifest = COALESCE(p_documents, '[]'::jsonb),
    full_name = COALESCE(NULLIF(p_payload->>'name', ''), full_name),
    cpf = COALESCE(NULLIF(p_payload->>'cpf', ''), cpf),
    email = COALESCE(NULLIF(p_payload->>'email', ''), email),
    phone = COALESCE(NULLIF(p_payload->>'phone', ''), phone),
    status = 'submitted',
    submitted_at = COALESCE(submitted_at, now()),
    updated_at = now()
  WHERE public_token = p_token
    AND status <> 'converted';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admission_candidate_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_admission_candidate_by_token(text, jsonb, jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admission_candidate_token_exists(p_token text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hr_admission_candidates
    WHERE public_token = p_token
      AND status <> 'converted'
  );
$$;

GRANT EXECUTE ON FUNCTION public.admission_candidate_token_exists(text) TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('hr-admission-documents', 'hr-admission-documents', false, 20971520)
ON CONFLICT (id) DO UPDATE
SET public = excluded.public,
    file_size_limit = excluded.file_size_limit;

DROP POLICY IF EXISTS "anon_insert_admission_candidate_docs" ON storage.objects;
CREATE POLICY "anon_insert_admission_candidate_docs"
ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'hr-admission-documents'
  AND (storage.foldername(name))[1] = 'admission'
  AND public.admission_candidate_token_exists((storage.foldername(name))[2])
);

DROP POLICY IF EXISTS "authenticated_read_admission_candidate_docs" ON storage.objects;
CREATE POLICY "authenticated_read_admission_candidate_docs"
ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'hr-admission-documents');
