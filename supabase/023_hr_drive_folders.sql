CREATE TABLE IF NOT EXISTS public.hr_drive_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_type text NOT NULL,
  folder_name text NOT NULL,
  drive_folder_id text,
  drive_folder_url text,
  parent_folder_id uuid REFERENCES public.hr_drive_folders(id),
  employee_id uuid REFERENCES public.hr_employees(id),
  company_id uuid REFERENCES public.hr_companies(id),
  competence_month text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drive_folders_type
  ON public.hr_drive_folders(folder_type);

CREATE INDEX IF NOT EXISTS idx_drive_folders_employee
  ON public.hr_drive_folders(employee_id);

ALTER TABLE public.hr_drive_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_only" ON public.hr_drive_folders;

CREATE POLICY "authenticated_only"
ON public.hr_drive_folders
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

INSERT INTO public.hr_drive_folders (folder_type, folder_name)
SELECT folder_type, folder_name
FROM (
  VALUES
    ('colaboradores', 'Colaboradores'),
    ('importacao_fichas', 'Importações/Fichas funcionais'),
    ('importacao_ferias', 'Importações/Previsão de férias'),
    ('importacao_contracheques', 'Importações/Contracheques'),
    ('importacao_folha', 'Importações/Folha bruta'),
    ('pacote_mensal', 'Pacote mensal contabilidade'),
    ('rotinas', 'Rotinas'),
    ('comunicados', 'Comunicados')
) AS seed(folder_type, folder_name)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.hr_drive_folders existing
  WHERE existing.folder_type = seed.folder_type
    AND existing.employee_id IS NULL
    AND existing.company_id IS NULL
    AND existing.competence_month IS NULL
);
