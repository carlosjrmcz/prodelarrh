import fs from "fs";

function loadEnv() {
  const rows = fs.readFileSync(".env", "utf8").split(/\n/);
  return Object.fromEntries(
    rows
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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env.");
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

async function rest(path, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function deleteAuthUser(userId) {
  if (!userId) return false;
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers,
  });
  if (response.status === 404) return false;
  if (!response.ok) {
    throw new Error(`auth ${userId}: ${response.status} ${await response.text()}`);
  }
  return true;
}

function normalizeName(value) {
  return String(value || "").trim().toUpperCase();
}

function employeeRank(employee, profiles) {
  const linkedProfiles = profiles.filter((profile) => profile.employee_id === employee.id);
  const hasProfile = linkedProfiles.length ? 1 : 0;
  const hasDirector = linkedProfiles.some((profile) => profile.role_code === "diretor") ? 1 : 0;
  const created = Date.parse(employee.created_at || "") || 0;
  return hasProfile * 100 + hasDirector * 10 + created / 1e15;
}

const employees = await rest("hr_employees?select=id,full_name,admission_date,status,created_at&order=full_name.asc");
const profiles = await rest("hr_profiles?select=id,employee_id,full_name,email,role_code,auth_user_id,created_at&order=full_name.asc");

const byName = new Map();
for (const employee of employees) {
  const key = normalizeName(employee.full_name);
  if (!key) continue;
  if (!byName.has(key)) byName.set(key, []);
  byName.get(key).push(employee);
}

const duplicateGroups = [...byName.values()].filter((group) => group.length > 1);
const removedEmployees = [];
const removedProfiles = [];
const removedAuthUsers = [];

for (const group of duplicateGroups) {
  const [keep, ...remove] = [...group].sort((a, b) => employeeRank(b, profiles) - employeeRank(a, profiles));
  for (const employee of remove) {
    const linkedProfiles = profiles.filter((profile) => profile.employee_id === employee.id);
    for (const profile of linkedProfiles) {
      await rest(`hr_profiles?id=eq.${profile.id}`, { method: "DELETE" });
      removedProfiles.push(profile.email || profile.id);
      if (await deleteAuthUser(profile.auth_user_id || profile.id)) removedAuthUsers.push(profile.email || profile.id);
    }
    await rest(`hr_employees?id=eq.${employee.id}`, { method: "DELETE" });
    removedEmployees.push(`${employee.full_name} (${employee.id})`);
  }
  console.log(`Mantido: ${keep.full_name} (${keep.id})`);
}

const orphanProfiles = profiles.filter((profile) => !profile.employee_id);
for (const profile of orphanProfiles) {
  await rest(`hr_profiles?id=eq.${profile.id}`, { method: "DELETE" });
  removedProfiles.push(profile.email || profile.id);
  if (await deleteAuthUser(profile.auth_user_id || profile.id)) removedAuthUsers.push(profile.email || profile.id);
}

console.log(JSON.stringify({
  duplicateGroups: duplicateGroups.length,
  removedEmployees,
  removedProfiles,
  removedAuthUsers,
}, null, 2));
