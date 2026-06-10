import fs from "fs";

const LOGOS = {
  prodelar: {
    file: "assets/logo-prodelar.jpg",
    name: "logo-prodelar.jpg",
    label: "Prodelar",
  },
  colmob: {
    file: "assets/logo-colmob.jpg",
    name: "logo-colmob.jpg",
    label: "Colmob",
  },
  servimec: {
    file: "assets/logo-servimec.jpg",
    name: "logo-servimec.jpg",
    label: "Servimec",
  },
};

const GROUP_LOGO_TEMPLATES = new Set([
  "primeiro_dia_colaborador",
  "desligamento_colaborador_grupo",
  "comunicado_avulso_grupo",
  "comunicado_avulso_empresa",
  "relatorio_mensal_diretoria",
]);

function loadEnv() {
  return Object.fromEntries(
    fs.readFileSync(".env", "utf8")
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const configuredRootFolderId = env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
const googleClientId = env.GOOGLE_WORKSPACE_CLIENT_ID;
const googleClientSecret = env.GOOGLE_WORKSPACE_CLIENT_SECRET;
const googleRefreshToken = env.GOOGLE_WORKSPACE_REFRESH_TOKEN;
const edgeFunctionUrl = `${supabaseUrl}/functions/v1/upload-google-drive-file`;
const edgeAuthKey = serviceRoleKey || anonKey;

for (const [key, value] of Object.entries({ supabaseUrl, anonKey, serviceRoleKey, configuredRootFolderId, googleClientId, googleClientSecret, googleRefreshToken })) {
  if (!value) throw new Error(`Variável obrigatória ausente: ${key}`);
}

const restHeaders = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  "Content-Type": "application/json",
};

async function rest(pathname, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, {
    ...options,
    headers: { ...restHeaders, ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  if (response.status === 204) return null;
  return response.json();
}

async function getGoogleToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: googleRefreshToken,
      grant_type: "refresh_token",
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error_description || body.error || "Falha OAuth Google");
  return body.access_token;
}

function safeQuery(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function driveJson(accessToken, pathname, options = {}) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || `Google Drive API ${response.status}`);
  return body;
}

async function ensureRootFolder(accessToken) {
  if (configuredRootFolderId) {
    const current = await driveJson(accessToken, `files/${configuredRootFolderId}?fields=id,name,webViewLink`).catch(() => null);
    if (current?.id) return current;
  }
  for (const name of ["RH Prodelar", "RH - Prodelar Grupo"]) {
    const params = new URLSearchParams({
      q: [
        "mimeType = 'application/vnd.google-apps.folder'",
        "trashed = false",
        `name = '${safeQuery(name)}'`,
      ].join(" and "),
      fields: "files(id,name,webViewLink)",
      pageSize: "1",
      spaces: "drive",
    });
    const found = await driveJson(accessToken, `files?${params}`);
    if (found.files?.[0]) return found.files[0];
  }
  return driveJson(accessToken, "files?fields=id,name,webViewLink", {
    method: "POST",
    body: JSON.stringify({
      name: "RH Prodelar",
      mimeType: "application/vnd.google-apps.folder",
      appProperties: { app: "prodelar-rh", kind: "root" },
    }),
  });
}

async function ensureLogosFolder(accessToken, rootFolderId) {
  const params = new URLSearchParams({
    q: [
      "mimeType = 'application/vnd.google-apps.folder'",
      "trashed = false",
      "name = 'Logos'",
      `'${safeQuery(rootFolderId)}' in parents`,
    ].join(" and "),
    fields: "files(id,name,webViewLink)",
    pageSize: "1",
    spaces: "drive",
  });
  const found = await driveJson(accessToken, `files?${params}`);
  if (found.files?.[0]) return found.files[0];
  return driveJson(accessToken, "files?fields=id,name,webViewLink", {
    method: "POST",
    body: JSON.stringify({
      name: "Logos",
      mimeType: "application/vnd.google-apps.folder",
      parents: [rootFolderId],
      appProperties: { app: "prodelar-rh", kind: "logos" },
    }),
  });
}

async function makePublic(accessToken, fileId) {
  await driveJson(accessToken, `files/${fileId}/permissions?supportsAllDrives=true`, {
    method: "POST",
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  }).catch((error) => {
    if (!String(error.message || "").includes("already exists")) throw error;
  });
}

async function uploadLogo(key, logo, folderId, accessToken) {
  const bytes = fs.readFileSync(logo.file);
  const file = new File([bytes], logo.name, { type: "image/jpeg" });
  const form = new FormData();
  form.append("file", file);
  form.append("context", JSON.stringify({
    driveFolderId: folderId,
    documentType: "Logos",
    company: logo.label,
    sensitivity: "public",
    sharingMode: "public",
  }));
  const response = await fetch(edgeFunctionUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${edgeAuthKey}`,
      apikey: edgeAuthKey,
    },
    body: form,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error || result.message || `Upload falhou: ${logo.name}`);
  const fileId = result.file?.id;
  await makePublic(accessToken, fileId);
  return {
    key,
    id: fileId,
    fileName: logo.name,
    webViewLink: result.file?.webViewLink || "",
    publicUrl: `https://drive.google.com/uc?export=view&id=${fileId}`,
  };
}

function statusColor(templateKey) {
  if (/(vencido|urgente|reprovado|falha|erro|afastamento)/i.test(templateKey)) return ["#FCEBEB", "#A32D2D", "Urgente"];
  if (/(pendente|atenção|atencao|prazo|vencendo|experiencia|experiência|cnh|atestado)/i.test(templateKey)) return ["#FAEEDA", "#854F0B", "Atenção"];
  if (/(contracheque|informativo|salario|salário|decimo|décimo|folha|acesso|relatorio|relatório)/i.test(templateKey)) return ["#E6F1FB", "#0C447C", "Informativo"];
  if (/(aprovad|boas|primeiro|enviado|renovado|entregue|aniversario|aniversário|efetivado)/i.test(templateKey)) return ["#EAF3DE", "#3B6D11", "Aprovado"];
  if (/(desligamento|comunicado)/i.test(templateKey)) return ["#F1EFE8", "#5F5E5A", "Comunicado"];
  return ["#F1EFE8", "#5F5E5A", "RH"];
}

function logoCell(src, alt) {
  return `<td style="background:#ffffff;border-radius:4px;padding:4px 10px"><img src="${src}" alt="${alt}" height="28" style="display:block"></td>`;
}

function headerBlock(templateKey, urls) {
  if (GROUP_LOGO_TEMPLATES.has(templateKey)) {
    return `<tr><td style="background:#1a5c3a;padding:16px 24px">
  <table cellpadding="0" cellspacing="0" border="0"><tr>
    ${logoCell(urls.prodelar.publicUrl, "Prodelar")}
    <td width="8"></td>
    ${logoCell(urls.colmob.publicUrl, "Colmob")}
    <td width="8"></td>
    ${logoCell(urls.servimec.publicUrl, "Servimec")}
  </tr></table>
  <div style="color:#a8d5b5;font-size:11px;margin-top:6px">Recursos Humanos · Grupo Prodelar</div>
</td></tr>`;
  }
  return `<tr><td style="background:#1a5c3a;padding:16px 24px">
  <table cellpadding="0" cellspacing="0" border="0"><tr>
    ${logoCell("{{empresa_logo_url}}", "{{empresa}}")}
  </tr></table>
  <div style="color:#a8d5b5;font-size:11px;margin-top:6px">Recursos Humanos · {{empresa}}</div>
</td></tr>`;
}

function readableLabel(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function templatePlaceholders(template) {
  const found = new Set();
  const text = `${template.subject_template || ""}\n${template.body_template || ""}`;
  for (const match of text.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)) {
    const key = match[1];
    if (key !== "link") found.add(key);
  }
  const preferred = ["colaborador_nome", "empresa", "departamento", "cargo", "gestor_nome", "responsavel", "competencia", "prazo", "data", "data_credito", "status", "observacao"];
  return [...preferred.filter((key) => found.has(key)), ...[...found].filter((key) => !preferred.includes(key))].slice(0, 8);
}

function rowsForTemplate(template) {
  const keys = templatePlaceholders(template);
  const row = (label, value) => `<tr>
  <td width="42%" valign="top" style="padding:8px 10px;border-bottom:1px solid #f0f0f0;color:#888;word-break:break-word">${label}</td>
  <td width="58%" valign="top" style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#111;word-break:break-word">${value}</td>
</tr>`;
  if (!keys.length) return row("Template", template.template_key);
  return keys.map((key) => row(readableLabel(key), `{{${key}}}`)).join("");
}

function greetingForTemplate(template) {
  const body = String(template.body_template || "").trim();
  const firstParagraph = body.split(/\n\s*\n/)[0] || "Olá,";
  return firstParagraph.replace(/\n/g, "<br>");
}

function htmlForTemplate(template, urls) {
  const [tagBg, tagColor, tagText] = statusColor(template.template_key);
  const button = /desligamento_colaborador_grupo/i.test(template.template_key)
    ? ""
    : `<a href="{{link}}" style="display:inline-block;background:#1a5c3a;color:#ffffff;padding:11px 22px;border-radius:5px;text-decoration:none;font-size:14px;font-weight:700">Acessar portal →</a>`;
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;background:#f0f0f0">
<tr><td align="center" style="padding:20px 10px">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:6px;overflow:hidden;max-width:600px">
${headerBlock(template.template_key, urls)}
<tr><td style="background:#e87722;height:4px"></td></tr>
<tr><td style="padding:24px">
  <div style="display:inline-block;background:${tagBg};color:${tagColor};padding:3px 14px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:14px">${tagText}</div>
  <div style="font-size:20px;font-weight:700;color:#1a5c3a;margin-bottom:10px;line-height:1.3">${template.subject_template}</div>
  <div style="font-size:14px;color:#444;margin-bottom:18px;line-height:1.6">${greetingForTemplate(template)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;margin-bottom:18px">${rowsForTemplate(template)}</table>
  ${button}
</td></tr>
<tr><td style="background:#f8f9fa;padding:14px 24px;border-top:1px solid #eeeeee">
  <div style="font-size:11px;color:#999;line-height:1.7">
    <strong style="color:#666">Recursos Humanos · ${GROUP_LOGO_TEMPLATES.has(template.template_key) ? "Grupo Prodelar" : "{{empresa}}"}</strong><br>
    rh@grupoprodelar.com.br &nbsp;·&nbsp; Mensagem automática<br>
    Não responda este e-mail. Em caso de dúvidas, acesse o portal.
  </div>
</td></tr>
</table></td></tr></table>`;
}

const accessToken = await getGoogleToken();
const rootFolder = await ensureRootFolder(accessToken);
const logosFolder = await ensureLogosFolder(accessToken, rootFolder.id);
const uploaded = {};
for (const [key, logo] of Object.entries(LOGOS)) {
  uploaded[key] = await uploadLogo(key, logo, logosFolder.id, accessToken);
}

const templates = await rest("email_templates?select=template_key,subject_template,body_template&app_name=eq.recursos_humanos&order=template_key.asc");
for (const template of templates) {
  await rest(`email_templates?app_name=eq.recursos_humanos&template_key=eq.${encodeURIComponent(template.template_key)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ body_html_template: htmlForTemplate(template, uploaded) }),
  });
}

const counts = await rest("email_templates?select=template_key,body_html_template&app_name=eq.recursos_humanos");
const htmlCount = counts.filter((row) => row.body_html_template).length;
const groupCount = counts.filter((row) => GROUP_LOGO_TEMPLATES.has(row.template_key) && row.body_html_template?.includes(uploaded.colmob.publicUrl) && row.body_html_template?.includes(uploaded.servimec.publicUrl)).length;
const singleCount = counts.filter((row) => !GROUP_LOGO_TEMPLATES.has(row.template_key) && row.body_html_template?.includes("{{empresa_logo_url}}")).length;

const result = {
  rootFolder,
  logosFolder,
  uploaded,
  templatesTotal: counts.length,
  htmlCount,
  groupCount,
  singleCount,
};

fs.writeFileSync("docs/template-logo-urls.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
