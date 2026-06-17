import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

function parseEnvFile(path) {
  const env = {};
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = parseEnvFile(resolve(process.cwd(), ".env"));
const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("VITE_SUPABASE_URL/SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env");
}

async function supabaseRest(path) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase REST ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

const templates = await supabaseRest(
  "email_templates?select=template_key,module_name,body_template,body_html_template,subject_template,is_active&is_active=eq.true&order=module_name.asc",
);

const varPorTemplate = {};
const todasVars = new Set();

for (const template of templates) {
  const texto = [template.body_template, template.body_html_template, template.subject_template].join(" ");
  const matches = [...texto.matchAll(/\{\{([^}]+)\}\}/g)].map((match) => match[1].trim());
  varPorTemplate[template.template_key] = {
    modulo: template.module_name,
    vars: [...new Set(matches)],
  };
  matches.forEach((variable) => todasVars.add(variable));
}

const mapeamento = {
  colaborador_nome: "hr_employees.full_name",
  empresa: "hr_companies.name",
  cargo: "hr_positions.name",
  departamento: "hr_departments.name",
  gestor_nome: "hr_employees.full_name (manager)",
  data_inicio: "hr_vacation_periods.planned_start / hr_employees.admission_date",
  data_fim: "hr_vacation_periods.planned_end",
  data_retorno: "hr_vacation_periods.planned_end + 1",
  competencia: "hr_paystubs.competence_month",
  status: "campo.status",
  prazo: "campo.due_at / legal_limit_date",
  motivo: "hr_requests.description",
  link: "gerado pelo sistema",
  responsavel: "hr_profiles.full_name (RH)",
  data_admissao: "hr_employees.admission_date",
  periodo: "calculado: planned_start a planned_end",
  data_credito: "NAO EXISTE NO BANCO",
  anos: "calculado: diff admission_date / birth_date",
  total_colaboradores: "calculado: COUNT hr_employees",
  admissoes: "calculado: COUNT admissões no período",
  desligamentos: "calculado: COUNT desligamentos no período",
  ferias: "calculado: COUNT férias programadas",
  asos: "NAO EXISTE - tabela hr_aso ainda não criada",
  item: "NAO EXISTE - tabela hr_epi ainda não criada",
  tipo_afastamento: "NAO EXISTE - tabela hr_atestados ainda não criada",
  beneficio: "NAO EXISTE - tabela hr_beneficios não existe",
  treinamento: "NAO EXISTE - tabela hr_treinamentos não existe",
  tipo_documento: "hr_employee_documents.document_type",
  assunto: "passado no payload manual",
  mensagem: "passado no payload manual",
  observacao: "passado no payload manual",
  titulo: "passado no payload manual",
  data_hora: "gerado pelo sistema",
  event_type: "email_events.event_type",
  pendencias: "passado no payload manual",
  orientacoes: "passado no payload manual",
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const semMapeamento = [...todasVars].filter((variable) => !mapeamento[variable]);
const semCampoBanco = Object.entries(mapeamento)
  .filter(([, source]) => source.includes("NAO EXISTE"))
  .map(([variable]) => variable)
  .filter((variable) => todasVars.has(variable));

let rows = "";
for (const [templateKey, info] of Object.entries(varPorTemplate)) {
  for (const variable of info.vars) {
    const fonte = mapeamento[variable] || "? SEM MAPEAMENTO";
    const cor = fonte.includes("NAO EXISTE") ? "#FCEBEB" : fonte.includes("?") ? "#FAEEDA" : "#EAF3DE";
    rows += `<tr style="background:${cor}">
      <td style="padding:6px 10px;font-size:12px;color:#666">${escapeHtml(info.modulo)}</td>
      <td style="padding:6px 10px;font-size:12px;font-weight:600">${escapeHtml(templateKey)}</td>
      <td style="padding:6px 10px;font-size:12px;font-family:monospace;color:#1a5c3a">{{${escapeHtml(variable)}}}</td>
      <td style="padding:6px 10px;font-size:12px">${escapeHtml(fonte)}</td>
    </tr>`;
  }
}

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Auditoria de Cobertura - Templates RH</title>
<style>
body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; color:#16212f; }
.header { background: #1a5c3a; color: #fff; padding: 20px 24px; border-radius: 6px; margin-bottom: 20px; }
.card { background: #fff; border-radius: 6px; padding: 16px 20px; margin-bottom: 16px; border: 1px solid #ddd; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { background: #1a5c3a; color: #fff; padding: 8px 10px; text-align: left; font-size: 12px; }
tr:nth-child(even) td { filter: brightness(0.97); }
.legend { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.leg { padding: 4px 12px; border-radius: 4px; font-size: 12px; }
.chip { padding:3px 10px; border-radius:4px; font-size:12px; margin:3px; display:inline-block; font-family:monospace; }
</style>
</head>
<body>
<div class="header">
  <h1 style="font-size:20px">Auditoria de Cobertura - Templates RH Prodelar</h1>
  <p style="font-size:12px;color:#a8d5b5;margin-top:4px">
    ${templates.length} templates · ${todasVars.size} variáveis únicas ·
    ${semCampoBanco.length} variáveis sem campo no banco ·
    ${semMapeamento.length} sem mapeamento conhecido
  </p>
</div>

<div class="card">
  <h2 style="font-size:15px;margin-bottom:12px;color:#1a5c3a">Variáveis que precisam de novas tabelas</h2>
  ${
    semCampoBanco.length
      ? semCampoBanco.map((variable) => `<span class="chip" style="background:#FCEBEB;color:#A32D2D">{{${escapeHtml(variable)}}}</span>`).join("")
      : '<p style="color:#888;font-size:13px">Nenhuma variável usada nos templates ativos depende de tabela inexistente.</p>'
  }
</div>

<div class="card">
  <h2 style="font-size:15px;margin-bottom:12px;color:#1a5c3a">Variáveis sem mapeamento definido</h2>
  ${
    semMapeamento.length === 0
      ? '<p style="color:#888;font-size:13px">Todas mapeadas.</p>'
      : semMapeamento.map((variable) => `<span class="chip" style="background:#FAEEDA;color:#854F0B">{{${escapeHtml(variable)}}}</span>`).join("")
  }
</div>

<div class="card">
  <div class="legend">
    <span class="leg" style="background:#EAF3DE;color:#3B6D11">Campo existe no banco/payload</span>
    <span class="leg" style="background:#FCEBEB;color:#A32D2D">Tabela não existe ainda</span>
    <span class="leg" style="background:#FAEEDA;color:#854F0B">Sem mapeamento</span>
  </div>
  <table>
    <tr>
      <th>Módulo</th>
      <th>Template</th>
      <th>Variável</th>
      <th>Fonte no banco</th>
    </tr>
    ${rows}
  </table>
</div>
</body>
</html>`;

const outputPath = resolve(process.cwd(), "auditoria-cobertura-templates.html");
writeFileSync(outputPath, html);

try {
  mkdirSync("/mnt/user-data/outputs", { recursive: true });
  copyFileSync(outputPath, "/mnt/user-data/outputs/auditoria-cobertura-templates.html");
} catch {
  // Ambiente desktop local pode não ter /mnt/user-data/outputs.
}

console.log(JSON.stringify({
  arquivo: outputPath,
  totalTemplates: templates.length,
  totalVariaveisUnicas: todasVars.size,
  variaveisSemCampoNoBanco: semCampoBanco,
  variaveisSemMapeamento: semMapeamento,
}, null, 2));
