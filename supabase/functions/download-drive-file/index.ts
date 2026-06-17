import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

type HrProfile = {
  id: string;
  auth_user_id?: string | null;
  employee_id?: string | null;
  role_code?: string | null;
  email?: string | null;
  full_name?: string | null;
  is_active?: boolean | null;
};

type HrDocument = {
  id: string;
  source_type?: string;
  source_id?: string;
  request_attachment_id?: string | null;
  accounting_file_id?: string | null;
  employee_id?: string | null;
  title?: string | null;
  file_name?: string | null;
  original_file_name?: string | null;
  file_url?: string | null;
  drive_file_id?: string | null;
  storage_path?: string | null;
  mime_type?: string | null;
  sensitivity?: string | null;
  metadata?: Record<string, unknown> | null;
  raw_metadata?: Record<string, unknown> | null;
  document_type?: { code?: string | null; name?: string | null; category?: string | null } | null;
  employee?: {
    id?: string | null;
    full_name?: string | null;
    manager_employee_id?: string | null;
    supervisor_employee_id?: string | null;
  } | null;
  request?: {
    id?: string | null;
    employee_id?: string | null;
    requester_employee_id?: string | null;
    title?: string | null;
    raw_data?: Record<string, unknown> | null;
    employee?: {
      id?: string | null;
      full_name?: string | null;
      manager_employee_id?: string | null;
      supervisor_employee_id?: string | null;
    } | null;
    requester?: {
      id?: string | null;
      full_name?: string | null;
      manager_employee_id?: string | null;
      supervisor_employee_id?: string | null;
    } | null;
  } | null;
  accounting?: {
    company_id?: string | null;
    competence_month?: string | null;
    item_key?: string | null;
  } | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const clientEmail = Deno.env.get("GOOGLE_CLIENT_EMAIL") ?? "";
const privateKey = (Deno.env.get("GOOGLE_PRIVATE_KEY") ?? "").replace(/\\n/g, "\n");
const oauthClientId = Deno.env.get("GOOGLE_WORKSPACE_CLIENT_ID") ?? "";
const oauthClientSecret = Deno.env.get("GOOGLE_WORKSPACE_CLIENT_SECRET") ?? "";
const oauthRefreshToken = Deno.env.get("GOOGLE_WORKSPACE_REFRESH_TOKEN") ?? "";
const impersonateEmail = Deno.env.get("GOOGLE_IMPERSONATE_EMAIL") ?? "";
const driveScope = Deno.env.get("GOOGLE_DRIVE_SCOPE") ?? "https://www.googleapis.com/auth/drive.readonly";

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase env vars are not configured.");
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdmin;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

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

async function getGoogleAccessToken() {
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

function bearerToken(request: Request) {
  const value = request.headers.get("authorization") || "";
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}

async function requestPayload(request: Request) {
  const url = new URL(request.url);
  if (request.method === "GET") {
    return {
      documentId: url.searchParams.get("document_id") || url.searchParams.get("documentId") || "",
      requestAttachmentId: url.searchParams.get("request_attachment_id") || url.searchParams.get("requestAttachmentId") || "",
      accountingFileId: url.searchParams.get("accounting_file_id") || url.searchParams.get("accountingFileId") || "",
      action: url.searchParams.get("action") || "view",
    };
  }
  const body = await request.json().catch(() => ({}));
  return {
    documentId: body.document_id || body.documentId || "",
    requestAttachmentId: body.request_attachment_id || body.requestAttachmentId || "",
    accountingFileId: body.accounting_file_id || body.accountingFileId || "",
    action: body.action || "view",
  };
}

function normalizeRole(value?: string | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function extractDriveFileId(document: HrDocument) {
  const metadata = { ...(document.raw_metadata || {}), ...(document.metadata || {}) };
  const candidates = [
    document.drive_file_id,
    metadata.drive_file_id,
    metadata.file_id,
    document.storage_path && document.storage_path.length > 12 ? document.storage_path : "",
    document.file_url,
  ].map((value) => String(value || ""));

  for (const candidate of candidates) {
    if (!candidate) continue;
    const filePathMatch = candidate.match(/\/file\/d\/([^/]+)/);
    if (filePathMatch?.[1]) return filePathMatch[1];
    const idParamMatch = candidate.match(/[?&]id=([^&]+)/);
    if (idParamMatch?.[1]) return decodeURIComponent(idParamMatch[1]);
    if (/^[A-Za-z0-9_-]{20,}$/.test(candidate)) return candidate;
  }
  return "";
}

function isSensitiveForLeadership(document: HrDocument) {
  const sensitivity = normalizeRole(document.sensitivity);
  const category = normalizeRole(document.document_type?.category);
  const title = normalizeRole(document.title || document.document_type?.name);
  return (
    sensitivity.includes("restricted") ||
    sensitivity.includes("restrito") ||
    sensitivity.includes("sensitive") ||
    category.includes("salary") ||
    category.includes("payroll") ||
    title.includes("contracheque") ||
    title.includes("rescis") ||
    title.includes("atestado") ||
    title.includes("aso") ||
    title.includes("advert")
  );
}

function leaderOf(
  profile: HrProfile,
  employee?: { manager_employee_id?: string | null; supervisor_employee_id?: string | null } | null,
) {
  return Boolean(
    profile.employee_id &&
      employee &&
      (profile.employee_id === employee.manager_employee_id || profile.employee_id === employee.supervisor_employee_id),
  );
}

function canAccessDocument(profile: HrProfile, document: HrDocument) {
  if (!profile?.id) return { allowed: false, reason: "perfil_nao_encontrado" };
  if (profile.is_active === false) return { allowed: false, reason: "perfil_inativo" };
  const role = normalizeRole(profile.role_code);
  if (["gestor_rh", "rh", "diretor", "diretoria"].includes(role)) return { allowed: true, reason: "perfil_rh_diretoria" };
  if (profile.employee_id && profile.employee_id === document.employee_id) return { allowed: true, reason: "proprio_colaborador" };
  if (leaderOf(profile, document.employee) && !isSensitiveForLeadership(document)) return { allowed: true, reason: "lider_documento_nao_sensivel" };
  return { allowed: false, reason: "fora_do_escopo" };
}

function canAccessSecureFile(profile: HrProfile, file: HrDocument) {
  const role = normalizeRole(profile?.role_code);
  if (file.source_type === "accounting_file") {
    if (["gestor_rh", "rh", "diretor", "diretoria", "gestor_financeiro", "financeiro"].includes(role)) {
      return { allowed: true, reason: "perfil_pacote_mensal" };
    }
    return { allowed: false, reason: "pacote_mensal_restrito" };
  }
  if (file.source_type === "request_attachment") {
    if (!profile?.id) return { allowed: false, reason: "perfil_nao_encontrado" };
    if (profile.is_active === false) return { allowed: false, reason: "perfil_inativo" };
    if (["gestor_rh", "rh", "diretor", "diretoria"].includes(role)) return { allowed: true, reason: "perfil_rh_diretoria" };
    if (profile.employee_id && (profile.employee_id === file.request?.employee_id || profile.employee_id === file.request?.requester_employee_id)) {
      return { allowed: true, reason: "solicitacao_propria" };
    }
    if ((leaderOf(profile, file.request?.employee) || leaderOf(profile, file.request?.requester)) && !isSensitiveForLeadership(file)) {
      return { allowed: true, reason: "lider_solicitacao_nao_sensivel" };
    }
    return { allowed: false, reason: "fora_do_escopo_solicitacao" };
  }
  return canAccessDocument(profile, file);
}

async function loadEmployeeDocument(documentId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("hr_employee_documents")
    .select(
      "id,employee_id,title,file_name,original_file_name,file_url,drive_file_id,storage_path,mime_type,sensitivity,metadata,raw_metadata,document_type:hr_document_types(code,name,category),employee:hr_employees(id,full_name,manager_employee_id,supervisor_employee_id)",
    )
    .eq("id", documentId)
    .maybeSingle();
  if (error) throw error;
  return data ? ({ ...(data as HrDocument), source_type: "employee_document", source_id: documentId } as HrDocument) : null;
}

async function loadRequestAttachment(attachmentId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("hr_request_attachments")
    .select(
      "id,request_id,document_id,storage_bucket,storage_path,original_file_name,drive_file_id,file_url,file_size_bytes,mime_type,metadata,raw_metadata,request:hr_requests(id,employee_id,requester_employee_id,title,raw_data,employee:hr_employees!hr_requests_employee_id_fkey(id,full_name,manager_employee_id,supervisor_employee_id),requester:hr_employees!hr_requests_requester_employee_id_fkey(id,full_name,manager_employee_id,supervisor_employee_id))",
    )
    .eq("id", attachmentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Record<string, unknown>;
  if (row.document_id) {
    const linkedDocument = await loadEmployeeDocument(String(row.document_id));
    if (linkedDocument) {
      return {
        ...linkedDocument,
        source_type: "request_attachment",
        source_id: attachmentId,
        request_attachment_id: attachmentId,
        request: row.request as HrDocument["request"],
      };
    }
  }
  const request = row.request as HrDocument["request"];
  const employeeId = request?.employee_id || request?.requester_employee_id || null;
  return {
    id: attachmentId,
    source_type: "request_attachment",
    source_id: attachmentId,
    request_attachment_id: attachmentId,
    employee_id: employeeId,
    title: String(row.original_file_name || request?.title || "Anexo de solicitação"),
    file_name: String(row.original_file_name || "anexo-solicitacao"),
    original_file_name: String(row.original_file_name || ""),
    file_url: String(row.file_url || ""),
    drive_file_id: String(row.drive_file_id || ""),
    storage_path: String(row.storage_path || ""),
    mime_type: String(row.mime_type || ""),
    sensitivity: String((row.metadata as Record<string, unknown> | null)?.sensitivity || (row.raw_metadata as Record<string, unknown> | null)?.sensitivity || "employee_private"),
    metadata: (row.metadata as Record<string, unknown>) || {},
    raw_metadata: (row.raw_metadata as Record<string, unknown>) || {},
    employee: request?.employee || request?.requester || null,
    request,
  };
}

async function loadAccountingFile(fileId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("hr_accounting_package_files")
    .select("id,company_id,competence_month,item_key,item_title,original_file_name,file_name,storage_bucket,storage_path,drive_file_id,file_url,file_size_bytes,mime_type,metadata,raw_metadata")
    .eq("id", fileId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: fileId,
    source_type: "accounting_file",
    source_id: fileId,
    accounting_file_id: fileId,
    employee_id: null,
    title: String(row.item_title || row.file_name || "Arquivo do pacote mensal"),
    file_name: String(row.file_name || row.original_file_name || row.item_title || "arquivo-pacote-mensal"),
    original_file_name: String(row.original_file_name || row.file_name || ""),
    file_url: String(row.file_url || ""),
    drive_file_id: String(row.drive_file_id || ""),
    storage_path: String(row.storage_path || ""),
    mime_type: String(row.mime_type || ""),
    sensitivity: "hr_restricted",
    metadata: (row.metadata as Record<string, unknown>) || {},
    raw_metadata: (row.raw_metadata as Record<string, unknown>) || {},
    accounting: {
      company_id: String(row.company_id || ""),
      competence_month: String(row.competence_month || ""),
      item_key: String(row.item_key || ""),
    },
  } as HrDocument;
}

async function auditAccess(
  request: Request,
  document: HrDocument | null,
  profile: HrProfile | null,
  userId: string | null,
  action: string,
  allowed: boolean,
  reason: string,
) {
  const linkedEmployeeDocumentId =
    document?.source_type === "employee_document" ||
    (document?.source_type === "request_attachment" && document?.request_attachment_id && document.id !== document.request_attachment_id)
      ? document?.id || null
      : null;
  const { error } = await getSupabaseAdmin()
    .from("hr_document_access_logs")
    .insert({
      source_type: document?.source_type || "employee_document",
      source_id: document?.source_id || document?.id || null,
      document_id: linkedEmployeeDocumentId,
      request_attachment_id: document?.request_attachment_id || null,
      accounting_file_id: document?.accounting_file_id || null,
      employee_id: document?.employee_id || null,
      requester_profile_id: profile?.id || null,
      requester_auth_user_id: userId,
      action,
      allowed,
      reason,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "",
      user_agent: request.headers.get("user-agent") || "",
    });
  if (error) console.warn("access audit skipped:", error.message);
}

function sanitizeFilename(value: string) {
  return String(value || "documento-rh")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "documento-rh";
}

async function driveMetadata(accessToken: string, fileId: string) {
  const params = new URLSearchParams({
    fields: "id,name,mimeType,size",
    supportsAllDrives: "true",
  });
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message ?? `Google Drive metadata error: ${response.status}`);
  return body as { id: string; name?: string; mimeType?: string; size?: string };
}

async function driveFileResponse(accessToken: string, fileId: string, action: string, fallbackName: string) {
  const meta = await driveMetadata(accessToken, fileId);
  const googleMime = meta.mimeType || "application/octet-stream";
  const isGoogleDoc = googleMime.startsWith("application/vnd.google-apps.");
  const outputMime = isGoogleDoc ? "application/pdf" : googleMime;
  const outputName = sanitizeFilename(isGoogleDoc && !String(meta.name || "").toLowerCase().endsWith(".pdf") ? `${meta.name || fallbackName}.pdf` : meta.name || fallbackName);
  const url = isGoogleDoc
    ? `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`
    : `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;

  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error?.message ?? `Google Drive download error: ${response.status}`);
  }
  const disposition = action === "download" ? "attachment" : "inline";
  return new Response(await response.arrayBuffer(), {
    headers: {
      ...corsHeaders,
      "Content-Type": outputMime,
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(outputName)}`,
      "Cache-Control": "private, max-age=60",
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!["GET", "POST"].includes(request.method)) return jsonResponse({ ok: false, error: "Method not allowed" }, 405);

  let document: HrDocument | null = null;
  let profile: HrProfile | null = null;
  let action = "view";
  let userId: string | null = null;

  try {
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase env vars are not configured.");
    const token = bearerToken(request);
    if (!token) return jsonResponse({ ok: false, error: "Authorization Bearer obrigatório." }, 401);

    const { documentId, requestAttachmentId, accountingFileId, action: requestedAction } = await requestPayload(request);
    action = requestedAction === "download" ? "download" : "view";
    if (!documentId && !requestAttachmentId && !accountingFileId) {
      return jsonResponse({ ok: false, error: "document_id, request_attachment_id ou accounting_file_id obrigatório." }, 400);
    }

    const { data: authData, error: authError } = await getSupabaseAdmin().auth.getUser(token);
    if (authError || !authData?.user) return jsonResponse({ ok: false, error: "Sessão inválida." }, 401);
    userId = authData.user.id;

    const { data: profileData, error: profileError } = await getSupabaseAdmin()
      .from("hr_profiles")
      .select("id,auth_user_id,employee_id,role_code,email,full_name,is_active")
      .or(`auth_user_id.eq.${authData.user.id},id.eq.${authData.user.id},email.eq.${authData.user.email || ""}`)
      .maybeSingle();
    if (profileError) throw profileError;
    profile = profileData as HrProfile | null;

    if (requestAttachmentId) {
      document = await loadRequestAttachment(requestAttachmentId);
    } else if (accountingFileId) {
      document = await loadAccountingFile(accountingFileId);
    } else {
      document = await loadEmployeeDocument(documentId);
    }

    if (!document) {
      await auditAccess(request, null, profile, userId, action, false, "documento_nao_encontrado");
      return jsonResponse({ ok: false, error: "Documento não encontrado." }, 404);
    }

    const permission = canAccessSecureFile(profile as HrProfile, document);
    await auditAccess(request, document, profile, userId, action, permission.allowed, permission.reason);
    if (!permission.allowed) return jsonResponse({ ok: false, error: "Acesso negado ao documento.", reason: permission.reason }, 403);

    const driveFileId = extractDriveFileId(document);
    if (!driveFileId) return jsonResponse({ ok: false, error: "Documento sem drive_file_id." }, 404);

    const accessToken = await getGoogleAccessToken();
    return await driveFileResponse(accessToken, driveFileId, action, document.file_name || document.original_file_name || document.title || "documento-rh");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await auditAccess(request, document, profile, userId, action, false, message).catch(() => {});
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
