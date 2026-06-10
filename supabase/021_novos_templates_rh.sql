alter table public.email_templates
  drop constraint if exists email_templates_recipient_type_check;

alter table public.email_templates
  add constraint email_templates_recipient_type_check
  check (
    recipient_type is null
    or recipient_type in ('colaborador', 'gestor', 'rh', 'financeiro', 'diretoria', 'administrativo', 'interno', 'grupo')
  );

alter table public.email_templates
  drop constraint if exists email_templates_audience_scope_check;

alter table public.email_templates
  add constraint email_templates_audience_scope_check
  check (audience_scope in ('individual', 'collective', 'grupo'));

insert into public.email_templates (
  app_name,
  module_name,
  template_key,
  recipient_type,
  subject_template,
  body_template,
  delivery_channel,
  audience_scope,
  is_active
) values
('recursos_humanos','contrato','contrato_experiencia_vencendo','colaborador','[RH] Contrato de experiência vence em breve - {{colaborador_nome}}','Olá {{colaborador_nome}},

Seu contrato de experiência vence em {{prazo}}.

Empresa: {{empresa}}
Cargo: {{cargo}}
Gestor: {{gestor_nome}}

O RH entrará em contato sobre a decisão.
{{link}}','email_app','individual',true),
('recursos_humanos','contrato','contrato_experiencia_renovado','colaborador','[RH] Contrato efetivado - {{colaborador_nome}}','Olá {{colaborador_nome}},

Temos o prazer de informar que seu contrato foi efetivado.

Empresa: {{empresa}}
Cargo: {{cargo}}
Data: {{data}}

Parabéns e bem-vindo(a) definitivamente ao time!
{{link}}','email_app','individual',true),
('recursos_humanos','contrato','contrato_experiencia_encerrado','colaborador','[RH] Encerramento de contrato de experiência','Olá {{colaborador_nome}},

Informamos que seu contrato de experiência foi encerrado em {{data}}.

Agradecemos sua dedicação.
O RH entrará em contato com as orientações finais.
{{link}}','email_app','individual',true),
('recursos_humanos','folha','pagamento_salario_processado','colaborador','[RH] Salário processado - {{competencia}}','Olá {{colaborador_nome}},

Seu salário referente a {{competencia}} foi processado.

Empresa: {{empresa}}
Previsão de crédito: {{data_credito}}

Seu contracheque está disponível no portal.
{{link}}','email_app','individual',true),
('recursos_humanos','folha','decimo_terceiro_primeira_parcela','colaborador','[RH] 13º salário - 1ª parcela disponível','Olá {{colaborador_nome}},

A 1ª parcela do 13º salário foi processada.

Empresa: {{empresa}}
Competência: {{competencia}}
Previsão de crédito: {{data_credito}}
{{link}}','email_app','individual',true),
('recursos_humanos','folha','decimo_terceiro_segunda_parcela','colaborador','[RH] 13º salário - 2ª parcela disponível','Olá {{colaborador_nome}},

A 2ª parcela do 13º salário foi processada.

Empresa: {{empresa}}
Competência: {{competencia}}
Previsão de crédito: {{data_credito}}
{{link}}','email_app','individual',true),
('recursos_humanos','documentos','documento_vencido_colaborador','colaborador','[RH] Documento vencido - {{tipo_documento}}','Olá {{colaborador_nome}},

O documento {{tipo_documento}} está vencido.

Vencimento: {{prazo}}
Status: {{status}}

Regularize o quanto antes:
{{link}}','email_app','individual',true),
('recursos_humanos','documentos','cnh_vencendo_motorista','colaborador','[RH] CNH próxima do vencimento','Olá {{colaborador_nome}},

Sua CNH está próxima do vencimento.

Vencimento: {{prazo}}

Renove com antecedência.
{{link}}','email_app','individual',true),
('recursos_humanos','comunicados','aniversario_colaborador','colaborador','[RH] Feliz aniversário, {{colaborador_nome}}! 🎉','Olá {{colaborador_nome}},

O Grupo Prodelar deseja a você um feliz aniversário!

Que este novo ano seja repleto de realizações.

Equipe RH · Grupo Prodelar','email_app','individual',true),
('recursos_humanos','comunicados','aniversario_empresa_colaborador','colaborador','[RH] Parabéns pelo seu aniversário de empresa! 🏆','Olá {{colaborador_nome}},

Hoje você completa {{anos}} anos conosco!

Obrigado pela sua dedicação ao Grupo Prodelar.

Equipe RH','email_app','individual',true),
('recursos_humanos','comunicados','comunicado_avulso_individual','colaborador','{{assunto}}','Olá {{colaborador_nome}},

{{mensagem}}

{{observacao}}

Equipe RH · Grupo Prodelar
{{link}}','email_app','individual',true),
('recursos_humanos','comunicados','comunicado_avulso_departamento','grupo','[RH] {{assunto}} - {{departamento}}','Olá equipe {{departamento}},

{{mensagem}}

{{observacao}}

Equipe RH · Grupo Prodelar','email_app','grupo',true),
('recursos_humanos','comunicados','comunicado_avulso_empresa','grupo','[RH] {{assunto}} - {{empresa}}','Prezados colaboradores {{empresa}},

{{mensagem}}

{{observacao}}

Equipe RH · Grupo Prodelar','email_app','grupo',true),
('recursos_humanos','comunicados','comunicado_avulso_grupo','grupo','[RH] {{assunto}} - Grupo Prodelar','Prezados colaboradores,

{{mensagem}}

{{observacao}}

Equipe RH · Grupo Prodelar','email_app','grupo',true),
('recursos_humanos','saude_ocupacional','epi_entregue_colaborador','colaborador','[RH] EPI/Equipamento entregue - confirmação','Olá {{colaborador_nome}},

Confirmamos a entrega:

Item: {{item}}
Data: {{data}}
Responsável: {{responsavel}}

Guarde este registro.
{{link}}','email_app','individual',true),
('recursos_humanos','saude_ocupacional','afastamento_iniciado_rh','interno','[RH] Afastamento registrado - {{colaborador_nome}}','Olá {{responsavel}},

{{colaborador_nome}} iniciou afastamento.

Tipo: {{tipo_afastamento}}
Início: {{data_inicio}}
Previsão retorno: {{data_retorno}}
Empresa: {{empresa}}

{{link}}','email_app','individual',true),
('recursos_humanos','relatorios','relatorio_mensal_diretoria','interno','[RH] Relatório mensal - {{competencia}}','Prezada diretoria,

Resumo RH - {{competencia}}:

Total colaboradores: {{total_colaboradores}}
Admissões: {{admissoes}}
Desligamentos: {{desligamentos}}
Férias programadas: {{ferias}}
ASOs vencendo: {{asos}}

Detalhes no portal:
{{link}}','email','grupo',true),
('recursos_humanos','acesso','reset_senha_colaborador','colaborador','[RH] Redefinição de senha autorizada','Olá {{colaborador_nome}},

Sua senha foi redefinida pelo RH.

Sua senha temporária é o seu primeiro nome em letras minúsculas.

Acesse o portal e cadastre uma nova senha:
{{link}}','email_app','individual',true)
on conflict (app_name, template_key) do update set
  module_name = excluded.module_name,
  recipient_type = excluded.recipient_type,
  subject_template = excluded.subject_template,
  body_template = excluded.body_template,
  delivery_channel = excluded.delivery_channel,
  audience_scope = excluded.audience_scope,
  is_active = excluded.is_active;

update public.email_templates
set body_html_template =
  '<!doctype html>' ||
  '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' ||
  '<title>' || subject_template || '</title></head>' ||
  '<body style="margin:0;padding:0;background:#f3f7f5;font-family:Arial,Helvetica,sans-serif;color:#20302a;">' ||
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f3f7f5;padding:0;margin:0;"><tr><td align="center" style="padding:24px 12px;">' ||
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:640px;background:#ffffff;border:1px solid #dbe7e0;">' ||
  '<tr><td style="background:#1a5c3a;color:#ffffff;padding:22px 24px;font-size:18px;font-weight:700;">Recursos Humanos · Grupo Prodelar</td></tr>' ||
  '<tr><td style="background:#e87722;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>' ||
  '<tr><td style="padding:24px;">' ||
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="padding:0 0 14px 0;font-size:22px;line-height:28px;font-weight:700;color:#18352a;">' || subject_template || '</td></tr></table>' ||
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 18px 0;"><tr><td style="border-left:5px solid ' ||
    case
      when template_key ~ '(vencido|encerrado|desligamento|falha|erro|reprovado|afastamento)' then '#b42318'
      when template_key ~ '(pendente|vencendo|atestado|experiencia|cnh)' then '#b7791f'
      when template_key ~ '(contracheque|salario|decimo|folha|relatorio)' then '#1f6fb2'
      when template_key ~ '(aprovad|renovado|primeiro|entregue|aniversario|efetivado)' then '#1a7f4b'
      else '#667085'
    end ||
  ';background:' ||
    case
      when template_key ~ '(vencido|encerrado|desligamento|falha|erro|reprovado|afastamento)' then '#fcebeb'
      when template_key ~ '(pendente|vencendo|atestado|experiencia|cnh)' then '#faeeda'
      when template_key ~ '(contracheque|salario|decimo|folha|relatorio)' then '#e6f1fb'
      when template_key ~ '(aprovad|renovado|primeiro|entregue|aniversario|efetivado)' then '#eaf3de'
      else '#eef2f1'
    end ||
  ';padding:12px 14px;font-size:14px;line-height:20px;font-weight:700;color:#20302a;">' ||
    case
      when template_key ~ '(vencido|encerrado|desligamento|falha|erro|reprovado|afastamento)' then 'Atenção necessária'
      when template_key ~ '(pendente|vencendo|atestado|experiencia|cnh)' then 'Pendente de acompanhamento'
      when template_key ~ '(contracheque|salario|decimo|folha|relatorio)' then 'Informação disponível'
      when template_key ~ '(aprovad|renovado|primeiro|entregue|aniversario|efetivado)' then 'Concluído'
      else 'Comunicado RH'
    end ||
  '</td></tr></table>' ||
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 18px 0;border:1px solid #dbe7e0;">' ||
  '<tr><td style="padding:9px 12px;border-bottom:1px solid #dbe7e0;background:#f8fbf9;font-size:12px;font-weight:700;color:#52665e;">Campo</td><td style="padding:9px 12px;border-bottom:1px solid #dbe7e0;background:#f8fbf9;font-size:12px;font-weight:700;color:#52665e;">Valor</td></tr>' ||
  '<tr><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#52665e;">Colaborador</td><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#20302a;">{{colaborador_nome}}</td></tr>' ||
  '<tr><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#52665e;">Empresa</td><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#20302a;">{{empresa}}</td></tr>' ||
  '<tr><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#52665e;">Departamento/Cargo</td><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#20302a;">{{departamento}} {{cargo}}</td></tr>' ||
  '<tr><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#52665e;">Competência</td><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#20302a;">{{competencia}}</td></tr>' ||
  '<tr><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#52665e;">Prazo/Data</td><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#20302a;">{{prazo}} {{data}} {{data_credito}}</td></tr>' ||
  '<tr><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#52665e;">Responsável/Gestor</td><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#20302a;">{{responsavel}} {{gestor_nome}}</td></tr>' ||
  '<tr><td style="padding:9px 12px;font-size:13px;color:#52665e;">Status/Observação</td><td style="padding:9px 12px;font-size:13px;color:#20302a;">{{status}} {{observacao}}</td></tr>' ||
  '</table>' ||
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px 0;"><tr><td style="font-size:15px;line-height:23px;color:#20302a;">' ||
  replace(coalesce(body_template, ''), E'\n', '<br>') ||
  '</td></tr></table>' ||
  '<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 4px 0;"><tr><td bgcolor="#1a5c3a" style="border-radius:4px;"><a href="{{link}}" style="display:inline-block;padding:12px 18px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Acessar portal</a></td></tr></table>' ||
  '</td></tr>' ||
  '<tr><td style="background:#f8fbf9;border-top:1px solid #dbe7e0;padding:16px 24px;font-size:12px;line-height:18px;color:#667085;">Mensagem automática · rh@grupoprodelar.com.br</td></tr>' ||
  '</table>' ||
  '</td></tr></table>' ||
  '</body></html>'
where app_name = 'recursos_humanos';
