import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const OUTPUT_FILE = "docs/revisao-comunicados-rh.html";
const LOGO_COLMOB_URL = "https://drive.google.com/uc?export=view&id=1Cp1Ylg7VFq4w8SUjIoNKZliCVpcaN87c";

function loadEnv(path = ".env") {
  const env = {};
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slug(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const samplePayload = {
  colaborador_nome: "Carlos Teste",
  empresa: "Colmob",
  competencia: "Junho/2026",
  link: "http://127.0.0.1:5174",
  gestor_nome: "Ana Paula RH",
  responsavel: "Recursos Humanos",
  prazo: "20/06/2026",
  data: "10/06/2026",
  data_credito: "30/06/2026",
  departamento: "Administrativo",
  cargo: "Assistente Administrativo",
  status: "Pendente",
  observacao: "Exemplo para revisão",
  empresa_logo_url: LOGO_COLMOB_URL,
  data_inicio: "15/06/2026",
  data_fim: "30/06/2026",
  data_retorno: "01/07/2026",
  data_admissao: "10/06/2026",
  periodo: "15/06/2026 a 30/06/2026",
  motivo: "Teste de revisão visual",
  assunto: "Comunicado de exemplo",
  mensagem: "Mensagem fictícia para revisão do layout.",
  titulo: "Título de exemplo",
  data_hora: "10/06/2026 10:00",
  event_type: "evento_exemplo",
  pendencias: "Nenhuma pendência crítica",
  orientacoes: "Acesse o portal para mais detalhes.",
  pendencia: "Documento pendente",
  data_evento: "10/06/2026",
  saldo: "12 dias",
  erro: "Exemplo de erro",
  total_processados: "25",
  rotina_nome: "Fechamento mensal",
};

function renderTemplate(template, payload = samplePayload) {
  return String(template ?? "").replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => {
    const value = key.split(".").reduce((current, part) => {
      if (current && typeof current === "object" && part in current) return current[part];
      return undefined;
    }, payload);
    return value === undefined || value === null ? "" : String(value);
  }).replace(/\\n/g, "<br>");
}

function badge(label, kind) {
  const colors = {
    ok: ["#EAF3DE", "#3B6D11"],
    warn: ["#FAEEDA", "#854F0B"],
    off: ["#F1EFE8", "#5F5E5A"],
    info: ["#E6F1FB", "#0C447C"],
  };
  const [bg, color] = colors[kind] ?? colors.info;
  return `<span class="badge" style="background:${bg};color:${color}">${escapeHtml(label)}</span>`;
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const templateColumns = "template_key,app_name,module_name,recipient_type,audience_scope,delivery_channel,subject_template,body_template,body_html_template,is_active,requires_review";
const { data: templates, error } = await supabase
  .from("email_templates")
  .select(templateColumns)
  .order("module_name", { ascending: true })
  .order("template_key", { ascending: true });

if (error) throw error;

const allTemplates = templates ?? [];
const total = allTemplates.length;
const active = allTemplates.filter((template) => template.is_active).length;
const inactive = total - active;
const withHtml = allTemplates.filter((template) => template.body_html_template).length;
const withoutHtml = total - withHtml;
const requiresReview = allTemplates.filter((template) => template.requires_review).length;

const indexHtml = allTemplates.map((template) => {
  const id = slug(template.template_key);
  return `<a href="#${id}">${escapeHtml(template.template_key)}</a>`;
}).join("");

const cardsHtml = allTemplates.map((template) => {
  const id = slug(template.template_key);
  const subject = renderTemplate(template.subject_template);
  const rawBody = renderTemplate(template.body_template).replace(/<br>/g, "\n");
  const preview = template.body_html_template
    ? renderTemplate(template.body_html_template)
    : `<div class="missing-html">SEM HTML</div>`;

  return `<section class="template-card" id="${id}">
  <div class="template-header">
    <div>
      <div class="template-key">${escapeHtml(template.template_key)}</div>
      <div class="subject">${escapeHtml(subject)}</div>
    </div>
    <div class="badges">
      ${badge(template.is_active ? "ativo" : "inativo", template.is_active ? "ok" : "off")}
      ${badge(template.requires_review ? "exige revisão" : "sem revisão", template.requires_review ? "warn" : "info")}
      ${badge(template.body_html_template ? "com HTML" : "SEM HTML", template.body_html_template ? "ok" : "warn")}
    </div>
  </div>
  <dl class="meta">
    <div><dt>App</dt><dd>${escapeHtml(template.app_name)}</dd></div>
    <div><dt>Módulo</dt><dd>${escapeHtml(template.module_name)}</dd></div>
    <div><dt>Evento</dt><dd>NÃO ENCONTRADO</dd></div>
    <div><dt>Público</dt><dd>${escapeHtml(template.audience_scope ?? template.recipient_type)}</dd></div>
    <div><dt>Canal</dt><dd>${escapeHtml(template.delivery_channel)}</dd></div>
  </dl>
  <div class="split">
    <div>
      <h3>Body template</h3>
      <pre>${escapeHtml(rawBody)}</pre>
    </div>
    <div>
      <h3>Preview HTML</h3>
      <div class="preview">${preview}</div>
    </div>
  </div>
</section>`;
}).join("\n");

const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Revisão de Comunicados RH — Grupo Prodelar</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef2f1; color: #17221d; font-family: Arial, Helvetica, sans-serif; }
    .page-header { background: #1a5c3a; color: #fff; padding: 28px; }
    .page-header h1 { margin: 0 0 8px; font-size: 24px; line-height: 1.2; }
    .page-header p { margin: 0; color: #bde0c8; font-size: 13px; }
    main { padding: 22px; max-width: 1440px; margin: 0 auto; }
    .summary { display: grid; grid-template-columns: repeat(6, minmax(120px, 1fr)); gap: 10px; margin-bottom: 18px; }
    .stat { background: #fff; border: 1px solid #d7e2dc; border-radius: 6px; padding: 12px; }
    .stat strong { display: block; color: #1a5c3a; font-size: 22px; }
    .stat span { color: #5f6f67; font-size: 12px; }
    .index { background: #fff; border: 1px solid #d7e2dc; border-radius: 6px; padding: 14px; margin-bottom: 18px; }
    .index h2 { margin: 0 0 10px; font-size: 15px; color: #1a5c3a; }
    .index-links { display: flex; flex-wrap: wrap; gap: 8px; }
    .index-links a { color: #0C447C; background: #E6F1FB; border-radius: 4px; padding: 5px 8px; font-size: 12px; text-decoration: none; }
    .template-card { background: #fff; border: 1px solid #d7e2dc; border-radius: 6px; margin-bottom: 20px; overflow: hidden; break-inside: avoid; }
    .template-header { display: flex; justify-content: space-between; gap: 14px; padding: 16px; border-bottom: 1px solid #edf2ef; }
    .template-key { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #1a5c3a; font-weight: 700; font-size: 14px; }
    .subject { color: #24352d; margin-top: 5px; font-size: 13px; }
    .badges { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; align-content: flex-start; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .meta { display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 8px; padding: 12px 16px; margin: 0; background: #f8fbf9; border-bottom: 1px solid #edf2ef; }
    .meta div { min-width: 0; }
    .meta dt { color: #6b7d74; font-size: 10px; text-transform: uppercase; font-weight: 700; }
    .meta dd { margin: 4px 0 0; color: #24352d; font-size: 12px; overflow-wrap: anywhere; }
    .split { display: grid; grid-template-columns: minmax(260px, .85fr) minmax(320px, 1.15fr); gap: 0; }
    .split > div { padding: 16px; min-width: 0; }
    .split > div:first-child { border-right: 1px solid #edf2ef; }
    h3 { margin: 0 0 10px; color: #1a5c3a; font-size: 13px; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; margin: 0; background: #f6f8f7; border: 1px solid #dde7e1; border-radius: 6px; padding: 12px; color: #24352d; font-size: 12px; line-height: 1.5; }
    .preview { background: #f0f0f0; border: 1px solid #dde7e1; border-radius: 6px; padding: 12px; overflow: auto; }
    .missing-html { background: #FAEEDA; color: #854F0B; border: 1px solid #E9C46A; padding: 16px; border-radius: 6px; font-weight: 700; text-align: center; }
    @media (max-width: 980px) {
      .summary { grid-template-columns: repeat(2, 1fr); }
      .meta { grid-template-columns: repeat(2, 1fr); }
      .split { grid-template-columns: 1fr; }
      .split > div:first-child { border-right: 0; border-bottom: 1px solid #edf2ef; }
    }
    @media print {
      body { background: #fff; }
      main { padding: 0; max-width: none; }
      .index { display: none; }
      .template-card { page-break-inside: avoid; }
      .preview { overflow: visible; }
    }
  </style>
</head>
<body>
  <header class="page-header">
    <h1>Revisão de Comunicados RH — Grupo Prodelar</h1>
    <p>Arquivo local gerado apenas para revisão visual. Nenhum e-mail foi enviado.</p>
  </header>
  <main>
    <section class="summary">
      <div class="stat"><strong>${total}</strong><span>Total de templates</span></div>
      <div class="stat"><strong>${active}</strong><span>Ativos</span></div>
      <div class="stat"><strong>${inactive}</strong><span>Inativos</span></div>
      <div class="stat"><strong>${withHtml}</strong><span>Com HTML</span></div>
      <div class="stat"><strong>${withoutHtml}</strong><span>Sem HTML</span></div>
      <div class="stat"><strong>${requiresReview}</strong><span>Exigem revisão</span></div>
    </section>
    <nav class="index">
      <h2>Índice</h2>
      <div class="index-links">${indexHtml}</div>
    </nav>
    ${cardsHtml}
  </main>
</body>
</html>`;

mkdirSync("docs", { recursive: true });
writeFileSync(OUTPUT_FILE, html);

console.log(JSON.stringify({
  outputFile: OUTPUT_FILE,
  templatesFound: total,
  active,
  inactive,
  withHtml,
  withoutHtml,
  requiresReview,
}, null, 2));
