# Configuração Google Workspace

Este app usa Google Workspace em duas frentes:

- Gmail API para e-mails transacionais, processados pela Edge Function `process-email-events`.
- Google Drive API para anexos pesados, processados pela Edge Function `upload-google-drive-file`.

O frontend não deve guardar segredo do Google. Client secret, refresh token, service account e private key ficam somente nos secrets do Supabase.

## Google Cloud

1. Crie ou selecione um projeto no Google Cloud.
2. Ative as APIs:
   - Gmail API.
   - Google Drive API.
3. Configure a tela de consentimento OAuth para uso interno do Workspace.
4. Crie um OAuth Client para o Gmail API.
5. Autorize o escopo mínimo do Gmail:
   - `https://www.googleapis.com/auth/gmail.send`
6. Gere um refresh token para a conta remetente do RH.
7. Crie uma service account para Drive.
8. Adicione a service account como membro da pasta ou Drive Compartilhado do RH.
9. Se quiser impersonar uma conta do Workspace, habilite domain-wide delegation na service account e autorize o escopo de Drive no Admin Console.

Referências oficiais:

- Credenciais Google Workspace: https://developers.google.com/workspace/guides/create-credentials
- Escopos Gmail API: https://developers.google.com/workspace/gmail/api/auth/scopes
- Autorização server-side Gmail: https://developers.google.com/workspace/gmail/api/auth/web-server
- Upload Drive API: https://developers.google.com/drive/api/v3/manage-uploads
- `files.create` Drive API: https://developers.google.com/drive/api/reference/rest/v3/files/create

## Secrets no Supabase

Configure estes secrets nas Edge Functions:

```env
SUPABASE_URL=https://vncgdelxlevdndnyjyth.supabase.co
SUPABASE_SERVICE_ROLE_KEY=

GOOGLE_WORKSPACE_SENDER_EMAIL=rh@seudominio.com
GOOGLE_WORKSPACE_CLIENT_ID=
GOOGLE_WORKSPACE_CLIENT_SECRET=
GOOGLE_WORKSPACE_REFRESH_TOKEN=

GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_SHARED_DRIVE_ID=
GOOGLE_DRIVE_ROOT_FOLDER_ID=
GOOGLE_IMPERSONATE_EMAIL=
GOOGLE_DRIVE_SCOPE=https://www.googleapis.com/auth/drive.file

EMAIL_TEST_MODE=true
EMAIL_TEST_RECIPIENT=teste@seudominio.com
EMAIL_MAX_PER_BATCH=20
EMAIL_MAX_PER_HOUR=300
EMAIL_MAX_PER_DAY=1000
EMAIL_DAILY_ALERT_THRESHOLD=1000
EMAIL_PAUSE_AUTOMATIC=false
```

Você também pode gerar o arquivo local de secrets e a configuração do frontend com:

```bash
npm run setup:google-workspace
```

O script cria:

- `.env.google-workspace.local`, com os secrets para Supabase.
- `services/googleWorkspaceConfig.js`, com a configuração não secreta usada pelo frontend.

Se a Supabase CLI estiver instalada, o script também pode aplicar os secrets e publicar as Edge Functions.

Para criar a estrutura do Google Drive pelo próprio OAuth do app:

```bash
npm run setup:google-drive-folders
```

O script cria a pasta raiz `RH - Prodelar Grupo`, entradas operacionais e subpastas por empresa (`PRODELAR`, `COLMOB`, `SERVIMEC`). Ele atualiza `GOOGLE_DRIVE_ROOT_FOLDER_ID`, grava `services/googleWorkspaceConfig.js` em modo produção e salva o índice em `docs/google-drive-folder-index.json`.

## Deploy das funções

```bash
supabase functions deploy process-email-events
supabase functions deploy upload-google-drive-file
```

Depois, agende `process-email-events` para rodar a cada minuto. Comece com `EMAIL_TEST_MODE=true`, envie para um destinatário de teste e só depois libere produção.

## Configuração do frontend

Crie `services/googleWorkspaceConfig.js` a partir de `services/googleWorkspaceConfig.example.js`:

```js
window.googleWorkspaceConfig = {
  mode: "production",
  edgeFunctionUrl: "https://vncgdelxlevdndnyjyth.supabase.co/functions/v1/upload-google-drive-file",
  rootFolderId: "ID_DA_PASTA_RAIZ_DO_RH",
  sharedDriveId: "ID_DO_DRIVE_COMPARTILHADO",
};
```

Inclua esse arquivo antes de `services/googleWorkspaceStorage.js` no HTML de produção.

Enquanto `mode` estiver como `test`, o app só grava metadados e não envia arquivos reais ao Drive.
