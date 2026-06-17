import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnv(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv(resolve(process.cwd(), ".env"));

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("ERRO: VITE_SUPABASE_URL/SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const INITIAL_PASSWORD = "123456";
const ACCESS_DOMAIN = "acesso.prodelar.local";

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function usernamePart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function firstTwoNameUsername(fullName) {
  const parts = String(fullName || "").split(/\s+/).filter(Boolean);
  return usernamePart(`${parts[0] || ""}${parts[1] || ""}`);
}

function firstNameUsername(fullName) {
  return usernamePart(String(fullName || "").split(/\s+/).filter(Boolean)[0] || fullName);
}

function includesAny(value, needles) {
  const text = normalize(value);
  return needles.some((needle) => text.includes(normalize(needle)));
}

function roleForEmployee(employee, existingRole = "") {
  const name = employee.full_name || "";
  const position = employee.position_name || "";
  const level = normalize(employee.leadership_level || "");
  const current = String(existingRole || employee.role_code || "").trim();

  if (includesAny(name, ["ANA PAULA MAIA PAIVA", "FERNANDA PATRICIA ROCHA CAVALCANTE"])) return "gestor_rh";
  if (includesAny(name, ["CARLOS ALBERTO PIMENTEL", "ANDERSON PRAZERES NASCIMENTO", "ANDERSON NASCIMENTO", "ALBERTO GUETEL", "ALBERTO GUET"])) return "diretor";
  if (current && current !== "colaborador") return current;
  if (["DIRECTOR", "DIRETOR", "DIRETORIA"].includes(level)) return "diretor";
  if (["HR", "RH"].includes(level)) return "gestor_rh";
  if (["MANAGER", "GERENTE", "GESTOR"].includes(level)) return "gestor";
  if (["SUPERVISOR", "LIDER", "LEADER"].includes(level)) return "supervisor";
  if (normalize(position).includes("GERENTE")) return "gestor";
  if (normalize(position).includes("SUPERVISOR")) return "supervisor";
  return "colaborador";
}

async function listAllAuthUsers() {
  const users = [];
  for (let page = 1; page <= 200; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...(data?.users || []));
    if (!data?.users?.length || data.users.length < 1000) break;
  }
  return users;
}

async function updateEmployeeLeadership(employee, roleCode) {
  const leadershipLevel =
    roleCode === "diretor" ? "director" :
    roleCode === "gestor_rh" ? "hr" :
    roleCode === "gestor" || roleCode === "gestor_financeiro" ? "manager" :
    roleCode === "supervisor" ? "supervisor" :
    "employee";

  const { error } = await supabase
    .from("hr_employees")
    .update({ leadership_level: leadershipLevel })
    .eq("id", employee.id);

  if (error && !String(error.message || "").includes("leadership_level")) {
    throw error;
  }
}

async function upsertProfile(user, employee, roleCode, loginUsername) {
  const payload = {
    id: user.id,
    auth_user_id: user.id,
    employee_id: employee.id,
    full_name: employee.full_name,
    email: user.email,
    role_code: roleCode,
    is_active: true,
  };

  const withUsername = { ...payload, login_username: loginUsername };
  let result = await supabase.from("hr_profiles").upsert(withUsername, { onConflict: "id" });
  if (result.error && String(result.error.message || "").includes("login_username")) {
    result = await supabase.from("hr_profiles").upsert(payload, { onConflict: "id" });
  }
  if (result.error) throw result.error;
}

async function main() {
  const { data: employees, error: employeeError } = await supabase
    .from("hr_employee_directory")
    .select("id, full_name, status, company_name, department_name, position_name")
    .eq("status", "active")
    .order("full_name");

  if (employeeError) throw employeeError;

  const { data: profiles, error: profileError } = await supabase
    .from("hr_profiles")
    .select("id, employee_id, role_code, email");
  if (profileError) throw profileError;

  const profileByEmployee = new Map((profiles || []).map((profile) => [profile.employee_id, profile]));
  const firstNameCounts = new Map();
  for (const employee of employees || []) {
    const first = firstNameUsername(employee.full_name);
    firstNameCounts.set(first, (firstNameCounts.get(first) || 0) + 1);
  }

  const authUsers = await listAllAuthUsers();
  const authByEmail = new Map(authUsers.map((user) => [String(user.email || "").toLowerCase(), user]));

  const report = {
    employees: employees?.length || 0,
    created: 0,
    updated: 0,
    profiles: 0,
    roleUpdates: 0,
    errors: [],
    samples: [],
  };

  for (const employee of employees || []) {
    const first = firstNameUsername(employee.full_name);
    const loginUsername = firstNameCounts.get(first) > 1 ? firstTwoNameUsername(employee.full_name) : first;
    const email = `${loginUsername}@${ACCESS_DOMAIN}`;
    const existingProfile = profileByEmployee.get(employee.id);
    const roleCode = roleForEmployee(employee, existingProfile?.role_code || "");
    const metadata = {
      full_name: employee.full_name,
      role_code: roleCode,
      employee_id: employee.id,
      login_username: loginUsername,
      company_name: employee.company_name || "",
      department_name: employee.department_name || "",
      access_mode: "definitive",
    };

    try {
      let user = authByEmail.get(email.toLowerCase());
      if (!user) {
        const created = await supabase.auth.admin.createUser({
          email,
          password: INITIAL_PASSWORD,
          email_confirm: true,
          user_metadata: metadata,
        });
        if (created.error) throw created.error;
        user = created.data.user;
        authByEmail.set(email.toLowerCase(), user);
        report.created += 1;
      } else {
        const updated = await supabase.auth.admin.updateUserById(user.id, {
          password: INITIAL_PASSWORD,
          user_metadata: metadata,
        });
        if (updated.error) throw updated.error;
        user = updated.data.user || user;
        report.updated += 1;
      }

      await upsertProfile(user, employee, roleCode, loginUsername);
      await updateEmployeeLeadership(employee, roleCode);
      report.profiles += 1;
      report.roleUpdates += 1;
      if (report.samples.length < 12) report.samples.push(`${loginUsername} / ${INITIAL_PASSWORD} / ${roleCode} / ${employee.full_name}`);
    } catch (error) {
      report.errors.push(`${employee.full_name}: ${error.message}`);
    }
  }

  console.log("ACESSOS DEFINITIVOS — RELATÓRIO");
  console.log(`Colaboradores ativos lidos: ${report.employees}`);
  console.log(`Usuários Auth criados: ${report.created}`);
  console.log(`Usuários Auth atualizados: ${report.updated}`);
  console.log(`Perfis vinculados/atualizados: ${report.profiles}`);
  console.log(`Leadership level atualizado: ${report.roleUpdates}`);
  console.log(`Senha inicial: ${INITIAL_PASSWORD}`);
  console.log("\nAmostra de logins:");
  for (const sample of report.samples) console.log(`- ${sample}`);
  console.log(`\nErros: ${report.errors.length}`);
  for (const error of report.errors) console.log(`- ${error}`);

  if (report.errors.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error("ERRO CRÍTICO:", error.message);
  process.exit(1);
});
