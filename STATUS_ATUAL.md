# STATUS ATUAL - Prodelar RH

Data do diagnostico: 2026-05-27

## Escopo desta fase

Diagnostico tecnico inicial, sem desenvolvimento de funcionalidades, sem mover arquivos, sem apagar arquivos e sem reescrever arquitetura.

## Projeto auditado

Pasta ativa analisada:

- `/Users/home/Codex/prodelar-rh`

Tambem existe uma pasta de copia/backup em `/Users/home/Codex/Back UP rh - cópia`, mas ela nao foi alterada nem usada como base ativa.

## Stack identificada

- Frontend estatico em HTML, CSS e JavaScript puro.
- Vite usado como servidor de desenvolvimento/build e tambem com middleware local para `/api/rh-routines/check`.
- Supabase como fonte oficial de dados operacionais.
- Supabase Edge Functions em Deno/TypeScript para:
  - processamento de fila de e-mails;
  - upload de arquivos para Google Drive.
- Scripts operacionais em Node.js ESM (`.mjs`) e Python.
- Hospedagem preparada para Netlify, Vercel e Firebase Hosting.

## Arquitetura atual

Arquivos principais:

- `index.html`: carrega CSS, Supabase UMD, configuracao Google Workspace, storage, fila de e-mail e `app.js`.
- `app.js`: aplicacao principal, renderizacao de telas, estado de UI, leitura/escrita no Supabase e varias persistencias auxiliares em `localStorage`.
- `styles.css`: estilos globais.
- `services/emailQueue.js`: helper para inserir eventos em `email_events`.
- `services/googleWorkspaceStorage.js`: helper de upload via Edge Function.
- `services/googleWorkspaceConfig.js`: configuracao local/produzida do Google Workspace.
- `vite.config.js`: servidor Vite com API local de verificacao de pastas.
- `scripts/local-server.mjs`: servidor local alternativo com API parecida.
- `supabase/*.sql`: migrations/schema/seed/policies/cron.
- `supabase/functions/*/index.ts`: Edge Functions.

## Scripts disponiveis

Definidos em `package.json`:

- `dev`: `vite --host 127.0.0.1`
- `serve:local`: `node scripts/local-server.mjs`
- `build`: `vite build && node scripts/prepare-static-dist.mjs`
- `preview`: `vite preview --host 127.0.0.1`
- `process:paystubs`: processa contracheques via Python.
- `process:registration-cards`: processa fichas funcionais via Python.
- `process:vacation-forecasts`: processa previsoes de ferias via Python.
- `import:registration-cards`: importa fichas para Supabase via Python/curl.
- `setup:google-workspace`: configura env/config local do Google Workspace.
- `setup:google-drive-folders`: cria/garante pastas no Google Drive.

Observacao: neste ambiente, `node` existe, mas `npm` nao foi encontrado no PATH. Portanto, nao foi possivel rodar `npm run build`, `npm run dev` ou instalar dependencias durante esta fase.

## Dependencias declaradas

Em `package.json`:

- `@supabase/ssr`
- `@supabase/supabase-js`
- `pdf-lib`
- `pdfjs-dist`
- `vite`

O `package-lock.json` tambem registra `esbuild`, necessario para `scripts/prepare-static-dist.mjs`.

Estado local observado:

- `node_modules` nao existe.
- O arquivo esperado por `index.html` em `node_modules/@supabase/supabase-js/dist/umd/supabase.js` esta ausente.
- O runtime Python configurado nos scripts existe e possui `pypdf`.

## Verificacoes executadas

Checks realizados:

- Leitura da estrutura do projeto.
- Leitura de `package.json`, `package-lock.json`, `vite.config.js`, `README.md`, `.env.example`, `.env.local`, configs de deploy e arquivos de servico.
- `node --check` em `app.js`, `services/*.js` e `scripts/*.mjs`.
- `python -m py_compile` em `scripts/*.py`.
- Verificacao de existencia dos arquivos referenciados por `index.html`.
- Chamada REST de leitura ao Supabase com a publishable key configurada.

Resultado dos checks sintaticos:

- JS/MJS: sem erro de sintaxe.
- Python: sem erro de compilacao.
- Supabase REST: respondeu `200` para tabelas/views principais testadas.

## Integracao com Supabase

Projeto Supabase vinculado:

- Project ref: `vncgdelxlevdndnyjyth`
- Nome local em `.temp/linked-project.json`: `recursoshumanos`

O app usa Supabase em dois pontos:

- `app.js`, com URL e publishable key fixadas no codigo.
- `.env.local` / `.env.example`, com variaveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.

Leituras REST testadas com sucesso:

- `hr_employee_directory`: 94 registros.
- `hr_requests`: 15 registros.
- `hr_vacation_periods`: 97 registros.
- `hr_document_types`: 30 registros.
- `hr_employee_documents`: 0 registros.
- `email_events`: 0 registros.

Risco importante: `supabase/003_dev_open_policies.sql` contem policies permissivas para `anon` e `authenticated`, marcadas como DEV ONLY. Para dados reais de RH/DP, isso precisa ser tratado antes de producao.

## Problemas estruturais identificados

1. Dependencias Node ausentes localmente

   `node_modules` nao existe e `npm` nao esta disponivel no ambiente atual. Isso quebra o carregamento direto de `index.html` porque o HTML referencia o Supabase UMD dentro de `node_modules`.

2. Build nao validado nesta fase

   O script de build depende de `vite` e `esbuild`. Como `npm`/`node_modules` nao estao disponiveis, o build nao foi executado. A sintaxe dos arquivos proprios passou, mas isso nao substitui build real.

3. `index.html` depende de caminho de desenvolvimento

   O HTML referencia:

   - `./node_modules/@supabase/supabase-js/dist/umd/supabase.js`

   Esse caminho existe apenas depois da instalacao das dependencias. Em build, `scripts/prepare-static-dist.mjs` troca esse vendor por arquivo em `dist/vendor`, mas fora do build o Supabase fica indisponivel se `node_modules` nao existir.

4. Divergencia nas rotinas mensais

   `app.js` lista a rotina `gross_payroll` com pasta `production/folha-bruta/entrada`.

   Porem `vite.config.js` e `scripts/local-server.mjs` nao incluem essa rotina no verificador `/api/rh-routines/check`. Resultado esperado: a interface pode mostrar a rotina, mas a checagem automatica nao retorna status para ela.

5. Pastas `production/...` nao existem na pasta ativa

   A aplicacao e os scripts esperam varias pastas operacionais, como:

   - `production/fichas-funcionais/entrada`
   - `production/ferias/entrada`
   - `production/contracheques/entrada`
   - `production/ponto/entrada`
   - `production/aso/entrada`
   - `production/atestados/entrada`
   - `production/treinamentos-epi/entrada`

   Nenhuma pasta `production` foi encontrada no projeto ativo. Isso afeta scripts e a checagem automatica de rotinas.

6. Estado misto entre Supabase e `localStorage`

   O README diz que o Supabase deve ser a fonte oficial. O app ja le dados do Supabase, mas ainda usa `localStorage` para sessoes, senhas locais, simulacao de perfil, workflow auxiliar, edicoes de ferias, ponto, rotinas, eventos operacionais e cache.

7. Autenticacao ainda e local/simulada

   O login usa CPF e senha em `localStorage`, com senha inicial baseada em data de nascimento. Nao foi identificada autenticacao Supabase Auth/RLS por usuario real no frontend.

8. Fila de e-mail parcialmente desligada no frontend

   `services/emailQueue.js` existe e cria insercao em `email_events`, mas em `app.js` a funcao `queueRhEmail` retorna sempre como pulada/pausada. A Edge Function e as migrations existem, mas o frontend principal nao esta enfileirando e-mails por essa funcao no estado atual.

9. Configuracao Google Workspace em producao versionada localmente

   `services/googleWorkspaceConfig.js` esta presente e ignorado pelo `.gitignore`, mas existe na pasta ativa com `mode: "production"` e IDs de pasta/endpoint. Isso parece intencional para o ambiente local, mas deve ser tratado como configuracao sensivel/operacional.

10. Arquivos gerados/cache no repositorio local

   Foram encontrados:

   - `scripts/__pycache__`
   - `supabase/.DS_Store`
   - `supabase/.temp`
   - `.tools`

   Alguns estao ignorados parcialmente, mas a pasta contem artefatos de ferramenta/cache misturados ao projeto.

## Imports e referencias quebradas

Confirmado ausente:

- `node_modules/@supabase/supabase-js/dist/umd/supabase.js`

Referencias locais confirmadas existentes:

- `styles.css`
- `app.js`
- `services/googleWorkspaceConfig.js`
- `services/googleWorkspaceStorage.js`
- `services/emailQueue.js`
- `assets/grupo-prodelar-logos.png`
- `assets/logo-prodelar.jpg`
- `assets/logo-colmob.jpg`
- `assets/logo-servimec.jpg`

Nao foram encontrados erros de sintaxe nos arquivos JS/MJS/Python proprios.

## Riscos por prioridade

Prioridade alta:

- Resolver ambiente Node/npm e dependencias para validar build.
- Corrigir carregamento do Supabase no modo local/dev quando `node_modules` esta ausente.
- Definir fronteira entre dados oficiais no Supabase e estado temporario em `localStorage`.
- Revisar RLS/policies antes de usar dados reais em producao.

Prioridade media:

- Alinhar `gross_payroll` entre `app.js`, `vite.config.js` e `scripts/local-server.mjs`.
- Criar/confirmar estrutura `production/...` ou ajustar scripts para origem oficial no Supabase/Drive.
- Revisar fluxo real de e-mails: frontend, `email_events`, worker e modo teste/producao.
- Documentar qual deploy e oficial: Netlify, Vercel ou Firebase.

Prioridade baixa:

- Limpar artefatos locais/cache em uma fase autorizada.
- Reduzir duplicidade entre `vite.config.js` e `scripts/local-server.mjs`.
- Avaliar separacao futura de `app.js`, hoje concentrando muita responsabilidade em um unico arquivo.

## Recomendacao para proxima fase

Nao desenvolver novas funcionalidades ainda.

Sequencia sugerida para estabilizacao, com autorizacao previa:

1. Preparar ambiente Node/npm sem alterar arquitetura.
2. Instalar dependencias declaradas pelo lockfile.
3. Rodar build e corrigir apenas erros bloqueantes.
4. Corrigir referencia local quebrada do Supabase ou documentar modo unico de execucao.
5. Alinhar rotinas mensais entre app e servidor local.
6. Validar Supabase/RLS/autenticacao antes de tratar dados sensiveis como producao.

