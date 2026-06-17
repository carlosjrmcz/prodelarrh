type UploadContext = {
  employeeId?: string;
  employeeName?: string;
  company?: string;
  documentType?: string;
  sensitivity?: string;
  sharingMode?: string;
  driveFolderId?: string;
};

type DriveFile = {
  id: string;
  name?: string;
  webViewLink?: string;
};

const COMPANY_ALIASES: Record<string, string> = {
  PRODELAR: "PRODELAR",
  COLMOB: "COLMOB",
  SERVIMEC: "SERVIMEC",
};

const MODULE_BY_DOCUMENT_TYPE: Array<[RegExp, string]> = [
  [/contracheque|pagamento|folha|holerite/i, "04_FOLHA_E_CONTRACHEQUES"],
  [/ponto|banco de horas|hora extra|jornada/i, "05_PONTO_E_BANCO_DE_HORAS"],
  [/ferias|férias/i, "06_FERIAS"],
  [/atestado|afastamento|aso|saude|saúde|ocupacional/i, "07_ATESTADOS_E_AFASTAMENTOS"],
  [/benef/i, "08_BENEFICIOS"],
  [/desligamento|rescis/i, "09_DESLIGAMENTO"],
  [/admiss/i, "02_ADMISSAO"],
  [/contrato|termo|responsabilidade|desconto|equipamento/i, "03_CONTRATOS_E_TERMOS"],
  [/politica|política|manual/i, "10_POLITICAS"],
  [/documento|cpf|rg|ctps|pis|cnh|endereco|endereço|certid/i, "01_COLABORADORES"],
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const clientEmail = Deno.env.get("GOOGLE_CLIENT_EMAIL") ?? "";
const privateKey = (Deno.env.get("GOOGLE_PRIVATE_KEY") ?? "").replace(/\\n/g, "\n");
const oauthClientId = Deno.env.get("GOOGLE_WORKSPACE_CLIENT_ID") ?? "";
const oauthClientSecret = Deno.env.get("GOOGLE_WORKSPACE_CLIENT_SECRET") ?? "";
const oauthRefreshToken = Deno.env.get("GOOGLE_WORKSPACE_REFRESH_TOKEN") ?? "";
const rootFolderId = Deno.env.get("GOOGLE_DRIVE_ROOT_FOLDER_ID") ?? "";
const sharedDriveId = Deno.env.get("GOOGLE_DRIVE_SHARED_DRIVE_ID") ?? "";
const impersonateEmail = Deno.env.get("GOOGLE_IMPERSONATE_EMAIL") ?? "";
const driveScope = Deno.env.get("GOOGLE_DRIVE_SCOPE") ?? "https://www.googleapis.com/auth/drive.file";

function base64UrlEncode(value: string | ArrayBuffer) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToArrayBuffer(pem: string) {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

async function signJwt(payload: Record<string, unknown>) {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const header = { alg: "RS256", typ: "JWT" };
  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64UrlEncode(signature)}`;
}

async function getAccessToken() {
  if (!clientEmail || !privateKey) return getOauthAccessToken();
  const now = Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    iss: clientEmail,
    scope: driveScope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  if (impersonateEmail) payload.sub = impersonateEmail;

  const assertion = await signJwt(payload);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error_description ?? body.error ?? "Google OAuth token error");
  return body.access_token as string;
}

async function getOauthAccessToken() {
  if (!oauthClientId || !oauthClientSecret || !oauthRefreshToken) {
    throw new Error("Google Drive OAuth env vars are not configured.");
  }
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: oauthClientId,
      client_secret: oauthClientSecret,
      refresh_token: oauthRefreshToken,
      grant_type: "refresh_token",
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error_description ?? body.error ?? "Google OAuth token error");
  return body.access_token as string;
}

function safeName(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim().slice(0, 180) || "arquivo-rh";
}

function safeQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function normalizeCompany(value?: string) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .trim();
  return COMPANY_ALIASES[normalized] || "";
}

function moduleForDocumentType(value?: string) {
  const label = String(value || "");
  return MODULE_BY_DOCUMENT_TYPE.find(([pattern]) => pattern.test(label))?.[1] || "00_ENTRADA";
}

async function driveJson(accessToken: string, path: string, options: RequestInit = {}) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message ?? `Google Drive API error: ${response.status}`);
  return body;
}

async function findFolder(accessToken: string, parentId: string, name: string, kind: string) {
  const params = new URLSearchParams({
    q: [
      "mimeType = 'application/vnd.google-apps.folder'",
      "trashed = false",
      `name = '${safeQueryValue(name)}'`,
      `'${parentId}' in parents`,
      "appProperties has { key='app' and value='prodelar-rh' }",
      `appProperties has { key='kind' and value='${safeQueryValue(kind)}' }`,
    ].join(" and "),
    fields: "files(id,name,webViewLink)",
    pageSize: "1",
    spaces: "drive",
  });
  const result = await driveJson(accessToken, `files?${params}`);
  return (result.files?.[0] || null) as DriveFile | null;
}

async function createFolder(accessToken: string, parentId: string, name: string, appProperties: Record<string, string>) {
  return driveJson(accessToken, "files?fields=id,name,webViewLink", {
    method: "POST",
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
      appProperties: {
        app: "prodelar-rh",
        ...appProperties,
      },
    }),
  }) as Promise<DriveFile>;
}

async function ensureFolder(accessToken: string, parentId: string, name: string, kind: string, extraProperties: Record<string, string> = {}) {
  return await findFolder(accessToken, parentId, name, kind)
    || await createFolder(accessToken, parentId, name, { kind, ...extraProperties });
}

async function resolveEmployeeFolder(accessToken: string, parentId: string, context: UploadContext) {
  if (!context.employeeName) return parentId;
  const employeeName = safeName(context.employeeName);
  const employeeKey = context.employeeId || employeeName;
  const employeeFolder = await ensureFolder(accessToken, parentId, employeeName, `employee:${employeeKey}`, {
    employee_id: context.employeeId || "",
    employee_name: employeeName,
  });
  return employeeFolder.id;
}

async function resolveTargetFolder(accessToken: string, context: UploadContext) {
  if (context.driveFolderId) return resolveEmployeeFolder(accessToken, context.driveFolderId, context);
  if (!rootFolderId) throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.");

  const company = normalizeCompany(context.company);
  if (!company) return resolveEmployeeFolder(accessToken, rootFolderId, context);

  const companyFolder = await ensureFolder(accessToken, rootFolderId, company, `company:${company}`, { company });
  const moduleName = moduleForDocumentType(context.documentType);
  const moduleFolder = await ensureFolder(accessToken, companyFolder.id, moduleName, `company:${company}:module:${moduleName}`, {
    company,
    module: moduleName,
  });
  return resolveEmployeeFolder(accessToken, moduleFolder.id, context);
}

async function uploadToDrive(file: File, context: UploadContext) {
  const accessToken = await getAccessToken();
  const folderId = await resolveTargetFolder(accessToken, context);

  const boundary = `prodelar-rh-${crypto.randomUUID()}`;
  const metadata = {
    name: safeName(file.name),
    parents: [folderId],
    appProperties: {
      app: "prodelar-rh",
      employeeId: context.employeeId || "",
      company: context.company || "",
      documentType: context.documentType || "",
      sensitivity: context.sensitivity || "private",
    },
  };
  const delimiter = `--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;
  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const mediaPartHeader = `${delimiter}Content-Type: ${file.type || "application/octet-stream"}\r\n\r\n`;
  const body = new Blob([metadataPart, mediaPartHeader, await file.arrayBuffer(), closeDelimiter], {
    type: `multipart/related; boundary=${boundary}`,
  });
  const params = new URLSearchParams({
    uploadType: "multipart",
    supportsAllDrives: "true",
    fields: "id,name,mimeType,size,webViewLink,webContentLink,parents",
  });
  const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message ?? "Google Drive upload error");
  return { ...result, folderId, sharedDriveId };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return Response.json({ ok: false, error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Arquivo não enviado.");
    const context = JSON.parse(String(form.get("context") || "{}")) as UploadContext;
    const driveFile = await uploadToDrive(file, context);
    return Response.json({ ok: true, file: driveFile }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500, headers: corsHeaders });
  }
});
