# Relatório de Deploy Econômico

Data: 22/05/2026

## Situação do build

- Pasta de publicação: `dist`
- Tamanho total do `dist`: aproximadamente 636 KB
- Arquivos principais:
  - `app-*.js`: aproximadamente 203 KB sem compressão, 51 KB gzip
  - `vendor/supabase-*.js`: aproximadamente 195 KB sem compressão, 52 KB gzip
  - `assets/index-*.css`: aproximadamente 27 KB sem compressão, 6 KB gzip
  - logos: aproximadamente 181 KB no total

## Otimizações aplicadas

- Scripts próprios passaram a sair minificados e com hash no nome.
- `app.js`, `emailQueue.js`, `googleWorkspaceStorage.js` e o vendor do Supabase são versionados por conteúdo.
- Assets de imagem são copiados com hash no nome.
- `services/googleWorkspaceConfig.js` continua separado e com `no-store`, para permitir troca de configuração sem reconstruir todo o app.
- Foram removidas funções mortas de leitura local de fichas, férias e contracheques em `production/...`.
- O `dist` não inclui PDFs, XLS, DOCX, RTF, ZIP, TAR.GZ ou pastas operacionais pesadas.
- Foram criados/ajustados arquivos de deploy:
  - `netlify.toml`
  - `vercel.json`
  - `firebase.json`
  - `dist/_headers`
  - `dist/_redirects`
  - `.netlifyignore`
  - `.vercelignore`
- Cache longo com `immutable` para arquivos versionados por hash.
- Cache desativado para HTML/configuração, evitando app preso em versão antiga.
- Arquivos pesados ficam planejados para Google Drive/Supabase, não no host estático.
- O app não faz pré-download de PDFs/anexos; links externos só são abertos sob ação do usuário.

## Pontos que ainda podem consumir banda ou créditos

- Primeira carga baixa o app, o Supabase client e as logos.
- Consultas ao Supabase carregam cadastros, solicitações, férias, documentos e contracheques registrados.
- Uploads reais para Google Drive devem passar por Edge Function do Supabase, não pelo host estático.
- O worker de e-mail roda por cron no Supabase, não no Netlify/Vercel/Firebase.

## Arquivos grandes fora do deploy

- `.tools/`: binários locais do Supabase CLI, fora do `dist`.
- `node_modules/`: dependências locais, fora do `dist`.
- `production/`: arquivos operacionais/processados, fora do `dist`.
- PDFs e planilhas de processamento devem permanecer fora da hospedagem estática.

## Recomendação por plataforma

### Netlify

- Usar `npm run build`.
- Publicar `dist`.
- Manter `netlify.toml`.
- Deploy manual pode ser feito enviando apenas a pasta `dist`.

### Vercel

- Usar `vercel.json`.
- Output directory: `dist`.
- Confirmar que o projeto é tratado como app estático.

### Firebase Hosting

- Usar `firebase.json`.
- Public directory: `dist`.
- Não usar Functions para este app, salvo necessidade futura específica.

### Cloudflare Pages

- Build command: `npm run build`.
- Output directory: `dist`.
- Configurar headers equivalentes a `dist/_headers`.
- Boa opção quando quiser CDN barata e cache forte.

## Conclusão

O app está adequado para deploy econômico. A camada estática ficou pequena, sem anexos pesados, com cache eficiente e sem dependência de serverless do host. O backend operacional continua no Supabase, e arquivos pesados devem seguir para Google Drive/Workspace.
