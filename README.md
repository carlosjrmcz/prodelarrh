# Prodelar RH

Planejamento inicial do banco e app operacional de Recursos Humanos.

## Decisão de arquitetura

Criar um projeto Supabase separado para RH, com padrão parecido com os demais apps da Prodelar, mas sem misturar dados sensíveis de colaboradores com vendas, comissão, pós-vendas ou financeiro.

O sistema não calcula folha, férias, rescisão, INSS, FGTS ou impostos. Ele guarda dados, documentos, solicitações, aprovações, conferências, pacotes mensais e trilha de auditoria.

## Primeira migration

- `supabase/001_initial_schema.sql`

Ela cria a base para:

- colaboradores ativos/inativos;
- empresas, departamentos e cargos;
- documentos e buckets privados;
- tickets/solicitações de RH;
- admissão e desligamento;
- férias operacionais;
- banco de horas/horas extras para conferência;
- rubricas de folha para leitura/importação;
- pacotes mensais para contabilidade/Mastermaq;
- comunicados internos;
- linha do tempo do colaborador;
- importações iniciais de planilhas.

## Fonte oficial dos dados

O app deve consultar o Supabase como fonte oficial. Pastas locais e arquivos PDF/Excel ficam apenas como entrada de importação ou conferência temporária; depois do processamento, as informações operacionais precisam estar em tabelas do Supabase.

Migration complementar:

- `supabase/007_supabase_operational_source.sql`

Ela formaliza as rotinas mensais, pedidos de ajuste de ponto, validação mensal de ponto, alterações de férias e notas de linha do tempo. Com isso, testes entre colaborador, supervisor, gerente, diretoria e RH deixam de depender de `localStorage` ou leitura direta de pasta local.

## Central de e-mails

O app de RH usa a mesma arquitetura de e-mails operacionais usada nos outros sistemas:

- `email_templates`: modelos por `app_name = recursos_humanos`, módulo, destinatário e `template_key`;
- `email_events`: fila de eventos pendentes, em revisão, processando, enviados ou com falha;
- `email_delivery_logs`: logs de entrega por tentativa;
- `email_event_status_history`: histórico de status;
- `claim_pending_email_events`: função para o worker tomar posse dos envios pendentes sem duplicidade.

Cada template tem texto simples e pode ter HTML próprio. Quando o HTML não estiver cadastrado, a função de envio monta automaticamente um HTML padrão Grupo Prodelar / Recursos Humanos, mantendo a comunicação uniforme entre admissão, documentos, férias, ponto, folha, treinamentos e desligamento.

Migration:

- `supabase/005_email_events.sql`
- `supabase/functions/process-email-events/index.ts`
- `docs/email-notifications.md`

Eventos/templates iniciais:

- documentos pendentes de admissão;
- boas-vindas do primeiro dia;
- documento vencendo;
- férias aprovadas;
- férias próximas;
- retorno de férias;
- pendência de ponto;
- ajuste de ponto para gestor;
- atestado pendente para RH;
- avaliação pendente;
- treinamento pendente;
- dados bancários pendentes;
- pendências de desligamento;
- validação interna do RH;
- contracheque disponível.

O frontend nunca envia e-mail diretamente. Ele apenas grava eventos na fila. O envio real fica na Supabase Edge Function com Gmail API/Google Workspace, começando em `EMAIL_TEST_MODE=true` antes da produção.

## Insumos analisados

Foram considerados os arquivos enviados sobre:

- listagem/conferência de folha;
- relação de funcionários;
- salários líquidos;
- banco de horas e horas extras;
- previsão de férias;
- ficha de registro;
- documentação rescisória;
- modelos/manuais de admissão, demissão, ponto e envio à contabilidade.

Depois, o arquivo `Adimissão - Manual operacional.docx` abriu corretamente e foi incorporado ao desenho. A migration agora inclui os documentos admissionais obrigatórios e condicionais, além das travas operacionais do processo: formulário aprovado antes do início, documentação validada, ASO apto, checklist concluído e autorização formal do RH antes de o colaborador iniciar.

Alguns DOCX restantes do OneDrive ainda estavam como arquivos não materializados e não abriram diretamente no ambiente, então as demais áreas foram desenhadas com base nos PDFs/planilhas lidos e nos nomes/objetivos dos documentos informados.
