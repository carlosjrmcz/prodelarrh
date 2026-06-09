-- Prodelar RH
-- Additional transactional email templates for HR routines.

insert into public.email_templates (
  app_name,
  module_name,
  template_key,
  recipient_type,
  subject_template,
  body_template,
  body_html_template,
  is_active,
  delivery_channel,
  audience_scope,
  requires_review
)
values
  ('recursos_humanos', 'controles_rh', 'atestado_recebido_rh', 'rh', '[RH] Atestado recebido - {{colaborador_nome}}', 'Atestado recebido de {{colaborador_nome}} em {{data_evento}}. Prazo de análise: {{prazo}}.', '<p>Atestado recebido de <strong>{{colaborador_nome}}</strong> em {{data_evento}}.</p><p>Prazo de análise: {{prazo}}.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'controles_rh', 'atestado_pendente_colaborador', 'colaborador', '[RH] Pendência no atestado', 'Olá {{colaborador_nome}}, existe pendência no atestado: {{pendencia}}. Acesse {{link}}.', '<p>Olá {{colaborador_nome}}, existe pendência no atestado: <strong>{{pendencia}}</strong>.</p><p><a href="{{link}}">Acessar portal</a></p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'controles_rh', 'experiencia_30_dias_gestor', 'gestor', '[RH] Contrato de experiência - 30 dias', '{{colaborador_nome}} completa 30 dias em {{data_evento}}. Registre a avaliação.', '<p><strong>{{colaborador_nome}}</strong> completa 30 dias em {{data_evento}}.</p><p>Registre a avaliação.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'controles_rh', 'experiencia_60_dias_gestor', 'gestor', '[RH] Contrato de experiência - 60 dias', '{{colaborador_nome}} completa 60 dias em {{data_evento}}. Registre a avaliação.', '<p><strong>{{colaborador_nome}}</strong> completa 60 dias em {{data_evento}}.</p><p>Registre a avaliação.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'controles_rh', 'experiencia_90_dias_rh', 'rh', '[RH] Vencimento de experiência - {{colaborador_nome}}', 'Contrato de experiência de {{colaborador_nome}} vence em {{data_evento}}.', '<p>Contrato de experiência de <strong>{{colaborador_nome}}</strong> vence em {{data_evento}}.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'rotinas_rh', 'rotina_mensal_aberta_rh', 'rh', '[RH] Rotina mensal aberta - {{competencia}}', 'A rotina {{rotina_nome}} foi aberta para {{competencia}}. Vencimento: {{prazo}}.', '<p>A rotina <strong>{{rotina_nome}}</strong> foi aberta para {{competencia}}.</p><p>Vencimento: {{prazo}}.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'rotinas_rh', 'rotina_mensal_atrasada_rh', 'rh', '[RH] Rotina mensal atrasada - {{rotina_nome}}', 'A rotina {{rotina_nome}} está atrasada desde {{prazo}}.', '<p>A rotina <strong>{{rotina_nome}}</strong> está atrasada desde {{prazo}}.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'rotinas_rh', 'tarefa_rh_atribuida', 'rh', '[RH] Nova tarefa - {{titulo}}', 'Nova tarefa atribuída: {{titulo}}. Vencimento: {{prazo}}.', '<p>Nova tarefa atribuída: <strong>{{titulo}}</strong>.</p><p>Vencimento: {{prazo}}.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'rotinas_rh', 'tarefa_rh_vencendo', 'rh', '[RH] Tarefa vencendo - {{titulo}}', 'A tarefa {{titulo}} vence em {{prazo}}.', '<p>A tarefa <strong>{{titulo}}</strong> vence em {{prazo}}.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'rotinas_rh', 'tarefa_rh_concluida', 'rh', '[RH] Tarefa concluída - {{titulo}}', 'A tarefa {{titulo}} foi concluída por {{responsavel}}.', '<p>A tarefa <strong>{{titulo}}</strong> foi concluída por {{responsavel}}.</p>', true, 'app', 'individual', false),
  ('recursos_humanos', 'documentos', 'documento_validacao_pendente_rh', 'rh', '[RH] Documento aguardando validação', '{{colaborador_nome}} enviou {{tipo_documento}} para validação.', '<p><strong>{{colaborador_nome}}</strong> enviou {{tipo_documento}} para validação.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'documentos', 'documento_aprovado_colaborador', 'colaborador', '[RH] Documento aprovado - {{tipo_documento}}', 'Olá {{colaborador_nome}}, o documento {{tipo_documento}} foi aprovado.', '<p>Olá {{colaborador_nome}}, o documento <strong>{{tipo_documento}}</strong> foi aprovado.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'documentos', 'documento_reprovado_colaborador', 'colaborador', '[RH] Documento reprovado - {{tipo_documento}}', 'Olá {{colaborador_nome}}, o documento {{tipo_documento}} precisa de correção: {{motivo}}.', '<p>Olá {{colaborador_nome}}, o documento <strong>{{tipo_documento}}</strong> precisa de correção: {{motivo}}.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'ferias', 'ferias_saldo_critico_rh', 'rh', '[RH] Saldo de férias crítico', '{{colaborador_nome}} possui saldo crítico de férias: {{saldo}} dias.', '<p><strong>{{colaborador_nome}}</strong> possui saldo crítico de férias: {{saldo}} dias.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'admissao', 'admissao_inicio_processo_gestor', 'gestor', '[RH] Admissão iniciada - {{colaborador_nome}}', 'O processo de admissão de {{colaborador_nome}} foi iniciado.', '<p>O processo de admissão de <strong>{{colaborador_nome}}</strong> foi iniciado.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'desligamento', 'desligamento_checklist_rh', 'rh', '[RH] Checklist de desligamento - {{colaborador_nome}}', 'Checklist de desligamento aberto para {{colaborador_nome}}. Prazo: {{prazo}}.', '<p>Checklist de desligamento aberto para <strong>{{colaborador_nome}}</strong>.</p><p>Prazo: {{prazo}}.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'folha', 'folha_importacao_concluida_rh', 'rh', '[RH] Importação da folha concluída - {{competencia}}', 'Importação da folha concluída para {{competencia}}. Processados: {{total_processados}}.', '<p>Importação da folha concluída para {{competencia}}.</p><p>Processados: {{total_processados}}.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'folha', 'folha_importacao_erro_rh', 'rh', '[RH] Erro na importação da folha - {{competencia}}', 'Erro na importação da folha {{competencia}}: {{erro}}.', '<p>Erro na importação da folha {{competencia}}:</p><p>{{erro}}</p>', true, 'email_app', 'individual', true),
  ('recursos_humanos', 'workspace', 'drive_arquivo_recebido_rh', 'rh', '[RH] Arquivo recebido no Drive - {{arquivo_nome}}', 'Arquivo recebido: {{arquivo_nome}}. Origem: {{origem}}.', '<p>Arquivo recebido: <strong>{{arquivo_nome}}</strong>.</p><p>Origem: {{origem}}.</p>', true, 'email_app', 'individual', false),
  ('recursos_humanos', 'workspace', 'gmail_evento_processado_rh', 'rh', '[RH] Evento de e-mail processado', 'Evento {{event_type}} processado para {{recipient_email}} com status {{status}}.', '<p>Evento {{event_type}} processado para {{recipient_email}} com status <strong>{{status}}</strong>.</p>', true, 'app', 'individual', false)
on conflict (app_name, template_key) do update set
  module_name = excluded.module_name,
  recipient_type = excluded.recipient_type,
  subject_template = excluded.subject_template,
  body_template = excluded.body_template,
  body_html_template = excluded.body_html_template,
  is_active = excluded.is_active,
  delivery_channel = excluded.delivery_channel,
  audience_scope = excluded.audience_scope,
  requires_review = excluded.requires_review,
  updated_at = now();

