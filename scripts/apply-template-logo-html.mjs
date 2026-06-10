import fs from "fs";
import path from "path";

const LOGOS = {
  prodelar: {
    file: "assets/logo-prodelar.jpg",
    name: "Logomarca_Prodelar__att_.jpg",
    label: "Prodelar",
  },
  colmob: {
    file: "assets/logo-colmob.jpg",
    name: "Logo_Colmob__att_.jpg",
    label: "Colmob",
  },
  servimec: {
    file: "assets/logo-servimec.jpg",
    name: "Logomarca_Servimec__att_.jpg",
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
  if (/(vencido|encerrado|desligamento|falha|erro|reprovado|afastamento)/i.test(templateKey)) return ["#b42318", "#fcebeb", "Atenção necessária"];
  if (/(pendente|vencendo|atestado|experiencia|experiência|cnh)/i.test(templateKey)) return ["#b7791f", "#faeeda", "Pendente de acompanhamento"];
  if (/(contracheque|salario|salário|decimo|décimo|folha|relatorio|relatório)/i.test(templateKey)) return ["#1f6fb2", "#e6f1fb", "Informação disponível"];
  if (/(aprovad|renovado|primeiro|entregue|aniversario|aniversário|efetivado)/i.test(templateKey)) return ["#1a7f4b", "#eaf3de", "Concluído"];
  return ["#667085", "#eef2f1", "Comunicado RH"];
}

function logoCell(src, alt) {
  return `<td align="center" style="padding:8px 10px;background:#ffffff;border-radius:8px;border:1px solid #dbe7e0;"><img src="${src}" width="120" alt="${alt}" style="display:block;border:0;max-width:120px;height:auto;"></td>`;
}

function renderLogoBlock(templateKey, urls) {
  if (GROUP_LOGO_TEMPLATES.has(templateKey)) {
    return `<table role="presentation" cellpadding="0" cellspacing="0" align="right" style="border-collapse:separate;border-spacing:6px 0;"><tr>${logoCell(urls.prodelar.publicUrl, "Prodelar")}${logoCell(urls.colmob.publicUrl, "Colmob")}${logoCell(urls.servimec.publicUrl, "Servimec")}</tr></table>`;
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="right" style="border-collapse:collapse;"><tr>${logoCell("{{empresa_logo_url}}", "Empresa do colaborador")}</tr></table>`;
}

function htmlForTemplate(template, urls) {
  const [tagColor, tagBg, tagText] = statusColor(template.template_key);
  const button = /desligamento_colaborador_grupo/i.test(template.template_key)
    ? ""
    : `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 4px 0;"><tr><td bgcolor="#1a5c3a" style="border-radius:4px;"><a href="{{link}}" style="display:inline-block;padding:12px 18px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Acessar portal</a></td></tr></table>`;
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${template.subject_template}</title></head>
<body style="margin:0;padding:0;background:#f3f7f5;font-family:Arial,Helvetica,sans-serif;color:#20302a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f3f7f5;margin:0;padding:0;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:680px;background:#ffffff;border:1px solid #dbe7e0;">
      <tr>
        <td style="background:#1a5c3a;padding:18px 20px;color:#ffffff;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td valign="middle" style="font-size:18px;line-height:24px;font-weight:700;color:#ffffff;padding:0 12px 0 0;">Recursos Humanos · Grupo Prodelar</td>
              <td align="right" valign="middle">${renderLogoBlock(template.template_key, urls)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="background:#e87722;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="padding:0 0 14px 0;font-size:22px;line-height:28px;font-weight:700;color:#18352a;">${template.subject_template}</td></tr></table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 18px 0;"><tr><td style="border-left:5px solid ${tagColor};background:${tagBg};padding:12px 14px;font-size:14px;line-height:20px;font-weight:700;color:#20302a;">${tagText}</td></tr></table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 18px 0;border:1px solid #dbe7e0;">
          <tr><td style="padding:9px 12px;border-bottom:1px solid #dbe7e0;background:#f8fbf9;font-size:12px;font-weight:700;color:#52665e;">Campo</td><td style="padding:9px 12px;border-bottom:1px solid #dbe7e0;background:#f8fbf9;font-size:12px;font-weight:700;color:#52665e;">Valor</td></tr>
          <tr><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#52665e;">Colaborador</td><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#20302a;">{{colaborador_nome}}</td></tr>
          <tr><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#52665e;">Empresa</td><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#20302a;">{{empresa}}</td></tr>
          <tr><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#52665e;">Departamento/Cargo</td><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#20302a;">{{departamento}} {{cargo}}</td></tr>
          <tr><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#52665e;">Competência</td><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#20302a;">{{competencia}}</td></tr>
          <tr><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#52665e;">Prazo/Data</td><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#20302a;">{{prazo}} {{data}} {{data_credito}}</td></tr>
          <tr><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#52665e;">Responsável/Gestor</td><td style="padding:9px 12px;border-bottom:1px solid #edf2ef;font-size:13px;color:#20302a;">{{responsavel}} {{gestor_nome}}</td></tr>
          <tr><td style="padding:9px 12px;font-size:13px;color:#52665e;">Status/Observação</td><td style="padding:9px 12px;font-size:13px;color:#20302a;">{{status}} {{observacao}}</td></tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 18px 0;"><tr><td style="font-size:15px;line-height:23px;color:#20302a;">${String(template.body_template || "").replace(/\n/g, "<br>")}</td></tr></table>
        ${button}
      </td></tr>
      <tr><td style="background:#f8fbf9;border-top:1px solid #dbe7e0;padding:16px 24px;font-size:12px;line-height:18px;color:#667085;">Mensagem automática · rh@grupoprodelar.com.br</td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
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
