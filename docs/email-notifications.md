# Central de notificações por e-mail

Este módulo padroniza e-mails transacionais do app de Recursos Humanos. O frontend nunca envia e-mail diretamente: ele registra uma intenção em `email_events`, e uma função segura processa a fila usando Google Workspace.

## Estrutura

- `email_templates`: modelos por `app_name`, `module_name`, `template_key`, `recipient_type`, texto simples e HTML.
- `email_events`: fila com status `pending`, `waiting_review`, `processing`, `sent`, `failed` e `cancelled`.
- `email_delivery_logs`: uma linha por tentativa de entrega.
- `email_event_status_history`: histórico de mudanças de status.
- `claim_pending_email_events`: função SQL que marca eventos como `processing` com `for update skip locked`.
- `supabase/functions/process-email-events`: worker para Gmail API.

## Variáveis de ambiente

Obrigatórias para envio real:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_WORKSPACE_SENDER_EMAIL=
GOOGLE_WORKSPACE_CLIENT_ID=
GOOGLE_WORKSPACE_CLIENT_SECRET=
GOOGLE_WORKSPACE_REFRESH_TOKEN=
```

Controle operacional:

```env
EMAIL_TEST_MODE=true
EMAIL_TEST_RECIPIENT=
EMAIL_MAX_PER_BATCH=20
EMAIL_MAX_PER_HOUR=300
EMAIL_MAX_PER_DAY=1000
EMAIL_DAILY_ALERT_THRESHOLD=1000
EMAIL_PAUSE_AUTOMATIC=false
EMAIL_DEFAULT_INTERNAL_RECIPIENTS=
EMAIL_HR_RECIPIENTS=
EMAIL_FINANCE_RECIPIENTS=
EMAIL_DIRECTORS_RECIPIENTS=
```

## Fluxo

1. O app chama `queueEmail`.
2. Eventos normais entram como `pending`.
3. Eventos sensíveis entram como `waiting_review`.
4. Após revisão manual, o status muda para `pending`.
5. A função processadora monta assunto, texto simples e HTML padrão de comunicação.
6. A função processadora roda a cada 1 minuto e processa até 20 eventos.
7. Se enviar, marca `sent`.
8. Se falhar, reagenda: 5 minutos, 15 minutos, 1 hora; depois marca `failed`.

## HTML padrão de comunicação

Todo e-mail operacional deve ter duas versões:

- `body_template`: texto simples, usado como fallback e para auditoria rápida.
- `body_html_template`: HTML opcional para um template específico.

Quando `body_html_template` estiver vazio, a função monta automaticamente um HTML padrão do RH com:

- cabeçalho Grupo Prodelar / Recursos Humanos;
- título com o assunto;
- corpo renderizado a partir do texto simples;
- rodapé de segurança orientando o uso do portal autenticado.

Esse padrão evita cada módulo inventar um visual diferente e permite que admissão, férias, ponto, folha, documentos e desligamento usem a mesma identidade.

## Segurança

- Não colocar anexos sensíveis diretamente no e-mail.
- Usar links autenticados do portal.
- Não enviar salário, dados bancários completos ou dados médicos no corpo.
- Templates sensíveis devem ficar com `requires_review = true`.
- Em `EMAIL_TEST_MODE`, o envio real é redirecionado para `EMAIL_TEST_RECIPIENT`, mantendo o destinatário original no log.
- HTML não deve conter links públicos para documentos sensíveis; use links autenticados do app.

## Ativação no Supabase

1. Rodar `supabase/005_email_events.sql`.
2. Publicar a função `process-email-events`.
3. Configurar secrets reais no Supabase.
4. Criar agendamento de 1 minuto para chamar a função.
5. Começar em `EMAIL_TEST_MODE=true`.
