-- Prodelar RH
-- Generic transactional email queue for HR workflows.
-- Same operational pattern used by the other Prodelar apps:
-- templates, event queue, delivery logs, status history and claim function.

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  app_name text not null,
  module_name text,
  template_key text not null,
  recipient_type text,
  subject_template text not null,
  body_template text not null,
  body_html_template text,
  is_active boolean not null default true,
  requires_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (app_name, template_key)
);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  app_name text not null,
  module_name text,
  event_type text not null,
  employee_id text,
  employee_name text,
  manager_id text,
  manager_name text,
  recipient_email text not null,
  recipient_name text,
  recipient_type text,
  cc text[] not null default '{}',
  bcc text[] not null default '{}',
  subject text,
  template_key text not null,
  payload jsonb not null default '{}'::jsonb,
  related_table text,
  related_record_id text,
  status text not null default 'pending'
    check (status in ('pending', 'waiting_review', 'processing', 'sent', 'failed', 'cancelled')),
  attempts integer not null default 0,
  last_error text,
  created_by text,
  created_at timestamptz not null default now(),
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  processing_started_at timestamptz
);

alter table public.email_templates
  add column if not exists module_name text,
  add column if not exists recipient_type text,
  add column if not exists body_html_template text,
  add column if not exists delivery_channel text not null default 'email_app',
  add column if not exists audience_scope text not null default 'individual',
  add column if not exists requires_review boolean not null default false;

alter table public.email_events
  add column if not exists module_name text,
  add column if not exists employee_id text,
  add column if not exists employee_name text,
  add column if not exists manager_id text,
  add column if not exists manager_name text,
  add column if not exists recipient_type text,
  add column if not exists created_by text;

alter table public.email_templates
  drop constraint if exists email_templates_delivery_channel_check;

alter table public.email_templates
  add constraint email_templates_delivery_channel_check
  check (delivery_channel in ('email', 'app', 'email_app'));

alter table public.email_templates
  drop constraint if exists email_templates_audience_scope_check;

alter table public.email_templates
  add constraint email_templates_audience_scope_check
  check (audience_scope in ('individual', 'collective'));

alter table public.email_templates
  drop constraint if exists email_templates_recipient_type_check;

alter table public.email_templates
  add constraint email_templates_recipient_type_check
  check (
    recipient_type is null
    or recipient_type in ('colaborador', 'gestor', 'rh', 'financeiro', 'diretoria', 'administrativo', 'interno')
  );

alter table public.email_events
  drop constraint if exists email_events_recipient_type_check;

alter table public.email_events
  add constraint email_events_recipient_type_check
  check (
    recipient_type is null
    or recipient_type in ('colaborador', 'gestor', 'rh', 'financeiro', 'diretoria', 'administrativo', 'interno')
  );

create table if not exists public.email_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  email_event_id uuid not null references public.email_events(id) on delete cascade,
  provider text not null,
  provider_message_id text,
  status text not null,
  test_mode boolean not null default false,
  original_recipient_email text,
  actual_recipient_email text,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.email_event_status_history (
  id uuid primary key default gen_random_uuid(),
  email_event_id uuid not null references public.email_events(id) on delete cascade,
  old_status text,
  new_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists email_events_pending_idx
  on public.email_events (status, scheduled_for, created_at)
  where status = 'pending';

create index if not exists email_events_app_event_idx
  on public.email_events (app_name, event_type, created_at desc);

create index if not exists email_events_module_event_idx
  on public.email_events (app_name, module_name, event_type, created_at desc);

create index if not exists email_events_employee_idx
  on public.email_events (employee_id, created_at desc);

create index if not exists email_events_related_idx
  on public.email_events (related_table, related_record_id, created_at desc);

create unique index if not exists email_events_no_duplicate_active_idx
  on public.email_events (
    app_name,
    module_name,
    event_type,
    template_key,
    related_table,
    related_record_id,
    recipient_email
  )
  where related_record_id is not null
    and status in ('pending', 'waiting_review', 'processing', 'sent');

create index if not exists email_delivery_logs_event_idx
  on public.email_delivery_logs (email_event_id, created_at desc);

create index if not exists email_event_status_history_event_idx
  on public.email_event_status_history (email_event_id, created_at desc);

create or replace function public.set_email_templates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_email_templates_updated_at on public.email_templates;
create trigger trg_email_templates_updated_at
before update on public.email_templates
for each row execute function public.set_email_templates_updated_at();

create or replace function public.log_email_event_status_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.email_event_status_history (email_event_id, old_status, new_status, note)
    values (new.id, null, new.status, 'created');
  elsif old.status is distinct from new.status then
    insert into public.email_event_status_history (email_event_id, old_status, new_status, note)
    values (new.id, old.status, new.status, new.last_error);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_email_events_status_history on public.email_events;
create trigger trg_email_events_status_history
after insert or update of status on public.email_events
for each row execute function public.log_email_event_status_change();

create or replace function public.claim_pending_email_events(batch_size integer default 20)
returns setof public.email_events
language sql
security definer
set search_path = public
as $$
  with claimed as (
    select id
    from public.email_events
    where status = 'pending'
      and scheduled_for <= now()
    order by scheduled_for asc, created_at asc
    limit greatest(1, least(batch_size, 20))
    for update skip locked
  )
  update public.email_events e
  set
    status = 'processing',
    attempts = attempts + 1,
    processing_started_at = now(),
    last_error = null
  from claimed
  where e.id = claimed.id
  returning e.*;
$$;

alter table public.email_templates enable row level security;
alter table public.email_events enable row level security;
alter table public.email_delivery_logs enable row level security;
alter table public.email_event_status_history enable row level security;

drop policy if exists authenticated_read_email_templates on public.email_templates;
create policy authenticated_read_email_templates
on public.email_templates for select to authenticated
using (true);

drop policy if exists authenticated_insert_email_events on public.email_events;
create policy authenticated_insert_email_events
on public.email_events for insert to authenticated
with check (true);

drop policy if exists authenticated_read_email_events on public.email_events;
create policy authenticated_read_email_events
on public.email_events for select to authenticated
using (true);

drop policy if exists authenticated_update_review_email_events on public.email_events;
create policy authenticated_update_review_email_events
on public.email_events for update to authenticated
using (status = 'waiting_review')
with check (status in ('pending', 'cancelled'));

drop policy if exists authenticated_read_email_delivery_logs on public.email_delivery_logs;
create policy authenticated_read_email_delivery_logs
on public.email_delivery_logs for select to authenticated
using (true);

drop policy if exists authenticated_read_email_event_status_history on public.email_event_status_history;
create policy authenticated_read_email_event_status_history
on public.email_event_status_history for select to authenticated
using (true);

insert into public.email_templates (
  app_name,
  module_name,
  template_key,
  recipient_type,
  subject_template,
  body_template,
  is_active,
  requires_review
)
values
  (
    'recursos_humanos',
    'admissao',
    'admissao_documentos_pendentes_colaborador',
    'colaborador',
    '[RH] Documentos pendentes para admissão',
    'Olá {{colaborador_nome}},\n\nPara avançarmos com sua admissão, precisamos receber ou validar os documentos abaixo:\n\n{{pendencias}}\n\nPrazo: {{prazo}}\nResponsável: {{responsavel}}\n\nAcesse o portal para acompanhar o processo:\n{{link}}\n',
    true,
    false
  ),
  (
    'recursos_humanos',
    'admissao',
    'primeiro_dia_colaborador',
    'colaborador',
    '[RH] Boas-vindas - orientações do primeiro dia',
    'Olá {{colaborador_nome}},\n\nSeja bem-vindo(a). Seu primeiro dia está previsto para {{data_inicio}}.\n\nEmpresa: {{empresa}}\nDepartamento: {{departamento}}\nCargo: {{cargo}}\nGestor: {{gestor_nome}}\n\nOrientações iniciais: {{orientacoes}}\n\n{{link}}\n',
    true,
    false
  ),
  (
    'recursos_humanos',
    'documentos',
    'documento_vencendo_colaborador',
    'colaborador',
    '[RH] Documento próximo do vencimento - {{tipo_documento}}',
    'Olá {{colaborador_nome}},\n\nO documento {{tipo_documento}} está próximo do vencimento.\n\nPrazo: {{prazo}}\nStatus atual: {{status}}\n\nAcesse o portal para regularizar:\n{{link}}\n',
    true,
    false
  ),
  (
    'recursos_humanos',
    'ferias',
    'ferias_aprovadas_colaborador',
    'colaborador',
    '[RH] Férias aprovadas - {{periodo}}',
    'Olá {{colaborador_nome}},\n\nSua programação de férias foi aprovada.\n\nPeríodo: {{data_inicio}} a {{data_fim}}\nEmpresa: {{empresa}}\nGestor: {{gestor_nome}}\n\n{{link}}\n',
    true,
    false
  ),
  (
    'recursos_humanos',
    'ferias',
    'ferias_proximas_colaborador',
    'colaborador',
    '[RH] Lembrete de férias - {{data_inicio}}',
    'Olá {{colaborador_nome}},\n\nSuas férias começam em {{data_inicio}} e terminam em {{data_fim}}.\n\nEm caso de dúvida, fale com {{responsavel}}.\n{{link}}\n',
    true,
    false
  ),
  (
    'recursos_humanos',
    'ferias',
    'retorno_ferias_colaborador',
    'colaborador',
    '[RH] Retorno de férias - {{data_fim}}',
    'Olá {{colaborador_nome}},\n\nEste é um lembrete de retorno de férias.\n\nData de retorno: {{data_retorno}}\nGestor: {{gestor_nome}}\n\n{{link}}\n',
    true,
    false
  ),
  (
    'recursos_humanos',
    'ponto',
    'pendencia_ponto_colaborador',
    'colaborador',
    '[RH] Pendência de ponto - {{prazo}}',
    'Olá {{colaborador_nome}},\n\nExiste uma pendência de ponto aguardando correção ou justificativa.\n\nMotivo: {{motivo}}\nPrazo: {{prazo}}\nStatus: {{status}}\n\n{{link}}\n',
    true,
    false
  ),
  (
    'recursos_humanos',
    'ponto',
    'ajuste_ponto_gestor',
    'gestor',
    '[RH] Ajuste de ponto aguardando aprovação',
    'Olá {{gestor_nome}},\n\nExiste um ajuste de ponto aguardando sua aprovação.\n\nColaborador: {{colaborador_nome}}\nDepartamento: {{departamento}}\nMotivo: {{motivo}}\nPrazo: {{prazo}}\n\n{{link}}\n',
    true,
    false
  ),
  (
    'recursos_humanos',
    'atestados',
    'atestado_pendente_rh',
    'rh',
    '[RH] Atestado aguardando validação',
    'Olá {{responsavel}},\n\nExiste um atestado aguardando validação do RH.\n\nColaborador: {{colaborador_nome}}\nDepartamento: {{departamento}}\nStatus: {{status}}\n\nAtenção: não incluir detalhes médicos no corpo do e-mail.\n{{link}}\n',
    true,
    true
  ),
  (
    'recursos_humanos',
    'avaliacoes',
    'avaliacao_pendente_gestor',
    'gestor',
    '[RH] Avaliação pendente - {{colaborador_nome}}',
    'Olá {{gestor_nome}},\n\nExiste uma avaliação pendente.\n\nColaborador: {{colaborador_nome}}\nCargo: {{cargo}}\nPrazo: {{prazo}}\n\n{{link}}\n',
    true,
    false
  ),
  (
    'recursos_humanos',
    'treinamentos',
    'treinamento_pendente_colaborador',
    'colaborador',
    '[RH] Treinamento obrigatório pendente',
    'Olá {{colaborador_nome}},\n\nVocê possui um treinamento obrigatório pendente.\n\nTreinamento: {{treinamento}}\nPrazo: {{prazo}}\nStatus: {{status}}\n\n{{link}}\n',
    true,
    false
  ),
  (
    'recursos_humanos',
    'folha',
    'dados_bancarios_pendentes_colaborador',
    'colaborador',
    '[RH] Dados bancários pendentes',
    'Olá {{colaborador_nome}},\n\nPrecisamos que você corrija ou envie seus dados bancários pelo portal.\n\nMotivo: {{motivo}}\nPrazo: {{prazo}}\n\nPor segurança, não responda este e-mail com dados bancários completos.\n{{link}}\n',
    true,
    true
  ),
  (
    'recursos_humanos',
    'desligamento',
    'desligamento_documentos_pendentes_colaborador',
    'colaborador',
    '[RH] Pendências no processo de desligamento',
    'Olá {{colaborador_nome}},\n\nExistem documentos ou etapas pendentes no seu processo de desligamento.\n\nPendências: {{pendencias}}\nResponsável: {{responsavel}}\nPrazo: {{prazo}}\n\n{{link}}\n',
    true,
    true
  ),
  (
    'recursos_humanos',
    'interno',
    'rh_precisa_validar_interno',
    'rh',
    '[RH] Validação interna necessária - {{event_type}}',
    'Olá {{responsavel}},\n\nExiste uma etapa aguardando validação interna do RH.\n\nProcesso: {{event_type}}\nColaborador: {{colaborador_nome}}\nStatus: {{status}}\nMotivo: {{motivo}}\n\n{{link}}\n',
    true,
    true
  ),
  (
    'recursos_humanos',
    'folha',
    'contracheque_disponivel',
    'colaborador',
    '[RH] Contracheque disponível - {{competencia}}',
    'Olá {{colaborador_nome}},\n\nSeu contracheque da competência {{competencia}} está disponível no portal.\n\nAcesse com login autenticado:\n{{link}}\n',
    true,
    false
  )
on conflict (app_name, template_key) do update set
  module_name = excluded.module_name,
  recipient_type = excluded.recipient_type,
  subject_template = excluded.subject_template,
  body_template = excluded.body_template,
  is_active = excluded.is_active,
  requires_review = excluded.requires_review,
  updated_at = now();

insert into public.email_templates (
  app_name,
  module_name,
  template_key,
  recipient_type,
  subject_template,
  body_template,
  is_active,
  requires_review,
  delivery_channel,
  audience_scope
)
values
  (
    'recursos_humanos',
    'admissao',
    'novo_colaborador_grupo',
    'interno',
    '[RH] Novo colaborador no Grupo Prodelar - {{colaborador_nome}}',
    'Olá,\n\nComunicamos a chegada de {{colaborador_nome}} ao Grupo Prodelar.\n\nEmpresa: {{empresa}}\nÁrea: {{departamento}}\nCargo: {{cargo}}\nInício: {{data_inicio}}\nGestor: {{gestor_nome}}\n\nDesejamos boas-vindas e sucesso nesta nova etapa.\n',
    true,
    true,
    'email_app',
    'collective'
  ),
  (
    'recursos_humanos',
    'desligamento',
    'desligamento_colaborador_grupo',
    'interno',
    '[RH] Comunicado de desligamento - {{colaborador_nome}}',
    'Olá,\n\nInformamos que {{colaborador_nome}} encerrou seu ciclo conosco em {{data_fim}}.\n\nAgradecemos pela contribuição ao Grupo Prodelar e desejamos sucesso em seus próximos caminhos.\n\nEste comunicado tem caráter informativo e deve ser tratado com respeito e discrição.\n',
    true,
    true,
    'email_app',
    'collective'
  ),
  (
    'recursos_humanos',
    'saude_ocupacional',
    'aso_vencendo_rh',
    'rh',
    '[RH] ASO próximo do vencimento - {{colaborador_nome}}',
    'Olá {{responsavel}},\n\nO ASO de {{colaborador_nome}} está próximo do vencimento.\n\nEmpresa: {{empresa}}\nÁrea: {{departamento}}\nVencimento: {{prazo}}\nStatus: {{status}}\n\nRegistre o encaminhamento sem inserir informação médica no e-mail.\n{{link}}\n',
    true,
    true,
    'email_app',
    'individual'
  ),
  (
    'recursos_humanos',
    'saude_ocupacional',
    'aso_vencido_rh',
    'rh',
    '[RH] ASO vencido - ação necessária',
    'Olá {{responsavel}},\n\nO ASO de {{colaborador_nome}} está vencido e exige regularização.\n\nEmpresa: {{empresa}}\nÁrea: {{departamento}}\nVencimento: {{prazo}}\n\nNão incluir dados médicos no corpo do e-mail.\n{{link}}\n',
    true,
    true,
    'email_app',
    'individual'
  ),
  (
    'recursos_humanos',
    'experiencia',
    'experiencia_45_dias_rh_lider',
    'gestor',
    '[RH] Experiência 45 dias - {{colaborador_nome}}',
    'Olá {{gestor_nome}},\n\nO colaborador {{colaborador_nome}} está próximo da avaliação de 45 dias.\n\nEmpresa: {{empresa}}\nÁrea: {{departamento}}\nCargo: {{cargo}}\nPrazo: {{prazo}}\n\nRegistre a avaliação pelo portal.\n{{link}}\n',
    true,
    false,
    'email_app',
    'individual'
  ),
  (
    'recursos_humanos',
    'experiencia',
    'experiencia_90_dias_rh_lider',
    'gestor',
    '[RH] Experiência 90 dias - {{colaborador_nome}}',
    'Olá {{gestor_nome}},\n\nO colaborador {{colaborador_nome}} está próximo da decisão de experiência de 90 dias.\n\nEmpresa: {{empresa}}\nÁrea: {{departamento}}\nCargo: {{cargo}}\nPrazo: {{prazo}}\n\nRegistre a decisão pelo portal.\n{{link}}\n',
    true,
    false,
    'email_app',
    'individual'
  ),
  (
    'recursos_humanos',
    'beneficios',
    'beneficio_solicitado_rh',
    'rh',
    '[RH] Benefício solicitado - {{colaborador_nome}}',
    'Olá {{responsavel}},\n\nExiste uma solicitação de benefício aguardando análise.\n\nColaborador: {{colaborador_nome}}\nBenefício: {{beneficio}}\nStatus: {{status}}\n\n{{link}}\n',
    true,
    false,
    'email_app',
    'individual'
  ),
  (
    'recursos_humanos',
    'beneficios',
    'beneficio_aprovado_colaborador',
    'colaborador',
    '[RH] Benefício aprovado - {{beneficio}}',
    'Olá {{colaborador_nome}},\n\nSua solicitação de benefício foi aprovada.\n\nBenefício: {{beneficio}}\nStatus: {{status}}\n\n{{link}}\n',
    true,
    false,
    'app',
    'individual'
  ),
  (
    'recursos_humanos',
    'beneficios',
    'beneficio_pendente_colaborador',
    'colaborador',
    '[RH] Pendência em benefício - {{beneficio}}',
    'Olá {{colaborador_nome}},\n\nExiste uma pendência na sua solicitação de benefício.\n\nBenefício: {{beneficio}}\nPendência: {{motivo}}\nPrazo: {{prazo}}\n\n{{link}}\n',
    true,
    true,
    'app',
    'individual'
  ),
  (
    'recursos_humanos',
    'ferias',
    'ferias_alteradas_colaborador',
    'colaborador',
    '[RH] Programação de férias alterada',
    'Olá {{colaborador_nome}},\n\nSua programação de férias foi atualizada.\n\nNovo período: {{data_inicio}} a {{data_fim}}\nGestor: {{gestor_nome}}\nStatus: {{status}}\n\nConsulte o portal para acompanhar.\n{{link}}\n',
    true,
    false,
    'app',
    'individual'
  ),
  (
    'recursos_humanos',
    'ferias',
    'ferias_alteradas_lider',
    'gestor',
    '[RH] Programação de férias alterada - {{colaborador_nome}}',
    'Olá {{gestor_nome}},\n\nA programação de férias de {{colaborador_nome}} foi alterada e aguarda ciência/aprovação conforme fluxo.\n\nPeríodo: {{data_inicio}} a {{data_fim}}\nLimite: {{prazo}}\n\n{{link}}\n',
    true,
    false,
    'email_app',
    'individual'
  ),
  (
    'recursos_humanos',
    'epi_equipamentos',
    'epi_equipamento_entrega_pendente_rh',
    'rh',
    '[RH] Entrega de EPI/equipamento pendente',
    'Olá {{responsavel}},\n\nExiste entrega de EPI/equipamento pendente.\n\nColaborador: {{colaborador_nome}}\nItem: {{item}}\nPrazo: {{prazo}}\n\n{{link}}\n',
    true,
    false,
    'email_app',
    'individual'
  ),
  (
    'recursos_humanos',
    'epi_equipamentos',
    'epi_equipamento_devolucao_pendente_rh',
    'rh',
    '[RH] Devolução de EPI/equipamento pendente',
    'Olá {{responsavel}},\n\nExiste devolução de EPI/equipamento pendente.\n\nColaborador: {{colaborador_nome}}\nItem: {{item}}\nPrazo: {{prazo}}\n\n{{link}}\n',
    true,
    false,
    'email_app',
    'individual'
  ),
  (
    'recursos_humanos',
    'comunicados',
    'comunicado_mural_colaborador',
    'colaborador',
    '[RH] Comunicado interno - {{titulo}}',
    'Olá {{colaborador_nome}},\n\nHá um novo comunicado do RH disponível no portal.\n\nTítulo: {{titulo}}\nPublicação: {{data_inicio}}\n\nA leitura pode ser confirmada pelo aplicativo.\n{{link}}\n',
    true,
    false,
    'app',
    'collective'
  ),
  (
    'recursos_humanos',
    'comunicados',
    'comunicado_leitura_pendente_colaborador',
    'colaborador',
    '[RH] Leitura de comunicado pendente',
    'Olá {{colaborador_nome}},\n\nExiste um comunicado aguardando sua confirmação de leitura.\n\nTítulo: {{titulo}}\nPrazo: {{prazo}}\n\n{{link}}\n',
    true,
    false,
    'app',
    'individual'
  )
on conflict (app_name, template_key) do update set
  module_name = excluded.module_name,
  recipient_type = excluded.recipient_type,
  subject_template = excluded.subject_template,
  body_template = excluded.body_template,
  is_active = excluded.is_active,
  requires_review = excluded.requires_review,
  delivery_channel = excluded.delivery_channel,
  audience_scope = excluded.audience_scope,
  updated_at = now();

update public.email_templates
set
  delivery_channel = case
    when template_key in (
      'beneficio_aprovado_colaborador',
      'beneficio_pendente_colaborador',
      'ferias_alteradas_colaborador',
      'comunicado_mural_colaborador',
      'comunicado_leitura_pendente_colaborador'
    ) then 'app'
    else 'email_app'
  end,
  audience_scope = case
    when template_key in ('novo_colaborador_grupo', 'desligamento_colaborador_grupo', 'comunicado_mural_colaborador') then 'collective'
    else 'individual'
  end,
  requires_review = case
    when template_key in (
      'atestado_pendente_rh',
      'dados_bancarios_pendentes_colaborador',
      'desligamento_documentos_pendentes_colaborador',
      'rh_precisa_validar_interno',
      'novo_colaborador_grupo',
      'desligamento_colaborador_grupo',
      'aso_vencendo_rh',
      'aso_vencido_rh',
      'beneficio_pendente_colaborador'
    ) then true
    else requires_review
  end,
  updated_at = now()
where app_name = 'recursos_humanos';
