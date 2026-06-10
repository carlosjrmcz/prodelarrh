-- ============================================================
-- PRODELAR RH - ASO, EPI, Atestados e campos de liderança
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hr_aso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.hr_companies(id),
  tipo text NOT NULL DEFAULT 'periodico',
  data_exame date NOT NULL,
  data_vencimento date,
  resultado text DEFAULT 'apto',
  medico text,
  crm text,
  clinica text,
  observacoes text,
  link_documento text,
  drive_file_id text,
  status text DEFAULT 'vigente',
  created_by uuid REFERENCES public.hr_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aso_employee ON public.hr_aso(employee_id);
CREATE INDEX IF NOT EXISTS idx_aso_vencimento ON public.hr_aso(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_aso_status ON public.hr_aso(status);
ALTER TABLE public.hr_aso ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'hr_aso'
      AND policyname = 'authenticated_only'
  ) THEN
    CREATE POLICY "authenticated_only" ON public.hr_aso
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.hr_epi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.hr_companies(id),
  item text NOT NULL,
  descricao text,
  numero_ca text,
  quantidade integer DEFAULT 1,
  data_entrega date,
  data_devolucao date,
  data_vencimento date,
  motivo text,
  status text DEFAULT 'ativo',
  link_imagem text,
  drive_file_id text,
  responsavel_entrega text,
  assinatura_colaborador boolean DEFAULT false,
  created_by uuid REFERENCES public.hr_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_epi_employee ON public.hr_epi(employee_id);
CREATE INDEX IF NOT EXISTS idx_epi_status ON public.hr_epi(status);
ALTER TABLE public.hr_epi ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'hr_epi'
      AND policyname = 'authenticated_only'
  ) THEN
    CREATE POLICY "authenticated_only" ON public.hr_epi
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.hr_atestados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.hr_companies(id),
  tipo text NOT NULL DEFAULT 'medico',
  data_inicio date NOT NULL,
  data_fim date,
  dias_afastamento integer,
  cid text,
  medico text,
  crm text,
  hospital_clinica text,
  observacoes text,
  link_documento text,
  drive_file_id text,
  status text DEFAULT 'pendente',
  impacta_folha boolean DEFAULT true,
  created_by uuid REFERENCES public.hr_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_atestados_employee ON public.hr_atestados(employee_id);
CREATE INDEX IF NOT EXISTS idx_atestados_status ON public.hr_atestados(status);
CREATE INDEX IF NOT EXISTS idx_atestados_data ON public.hr_atestados(data_inicio);
ALTER TABLE public.hr_atestados ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'hr_atestados'
      AND policyname = 'authenticated_only'
  ) THEN
    CREATE POLICY "authenticated_only" ON public.hr_atestados
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE public.hr_employees
  ADD COLUMN IF NOT EXISTS supervisor_employee_id uuid REFERENCES public.hr_employees(id),
  ADD COLUMN IF NOT EXISTS leadership_level text DEFAULT 'employee';
