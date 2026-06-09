select cron.unschedule(jobid)
from cron.job
where jobname in (
  'rh-aniversario-colaborador',
  'rh-ferias-vencendo',
  'rh-experiencia-45dias'
);

select cron.schedule(
  'rh-aniversario-colaborador',
  '0 8 * * *',
  $$
  insert into public.email_events (
    app_name, module_name, event_type,
    employee_id, recipient_email, recipient_name, recipient_type,
    template_key, payload, status, scheduled_for
  )
  select
    'recursos_humanos', 'comunicados', 'aniversario_colaborador',
    e.id::text, e.email, e.full_name, 'colaborador',
    'aniversario_colaborador',
    public.resolve_email_payload(e.id),
    'pending', now()
  from public.hr_employees e
  where
    extract(month from e.birth_date) = extract(month from current_date)
    and extract(day from e.birth_date) = extract(day from current_date)
    and e.status = 'active'
    and e.email is not null
    and e.email <> '';
  $$
);

select cron.schedule(
  'rh-ferias-vencendo',
  '0 6 * * *',
  $$
  insert into public.email_events (
    app_name, module_name, event_type,
    employee_id, recipient_email, recipient_name, recipient_type,
    template_key, payload, status, scheduled_for
  )
  select
    'recursos_humanos', 'ferias', 'ferias_vencendo_aviso',
    e.id::text, e.email, e.full_name, 'colaborador',
    'ferias_proximas_colaborador',
    public.resolve_email_payload(e.id, jsonb_build_object(
      'data_inicio', vp.planned_start,
      'data_fim', vp.planned_end,
      'responsavel', 'RH Prodelar'
    )),
    'pending', now()
  from public.hr_vacation_periods vp
  join public.hr_employees e on e.id = vp.employee_id
  where
    vp.legal_limit_date = current_date + interval '60 days'
    and vp.status = 'pending'
    and e.status = 'active'
    and e.email is not null
    and e.email <> '';
  $$
);

select cron.schedule(
  'rh-experiencia-45dias',
  '0 7 * * *',
  $$
  insert into public.email_events (
    app_name, module_name, event_type,
    employee_id, recipient_email, recipient_name, recipient_type,
    template_key, payload, status, scheduled_for
  )
  select
    'recursos_humanos', 'experiencia', 'avaliacao_45_dias',
    e.id::text,
    gestor.email,
    gestor.full_name,
    'gestor',
    'experiencia_45_dias_rh_lider',
    public.resolve_email_payload(e.id, jsonb_build_object(
      'prazo', e.admission_date + interval '45 days'
    )),
    'pending', now()
  from public.hr_employees e
  join public.hr_employees gestor on gestor.id = e.manager_employee_id
  where
    e.admission_date + interval '38 days' = current_date
    and e.status = 'active'
    and gestor.email is not null
    and gestor.email <> '';
  $$
);

