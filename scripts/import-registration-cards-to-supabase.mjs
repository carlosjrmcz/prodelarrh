import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(rootDir, "production", "fichas-funcionais", "saida", "employee-registration-cards.json");

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://vncgdelxlevdndnyjyth.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_8Cob4xt50ZC_UGD472vkrQ_IL-NUrWB";
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

function normalizeCode(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 32) || "SEM_CODIGO";
}

function parseBrazilianDate(value) {
  const match = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function parseBrazilianMoney(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const normalized = text.replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

async function getOrCreateCompany(card) {
  const name = card.company_key || card.company_name || "Sem empresa";
  const code = normalizeCode(card.company_key || name);
  const existing = await supabase.from("hr_companies").select("id,name").eq("code", code).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data;

  const created = await supabase
    .from("hr_companies")
    .insert({ code, name, legal_name: card.company_name || name, cnpj: card.company_cnpj || null })
    .select("id,name")
    .single();
  if (created.error) throw new Error(created.error.message);
  return created.data;
}

async function getOrCreateDepartment(companyId, name) {
  const departmentName = name || "Sem setor";
  const existing = await supabase
    .from("hr_departments")
    .select("id,name")
    .eq("company_id", companyId)
    .eq("name", departmentName)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data;

  const created = await supabase
    .from("hr_departments")
    .insert({ company_id: companyId, name: departmentName, code: normalizeCode(departmentName).slice(0, 20) })
    .select("id,name")
    .single();
  if (created.error) throw new Error(created.error.message);
  return created.data;
}

async function getOrCreatePosition(card) {
  const name = card.position || "Sem cargo";
  const existing = await supabase.from("hr_positions").select("id,name").eq("name", name).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data;

  const created = await supabase
    .from("hr_positions")
    .insert({ name, code: normalizeCode(name).slice(0, 24), cbo_code: card.cbo || null })
    .select("id,name")
    .single();
  if (created.error) throw new Error(created.error.message);
  return created.data;
}

async function findExistingEmployee(companyId, card) {
  if (card.cpf) {
    const byCpf = await supabase.from("hr_employees").select("id,employee_code").eq("cpf", card.cpf).maybeSingle();
    if (byCpf.error) throw new Error(byCpf.error.message);
    if (byCpf.data) return byCpf.data;
  }

  if (card.employee_code) {
    const byCode = await supabase
      .from("hr_employees")
      .select("id,employee_code")
      .eq("company_id", companyId)
      .eq("employee_code", card.employee_code)
      .maybeSingle();
    if (byCode.error) throw new Error(byCode.error.message);
    if (byCode.data) return byCode.data;
  }

  return null;
}

function employeeRow(card, company, department, position) {
  return {
    company_id: company.id,
    department_id: department.id,
    position_id: position.id,
    employee_code: card.employee_code || null,
    esocial_registration: card.esocial_registration || null,
    full_name: card.full_name,
    cpf: card.cpf,
    pis_pasep: card.pis_pasep || null,
    birth_date: parseBrazilianDate(card.birth_date),
    admission_date: parseBrazilianDate(card.admission_date),
    termination_date: parseBrazilianDate(card.termination_date),
    status: card.termination_date ? "terminated" : "active",
    base_salary: parseBrazilianMoney(card.base_salary),
    payment_type: card.payment_type || null,
    work_schedule: card.raw_sections?.work_schedule || null,
    phone: card.phone || null,
    address_raw: card.address_raw || null,
    notes: "Importado da ficha funcional em PDF.",
    raw_import: {
      source: "registration_card_pdf",
      imported_at: new Date().toISOString(),
      card,
    },
  };
}

async function importCard(card) {
  const company = await getOrCreateCompany(card);
  const department = await getOrCreateDepartment(company.id, card.department);
  const position = await getOrCreatePosition(card);
  const existing = await findExistingEmployee(company.id, card);
  const row = employeeRow(card, company, department, position);

  if (existing) {
    const { error } = await supabase.from("hr_employees").update(row).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return { status: "updated", employeeCode: row.employee_code, name: row.full_name };
  }

  const { error } = await supabase.from("hr_employees").insert(row);
  if (error) throw new Error(error.message);
  return { status: "created", employeeCode: row.employee_code, name: row.full_name };
}

const cards = JSON.parse(await fs.readFile(registryPath, "utf8"));
const results = [];

for (const card of cards) {
  if (!card.full_name || !card.cpf) {
    results.push({ status: "skipped", reason: "missing name or cpf", name: card.full_name || "" });
    continue;
  }

  try {
    results.push(await importCard(card));
  } catch (error) {
    results.push({ status: "failed", name: card.full_name, employeeCode: card.employee_code, error: error.message });
  }
}

const summary = results.reduce((acc, item) => {
  acc[item.status] = (acc[item.status] || 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({ total: results.length, summary, failed: results.filter((item) => item.status === "failed") }, null, 2));
