import { readFileSync, writeFileSync } from "node:fs";

const ROOT_NAME = "RH - Prodelar Grupo";
const COMPANIES = ["PRODELAR", "COLMOB", "SERVIMEC"];
const MODULE_FOLDERS = [
  "00_ENTRADA",
  "01_COLABORADORES",
  "02_ADMISSAO",
  "03_CONTRATOS_E_TERMOS",
  "04_FOLHA_E_CONTRACHEQUES",
  "05_PONTO_E_BANCO_DE_HORAS",
  "06_FERIAS",
  "07_ATESTADOS_E_AFASTAMENTOS",
  "08_BENEFICIOS",
  "09_DESLIGAMENTO",
  "10_POLITICAS",
  "99_AUDITORIA_E_PROCESSADOS",
];
const INBOX_FOLDERS = [
  "solicitacoes",
  "contracheques_entrada",
  "ponto_entrada",
  "atestados_entrada",
  "admissao_entrada",
  "ferias_entrada",
];

function readEnv(path) {
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/\\n/g, "\n")];
      }),
  );
}

function updateEnv(path, updates) {
  let text = readFileSync(path, "utf8");
  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}=${value}`;
    if (new RegExp(`^${key}=.*$`, "m").test(text)) {
      text = text.replace(new RegExp(`^${key}=.*$`, "m"), line);
    } else {
      text += `\n${line}`;
    }
  }
  writeFileSync(path, text);
}

async function getAccessToken(env) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_WORKSPACE_CLIENT_ID,
      client_secret: env.GOOGLE_WORKSPACE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_WORKSPACE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error_description ?? body.error ?? "Google OAuth token error");
  return body.access_token;
}

async function driveRequest(accessToken, path, options = {}) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message ?? `Drive API error: ${response.status}`);
  return body;
}

function escapeQueryValue(value) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findFolder(accessToken, name, parentId, appKind) {
  const clauses = [
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    `name = '${escapeQueryValue(name)}'`,
  ];
  if (parentId) clauses.push(`'${parentId}' in parents`);
  if (appKind) {
    clauses.push(`appProperties has { key='app' and value='prodelar-rh' }`);
    clauses.push(`appProperties has { key='kind' and value='${escapeQueryValue(appKind)}' }`);
  }
  const params = new URLSearchParams({
    q: clauses.join(" and "),
    spaces: "drive",
    fields: "files(id,name,webViewLink)",
    pageSize: "10",
  });
  const result = await driveRequest(accessToken, `files?${params}`);
  return result.files?.[0] || null;
}

async function createFolder(accessToken, name, parentId, appProperties = {}) {
  const body = {
    name,
    mimeType: "application/vnd.google-apps.folder",
    appProperties: {
      app: "prodelar-rh",
      ...appProperties,
    },
  };
  if (parentId) body.parents = [parentId];
  return driveRequest(accessToken, "files?fields=id,name,webViewLink", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function ensureFolder(accessToken, name, parentId, appKind, extraProperties = {}) {
  const existing = await findFolder(accessToken, name, parentId, appKind);
  if (existing) return { ...existing, created: false };
  const created = await createFolder(accessToken, name, parentId, {
    kind: appKind,
    ...extraProperties,
  });
  return { ...created, created: true };
}

async function main() {
  const envPath = ".env.google-workspace.local";
  const env = readEnv(envPath);
  const accessToken = await getAccessToken(env);

  const root = await ensureFolder(accessToken, ROOT_NAME, "", "root");
  console.log(`${root.created ? "Criada" : "Encontrada"} raiz: ${root.name}`);

  const index = {
    root: root.id,
    companies: {},
    inbox: {},
    modules: {},
  };

  for (const name of INBOX_FOLDERS) {
    const folder = await ensureFolder(accessToken, name, root.id, `inbox:${name}`);
    index.inbox[name] = folder.id;
    console.log(`${folder.created ? "Criada" : "Encontrada"} entrada: ${name}`);
  }

  for (const company of COMPANIES) {
    const companyFolder = await ensureFolder(accessToken, company, root.id, `company:${company}`, { company });
    index.companies[company] = companyFolder.id;
    index.modules[company] = {};
    console.log(`${companyFolder.created ? "Criada" : "Encontrada"} empresa: ${company}`);

    for (const moduleName of MODULE_FOLDERS) {
      const moduleFolder = await ensureFolder(accessToken, moduleName, companyFolder.id, `company:${company}:module:${moduleName}`, {
        company,
        module: moduleName,
      });
      index.modules[company][moduleName] = moduleFolder.id;
      console.log(`  ${moduleFolder.created ? "Criada" : "Encontrada"} pasta: ${moduleName}`);
    }
  }

  writeFileSync("docs/google-drive-folder-index.json", JSON.stringify(index, null, 2));
  updateEnv(envPath, {
    GOOGLE_DRIVE_ROOT_FOLDER_ID: root.id,
    GOOGLE_DRIVE_SHARED_DRIVE_ID: "",
  });
  writeFileSync("services/googleWorkspaceConfig.js", `window.googleWorkspaceConfig = {
  mode: "production",
  edgeFunctionUrl: "https://vncgdelxlevdndnyjyth.supabase.co/functions/v1/upload-google-drive-file",
  rootFolderId: "${root.id}",
  sharedDriveId: "",
};
`);

  console.log("");
  console.log("Estrutura do Drive pronta.");
  console.log(`Pasta raiz: ${root.webViewLink}`);
  console.log("Arquivo atualizado: .env.google-workspace.local");
  console.log("Arquivo atualizado: services/googleWorkspaceConfig.js");
  console.log("Índice criado: docs/google-drive-folder-index.json");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
