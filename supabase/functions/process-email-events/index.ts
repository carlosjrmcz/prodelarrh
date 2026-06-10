import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

type EmailEvent = {
  id: string;
  app_name: string;
  module_name: string | null;
  event_type: string;
  recipient_email: string;
  recipient_name: string | null;
  recipient_type: string | null;
  cc: string[];
  bcc: string[];
  subject: string | null;
  template_key: string;
  payload: Record<string, unknown>;
  attempts: number;
  related_table: string | null;
  related_record_id: string | null;
};

type EmailTemplate = {
  subject_template: string;
  body_template: string;
  body_html_template: string | null;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const senderEmail = Deno.env.get("GOOGLE_WORKSPACE_SENDER_EMAIL") ?? "";
const clientId = Deno.env.get("GOOGLE_WORKSPACE_CLIENT_ID") ?? "";
const clientSecret = Deno.env.get("GOOGLE_WORKSPACE_CLIENT_SECRET") ?? "";
const refreshToken = Deno.env.get("GOOGLE_WORKSPACE_REFRESH_TOKEN") ?? "";
const batchSize = Number(Deno.env.get("EMAIL_MAX_PER_BATCH") ?? Deno.env.get("EMAIL_EVENTS_BATCH_SIZE") ?? "20");
const maxPerHour = Number(Deno.env.get("EMAIL_MAX_PER_HOUR") ?? Deno.env.get("EMAIL_EVENTS_MAX_PER_HOUR") ?? "300");
const maxPerDay = Number(Deno.env.get("EMAIL_MAX_PER_DAY") ?? Deno.env.get("EMAIL_EVENTS_MAX_PER_DAY") ?? "1000");
const dailyAlertThreshold = Number(Deno.env.get("EMAIL_DAILY_ALERT_THRESHOLD") ?? "1000");
const pauseAutomatic = (Deno.env.get("EMAIL_PAUSE_AUTOMATIC") ?? "false").toLowerCase() === "true";
const testMode = (Deno.env.get("EMAIL_TEST_MODE") ?? "false").toLowerCase() === "true";
const testRecipient = Deno.env.get("EMAIL_TEST_RECIPIENT") ?? "";
const companyLogoUrls: Record<string, string> = {
  prodelar: "https://drive.google.com/uc?export=view&id=1mOb9M7VjXirADvI8En-zBY8Xtz6YolqP",
  colmob: "https://drive.google.com/uc?export=view&id=1Cp1Ylg7VFq4w8SUjIoNKZliCVpcaN87c",
  servimec: "https://drive.google.com/uc?export=view&id=1TxPxHf8h8MxF7OLFoqGLEPsF-zPf-Qx_",
};

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

function renderTemplate(template: string, payload: Record<string, unknown>) {
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key: string) => {
    const value = key.split(".").reduce<unknown>((current, part) => {
      if (current && typeof current === "object" && part in current) {
        return (current as Record<string, unknown>)[part];
      }
      return undefined;
    }, payload);
    return value === undefined || value === null ? "" : String(value);
  });
}

function renderHtmlTemplate(template: string, payload: Record<string, unknown>) {
  return renderTemplate(template, payload).replace(/\\n/g, "<br>");
}

function normalizeCompanyLogoKey(value: unknown) {
  const normalized = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  if (normalized.includes("COLMOB")) return "colmob";
  if (normalized.includes("SERVIMEC")) return "servimec";
  return "prodelar";
}

function payloadWithCompanyLogo(payload: Record<string, unknown>) {
  const explicitLogo = payload.empresa_logo_url;
  if (explicitLogo) return payload;
  const companyKey = normalizeCompanyLogoKey(payload.empresa ?? payload.company ?? payload.company_name);
  return {
    ...payload,
    empresa_logo_url: companyLogoUrls[companyKey] ?? companyLogoUrls.prodelar,
  };
}

function utf8ToBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64UrlEncode(value: string) {
  return utf8ToBase64(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function encodeHeader(value: string) {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${utf8ToBase64(value)}?=`;
}

function formatAddress(email: string, name?: string | null) {
  return name ? `${encodeHeader(name)} <${email}>` : email;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtml(body: string) {
  return escapeHtml(body)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function buildStandardHtml(subject: string, body: string, event: EmailEvent) {
  const moduleLabel = event.module_name ? event.module_name.replace(/_/g, " ") : "recursos humanos";
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:92%;background:#ffffff;border:1px solid #dde3ea;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#111827;color:#ffffff;padding:18px 24px;">
                <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#cbd5e1;">Grupo Prodelar</div>
                <div style="font-size:20px;font-weight:700;margin-top:4px;">Recursos Humanos</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <div style="font-size:12px;text-transform:uppercase;color:#64748b;margin-bottom:8px;">${escapeHtml(moduleLabel)}</div>
                <h1 style="font-size:22px;line-height:1.3;margin:0 0 18px;color:#111827;">${escapeHtml(subject)}</h1>
                <div style="font-size:15px;line-height:1.55;color:#334155;">${textToHtml(body)}</div>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e5e7eb;padding:16px 24px;color:#64748b;font-size:12px;line-height:1.45;">
                Esta é uma comunicação operacional automática do RH. Não envie dados sensíveis por resposta de e-mail; use o portal autenticado quando houver link.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildMimeMessage(event: EmailEvent, subject: string, body: string, htmlBody: string, actualRecipientEmail: string) {
  const cc = testMode ? [] : event.cc;
  const bcc = testMode ? [] : event.bcc;
  const boundary = `prodelar-rh-${crypto.randomUUID()}`;
  const headers = [
    `From: ${formatAddress(senderEmail, "Recursos Humanos Prodelar")}`,
    `To: ${formatAddress(actualRecipientEmail, testMode ? `TESTE - ${event.recipient_name ?? event.recipient_email}` : event.recipient_name)}`,
    cc?.length ? `Cc: ${cc.join(", ")}` : null,
    bcc?.length ? `Bcc: ${bcc.join(", ")}` : null,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean);
  return [
    headers.join("\r\n"),
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    htmlBody,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

async function getGoogleAccessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error_description ?? body.error ?? "Google OAuth token error");
  }
  return body.access_token as string;
}

async function sendWithGmail(event: EmailEvent, subject: string, body: string, htmlBody: string) {
  if (!senderEmail || !clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Workspace email env vars are not configured.");
  }
  if (testMode && !testRecipient) {
    throw new Error("EMAIL_TEST_MODE is active but EMAIL_TEST_RECIPIENT is not configured.");
  }

  const accessToken = await getGoogleAccessToken();
  const actualRecipientEmail = testMode ? testRecipient : event.recipient_email;
  const testBody = testMode
    ? [
      "[MODO TESTE]",
      `Destinatário original: ${event.recipient_email}`,
      event.cc?.length ? `Cc original: ${event.cc.join(", ")}` : "",
      event.bcc?.length ? `Bcc original: ${event.bcc.join(", ")}` : "",
      "",
      body,
    ].filter(Boolean).join("\n")
    : body;
  const testHtmlBody = testMode
    ? `<div style="border:1px solid #f59e0b;background:#fffbeb;color:#92400e;padding:12px;margin-bottom:18px;font-family:Arial,Helvetica,sans-serif;"><strong>MODO TESTE</strong><br>Destinatário original: ${escapeHtml(event.recipient_email)}</div>${htmlBody}`
    : htmlBody;
  const raw = base64UrlEncode(buildMimeMessage(event, subject, testBody, testHtmlBody, actualRecipientEmail));
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(senderEmail)}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message ?? "Gmail API send error");
  }
  return {
    providerMessageId: result.id as string,
    actualRecipientEmail,
  };
}

async function processEvent(event: EmailEvent) {
  const { data: currentEvent } = await supabase
    .from("email_events")
    .select("status")
    .eq("id", event.id)
    .single<{ status: string }>();
  if (currentEvent?.status !== "processing") {
    throw new Error(`Email event is no longer processing: ${currentEvent?.status ?? "unknown"}`);
  }

  const { data: template, error: templateError } = await supabase
    .from("email_templates")
    .select("subject_template,body_template,body_html_template")
    .eq("app_name", event.app_name)
    .eq("template_key", event.template_key)
    .eq("is_active", true)
    .single<EmailTemplate>();

  if (templateError || !template) {
    throw new Error(templateError?.message ?? `Template not found: ${event.app_name}/${event.template_key}`);
  }

  const payload = payloadWithCompanyLogo(event.payload ?? {});
  const subject = event.subject || renderTemplate(template.subject_template, payload);
  const body = renderTemplate(template.body_template, payload);
  const htmlBody = template.body_html_template
    ? renderHtmlTemplate(template.body_html_template, payload)
    : buildStandardHtml(subject, body, event);
  const { providerMessageId, actualRecipientEmail } = await sendWithGmail(event, subject, body, htmlBody);

  const { data: updatedEvent, error: updateError } = await supabase.from("email_events").update({
    status: "sent",
    sent_at: new Date().toISOString(),
    last_error: null,
  }).eq("id", event.id).eq("status", "processing").select("id").single();

  if (updateError || !updatedEvent) {
    throw new Error(updateError?.message ?? "Email event changed before it could be marked as sent.");
  }

  await supabase.from("email_delivery_logs").insert({
    email_event_id: event.id,
    provider: "gmail_api",
    provider_message_id: providerMessageId,
    status: "sent",
    test_mode: testMode,
    original_recipient_email: event.recipient_email,
    actual_recipient_email: actualRecipientEmail,
  });
}

function retryScheduleForAttempt(attempts: number) {
  if (attempts <= 1) return { status: "pending", scheduledFor: new Date(Date.now() + 5 * 60_000).toISOString() };
  if (attempts === 2) return { status: "pending", scheduledFor: new Date(Date.now() + 15 * 60_000).toISOString() };
  if (attempts === 3) return { status: "pending", scheduledFor: new Date(Date.now() + 60 * 60_000).toISOString() };
  return { status: "failed", scheduledFor: new Date().toISOString() };
}

async function sentCountSince(date: Date) {
  const { count, error } = await supabase
    .from("email_delivery_logs")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("created_at", date.toISOString());
  if (error) throw error;
  return count ?? 0;
}

async function enforceSendingLimits(requestedBatchSize: number) {
  if (pauseAutomatic) {
    return { allowed: 0, paused: true, reason: "Automatic email sending is paused by EMAIL_PAUSE_AUTOMATIC.", hourCount: 0, dayCount: 0 };
  }
  const hourCount = await sentCountSince(new Date(Date.now() - 60 * 60_000));
  const dayCount = await sentCountSince(new Date(Date.now() - 24 * 60 * 60_000));
  if (hourCount >= maxPerHour) {
    return { allowed: 0, paused: true, reason: `Hourly email limit reached: ${hourCount}/${maxPerHour}`, hourCount, dayCount };
  }
  if (dayCount >= maxPerDay) {
    return { allowed: 0, paused: true, reason: `Daily email limit reached: ${dayCount}/${maxPerDay}`, hourCount, dayCount };
  }
  const allowed = Math.max(0, Math.min(requestedBatchSize, batchSize, 20, maxPerHour - hourCount, maxPerDay - dayCount));
  const nearDailyLimit = dayCount >= dailyAlertThreshold;
  return { allowed, paused: false, nearDailyLimit, hourCount, dayCount };
}

Deno.serve(async (request) => {
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Supabase env vars are not configured." }, { status: 500 });
  }

  const requestedBatchSize = request.method === "POST"
    ? Number((await request.json().catch(() => ({}))).batchSize ?? batchSize)
    : batchSize;

  const limits = await enforceSendingLimits(requestedBatchSize);
  if (limits.paused || limits.allowed <= 0) {
    return Response.json({ claimed: 0, paused: true, reason: limits.reason, limits });
  }

  const { data: events, error } = await supabase.rpc("claim_pending_email_events", {
    batch_size: limits.allowed,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{ id: string; status: "sent" | "failed"; error?: string }> = [];

  for (const event of (events ?? []) as EmailEvent[]) {
    try {
      await processEvent(event);
      results.push({ id: event.id, status: "sent" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retry = retryScheduleForAttempt(event.attempts);
      await supabase.from("email_events").update({
        status: retry.status,
        last_error: message,
        scheduled_for: retry.scheduledFor,
      }).eq("id", event.id).eq("status", "processing");
      await supabase.from("email_delivery_logs").insert({
        email_event_id: event.id,
        provider: "gmail_api",
        status: "failed",
        test_mode: testMode,
        original_recipient_email: event.recipient_email,
        actual_recipient_email: testMode ? testRecipient : event.recipient_email,
        error_message: message,
      });
      results.push({ id: event.id, status: "failed", error: message });
    }
  }

  return Response.json({
    claimed: events?.length ?? 0,
    testMode,
    limits,
    results,
  });
});
