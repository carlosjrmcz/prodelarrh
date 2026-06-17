import { readFileSync, writeFileSync, existsSync } from "node:fs";

const DEFAULT_ROOT_ID = "16nBymzaP5BdxQkRWWLNtFJYdng5-S_qC";
const ROOT_NAME = "RH Prodelar";
const DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/";
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
const GENERAL_FOLDERS = {
  colaboradores: "Colaboradores",
  importacoes: "Importações",
  pacote_mensal: "Pacote mensal contabilidade",
  rotinas: "Rotinas",
  comunicados: "Comunicados",
  logos: "Logos",
  inbox: "Inbox",
};
const IMPORT_FOLDERS = {
  fichas_funcionais: "Fichas funcionais",
  previsao_ferias: "Previsão de férias",
  contracheques: "Contracheques",
  folha_bruta: "Folha bruta",
};

function argValue(name, fallback = "") {
  const prefix = `--${name}=`;
  const value = process.argv.find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

function hasArg(name) {
  return process.argv.includes(`--${name}`);
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, index)] = value.replace(/\\n/g, "\n");
  }
  return env;
}

function updateEnvFile(path, updates) {
  if (!existsSync(path)) return;
  let text = readFileSync(path, "utf8");
  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    text = pattern.test(text) ? text.replace(pattern, line) : `${text.trimEnd()}\n${line}\n`;
  }
  writeFileSync(path, text);
}

function mergeEnv() {
  return {
    ...readEnvFile(".env.google-workspace.local"),
    ...readEnvFile(".env"),
    ...process.env,
  };
}

async function getAccessToken(env) {
  for (const key of ["GOOGLE_WORKSPACE_CLIENT_ID", "GOOGLE_WORKSPACE_CLIENT_SECRET", "GOOGLE_WORKSPACE_REFRESH_TOKEN"]) {
    if (!env[key]) throw new Error(`Variável ausente: ${key}`);
  }
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
  if (!response.ok) throw new Error(body.error_description ?? body.error ?? "Falha ao gerar token Google OAuth");
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
  if (!response.ok) throw new Error(body.error?.message ?? `Erro Google Drive API: ${response.status}`);
  return body;
}

function escapeQueryValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function getFolderById(accessToken, id) {
  if (!id) return null;
  try {
    return await driveRequest(
      accessToken,
      `files/${id}?supportsAllDrives=true&fields=id,name,mimeType,webViewLink`,
    );
  } catch {
    return null;
  }
}

async function findFolder(accessToken, name, parentId = "") {
  const clauses = [
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    `name = '${escapeQueryValue(name)}'`,
  ];
  if (parentId) clauses.push(`'${parentId}' in parents`);
  const params = new URLSearchParams({
    q: clauses.join(" and "),
    spaces: "drive",
    fields: "files(id,name,webViewLink)",
    pageSize: "10",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
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
  return driveRequest(accessToken, "files?supportsAllDrives=true&fields=id,name,webViewLink", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function ensureFolder(accessToken, name, parentId, appProperties = {}) {
  const existing = await findFolder(accessToken, name, parentId);
  if (existing) return { ...existing, created: false };
  const created = await createFolder(accessToken, name, parentId, appProperties);
  return { ...created, created: true };
}

async function resolveRoot(accessToken) {
  const rootFromArg = argValue("root", "");
  const rootId = rootFromArg || DEFAULT_ROOT_ID;
  const byId = await getFolderById(accessToken, rootId);
  if (byId?.mimeType === "application/vnd.google-apps.folder") return byId;

  const byName = await findFolder(accessToken, ROOT_NAME);
  if (byName) return byName;

  return createFolder(accessToken, ROOT_NAME, "", { kind: "root" });
}

function folderUrl(id) {
  return `${DRIVE_FOLDER_URL}${id}`;
}

function shouldCreateCompany(company) {
  if (hasArg("all")) return true;
  const selected = argValue("company", "").toUpperCase();
  return selected ? selected === company : true;
}

function writeWorkspaceFiles(root, index) {
  writeFileSync("docs/google-drive-folder-index.json", JSON.stringify(index, null, 2));
  updateEnvFile(".env", { GOOGLE_DRIVE_ROOT_FOLDER_ID: root.id });
  updateEnvFile(".env.google-workspace.local", { GOOGLE_DRIVE_ROOT_FOLDER_ID: root.id });
  writeFileSync("services/googleWorkspaceConfig.js", `window.googleWorkspaceConfig = {
  mode: "production",
  edgeFunctionUrl: "https://vncgdelxlevdndnyjyth.supabase.co/functions/v1/upload-google-drive-file",
  rootFolderId: "${root.id}",
  sharedDriveId: "",
};
`);
}

async function main() {
  const env = mergeEnv();
  const accessToken = await getAccessToken(env);
  const competence = argValue("month", currentMonthKey());
  const root = await resolveRoot(accessToken);

  console.log(`Raiz usada: ${root.name} (${root.id})`);
  console.log(root.webViewLink || folderUrl(root.id));

  const index = {
    root: root.id,
    general: {},
    imports: {},
    monthly_packages: {},
    companies: {},
    inbox: {},
    modules: {},
  };

  for (const [key, folderName] of Object.entries(GENERAL_FOLDERS)) {
    const folder = await ensureFolder(accessToken, folderName, root.id, { kind: `general:${key}` });
    index.general[key] = folder.id;
    console.log(`${folder.created ? "Criada" : "Encontrada"} geral: ${folderName}`);
  }

  for (const [key, folderName] of Object.entries(IMPORT_FOLDERS)) {
    const folder = await ensureFolder(accessToken, folderName, index.general.importacoes, { kind: `import:${key}` });
    index.imports[key] = folder.id;
    console.log(`${folder.created ? "Criada" : "Encontrada"} importação: ${folderName}`);
  }

  const competenceFolder = await ensureFolder(accessToken, competence, index.general.pacote_mensal, {
    kind: `monthly-package:${competence}`,
    competence,
  });
  index.monthly_packages[competence] = competenceFolder.id;
  console.log(`${competenceFolder.created ? "Criada" : "Encontrada"} pacote mensal: ${competence}`);

  for (const inboxName of INBOX_FOLDERS) {
    const folder = await ensureFolder(accessToken, inboxName, index.general.inbox, { kind: `inbox:${inboxName}` });
    index.inbox[inboxName] = folder.id;
    console.log(`${folder.created ? "Criada" : "Encontrada"} inbox: ${inboxName}`);
  }

  for (const company of COMPANIES.filter(shouldCreateCompany)) {
    const companyFolder = await ensureFolder(accessToken, company, root.id, { kind: `company:${company}`, company });
    index.companies[company] = companyFolder.id;
    index.modules[company] = {};
    console.log(`${companyFolder.created ? "Criada" : "Encontrada"} empresa: ${company}`);

    const companyInGeneral = await ensureFolder(accessToken, company, index.general.colaboradores, {
      kind: `collaborators:${company}`,
      company,
    });
    index.modules[company].COLABORADORES_GERAL = companyInGeneral.id;

    for (const moduleName of MODULE_FOLDERS) {
      const moduleFolder = await ensureFolder(accessToken, moduleName, companyFolder.id, {
        kind: `company:${company}:module:${moduleName}`,
        company,
        module: moduleName,
      });
      index.modules[company][moduleName] = moduleFolder.id;
      console.log(`  ${moduleFolder.created ? "Criada" : "Encontrada"} módulo: ${moduleName}`);
    }
  }

  writeWorkspaceFiles(root, index);

  console.log("");
  console.log("Estrutura do Drive pronta.");
  console.log(`Pasta raiz: ${root.webViewLink || folderUrl(root.id)}`);
  console.log("Atualizados: docs/google-drive-folder-index.json, .env, .env.google-workspace.local e services/googleWorkspaceConfig.js");
  console.log("Próximo comando: node scripts/sync-drive-folder-index.mjs");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
