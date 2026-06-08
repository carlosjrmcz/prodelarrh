# Checklist de homologação e produção

Este app deve subir como sistema estático no Netlify, com Supabase como base operacional e Google Workspace como camada de arquivos/e-mail.

## Antes de publicar

- Rodar `npm run build` e testar `dist/index.html` pelo servidor local.
- Confirmar que o app abre pela URL `/?r=20260521-production-ready`.
- Aplicar as migrations do Supabase em ordem e revisar políticas antes de produção real.
- Não usar `supabase/003_dev_open_policies.sql` em produção sem trocar por RLS restrito por perfil.
- Manter `EMAIL_TEST_MODE=true` até validar Gmail/Workspace.
- Manter `Google Workspace Storage` em modo teste até credenciais e pastas estarem validadas.

## Supabase

- Banco oficial de colaboradores, férias, solicitações, permissões, documentos e eventos.
- PDFs e anexos pesados devem ficar no Google Drive; no Supabase ficam apenas metadados, IDs de arquivo/pasta e links controlados.
- Antes de produção real, trocar o modo de desenvolvimento aberto por políticas RLS por usuário/perfil.

## Google Workspace

Variáveis/segredos previstos:

- `GOOGLE_WORKSPACE_SENDER_EMAIL`
- `GOOGLE_WORKSPACE_CLIENT_ID`
- `GOOGLE_WORKSPACE_CLIENT_SECRET`
- `GOOGLE_WORKSPACE_REFRESH_TOKEN`
- `GOOGLE_DRIVE_SHARED_DRIVE_ID`
- `GOOGLE_DRIVE_ROOT_FOLDER_ID`
- `GOOGLE_IMPERSONATE_EMAIL`
- `EMAIL_TEST_MODE`
- `EMAIL_TEST_RECIPIENT`

## Testes mínimos

- Colaborador: abrir Meu portal, nova solicitação, ajuste de ponto, minhas férias e contracheque próprio.
- Supervisor: ver equipe, aprovar solicitação, gerir férias da equipe, validar ponto e abrir contracheques da equipe.
- Gerente: validar fluxo vindo do supervisor e acessar contracheques da estrutura.
- Diretoria: aprovar fluxo final e visualizar dashboard consolidado.
- RH: executar solicitações aprovadas, consultar bases, rotinas, documentos e fila de comunicação.

## Regras de navegação

- Voltar deve retornar para a tela anterior.
- Ao concluir uma ação, permanecer na mesma tela e exibir mensagem de sucesso.
- Cards e indicadores devem ser clicáveis; quando o destino ainda não estiver definido, abrir Meu portal para facilitar teste.
