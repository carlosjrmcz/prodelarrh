import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] ??= value;
  }
}

loadDotEnv(resolve(process.cwd(), ".env"));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const samplePayload = {
  colaborador_nome: "Joao Lucas Teste",
  empresa: "Prodelar",
  cargo: "Tecnico Mobiliario",
  departamento: "Producao",
  gestor_nome: "Maria Andressa",
  data_admissao: "11/12/2025",
  status: "Ativo",
  competencia: "Junho/2026",
  periodo: "15/07/2026 a 30/07/2026",
  prazo: "20/06/2026",
  data_hora: "17/06/2026, 10:00",
  link: "https://rh.grupoprodelar.com.br",
  empresa_logo_url: "https://drive.google.com/uc?export=view&id=1mOb9M7VjXirADvI8En-zBY8Xtz6YolqP",
  assunto: "Comunicado de teste",
  observacao: "Exemplo para diagnostico visual",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTemplate(template, payload = samplePayload) {
  return String(template || "").replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => {
    const value = key.split(".").reduce((current, part) => {
      if (current && typeof current === "object" && part in current) return current[part];
      return undefined;
    }, payload);
    return value === undefined || value === null ? "" : String(value);
  }).replace(/\{\{[^}]+\}\}/g, "");
}

function placeholders(value) {
  return Array.from(new Set(String(value || "").match(/\{\{[^}]+\}\}/g) || [])).sort();
}

const { data: templates, error } = await supabase
  .from("email_templates")
  .select("template_key,module_name,subject_template,body_template,body_html_template,is_active")
  .eq("app_name", "recursos_humanos")
  .eq("is_active", true)
  .order("template_key");

if (error) throw error;

const rows = (templates || []).map((template) => {
  const source = template.body_html_template || template.body_template || "";
  const resolved = renderTemplate(source).replace(/\\n/g, "<br>");
  return {
    ...template,
    sourcePlaceholders: placeholders([template.subject_template, source].join("\n")),
    unresolvedAfterRender: placeholders(resolved),
    resolved,
  };
});

const withHtml = rows.filter((row) => row.body_html_template).length;
const withoutHtml = rows.length - withHtml;
const withUnresolved = rows.filter((row) => row.unresolvedAfterRender.length).length;
const totalSourcePlaceholders = rows.reduce((total, row) => total + row.sourcePlaceholders.length, 0);

const cards = rows.map((row) => `
  <section class="card ${row.unresolvedAfterRender.length ? "warn" : "ok"}">
    <header>
      <div>
        <h2>${escapeHtml(row.template_key)}</h2>
        <p>${escapeHtml(row.module_name || "sem modulo")}</p>
      </div>
      <span>${row.body_html_template ? "com HTML" : "sem HTML"}</span>
    </header>
    <dl>
      <dt>Assunto</dt><dd>${escapeHtml(renderTemplate(row.subject_template))}</dd>
      <dt>Placeholders origem</dt><dd>${escapeHtml(row.sourcePlaceholders.join(", ") || "nenhum")}</dd>
      <dt>Restantes apos render</dt><dd>${escapeHtml(row.unresolvedAfterRender.join(", ") || "nenhum")}</dd>
    </dl>
    <div class="preview">${row.resolved || "<em>sem corpo</em>"}</div>
  </section>
`).join("\n");

const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Diagnostico de placeholders - Prodelar RH</title>
  <style>
    body{margin:0;background:#eef3f5;color:#17212f;font-family:Arial,Helvetica,sans-serif}
    main{max-width:1180px;margin:0 auto;padding:28px}
    h1{margin:0 0 6px;font-size:28px}
    .summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:20px 0}
    .metric,.card{background:#fff;border:1px solid #d7e1e8;border-radius:8px}
    .metric{padding:16px}
    .metric strong{display:block;font-size:28px;margin-top:8px}
    .card{margin:16px 0;overflow:hidden}
    .card header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;background:#f8fafb;border-bottom:1px solid #d7e1e8;padding:16px}
    .card h2{font-size:18px;margin:0}
    .card p{margin:4px 0 0;color:#5b6d82}
    .card span{font-weight:700;color:#155e49;background:#dff2eb;border-radius:999px;padding:5px 10px}
    .card.warn span{color:#8a3c00;background:#ffe5cb}
    dl{display:grid;grid-template-columns:170px 1fr;margin:0;border-bottom:1px solid #edf1f4}
    dt,dd{padding:10px 16px;margin:0;border-top:1px solid #edf1f4}
    dt{font-weight:700;color:#5b6d82;background:#fbfcfd}
    .preview{padding:18px;background:#f2f2f2;overflow:auto}
  </style>
</head>
<body>
  <main>
    <h1>Diagnostico de placeholders - Prodelar RH</h1>
    <p>Simulacao local com payload completo do colaborador e limpeza de placeholders vazios.</p>
    <div class="summary">
      <div class="metric">Templates ativos<strong>${rows.length}</strong></div>
      <div class="metric">Com HTML<strong>${withHtml}</strong></div>
      <div class="metric">Sem HTML<strong>${withoutHtml}</strong></div>
      <div class="metric">Placeholders na origem<strong>${totalSourcePlaceholders}</strong></div>
      <div class="metric">Com sobra apos render<strong>${withUnresolved}</strong></div>
    </div>
    ${cards}
  </main>
</body>
</html>`;

const output = resolve(process.cwd(), "diagnostico-placeholders.html");
writeFileSync(output, html);

const exportPath = "/mnt/user-data/outputs/diagnostico-placeholders.html";
if (existsSync(dirname(exportPath))) {
  mkdirSync(dirname(exportPath), { recursive: true });
  writeFileSync(exportPath, html);
}

console.log(JSON.stringify({
  output,
  templates: rows.length,
  withHtml,
  withoutHtml,
  withUnresolved,
  totalSourcePlaceholders,
}, null, 2));
