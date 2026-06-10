import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const INDEX_FILE = "docs/google-drive-folder-index.json";
const DRIVE_URL = "https://drive.google.com/drive/folders/";

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

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function folderUrl(id) {
  return `${DRIVE_URL}${id}`;
}

async function upsertFolder(supabase, folder) {
  const query = supabase
    .from("hr_drive_folders")
    .select("id")
    .eq("folder_type", folder.folder_type)
    .is("employee_id", null)
    .maybeSingle();

  const { data: existing, error: selectError } = folder.company_id
    ? await query.eq("company_id", folder.company_id)
    : await query.is("company_id", null);

  if (selectError) throw selectError;

  if (existing?.id) {
    const { error } = await supabase
      .from("hr_drive_folders")
      .update(folder)
      .eq("id", existing.id);
    if (error) throw error;
    return "updated";
  }

  const { error } = await supabase.from("hr_drive_folders").insert(folder);
  if (error) throw error;
  return "inserted";
}

const env = loadEnv();
const index = JSON.parse(readFileSync(INDEX_FILE, "utf8"));
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: companies, error: companiesError } = await supabase
  .from("hr_companies")
  .select("id,code,name,legal_name");

if (companiesError) throw companiesError;

const companyByKey = new Map();
for (const company of companies ?? []) {
  const normalized = normalize(`${company.code} ${company.name} ${company.legal_name}`);
  for (const key of ["PRODELAR", "COLMOB", "SERVIMEC"]) {
    if (normalized.includes(key)) companyByKey.set(key, company);
  }
}

const folders = [];

folders.push({
  folder_type: "drive_root",
  folder_name: "RH Prodelar",
  drive_folder_id: index.root,
  drive_folder_url: folderUrl(index.root),
  company_id: null,
});

for (const [companyKey, folderId] of Object.entries(index.companies ?? {})) {
  const company = companyByKey.get(companyKey);
  folders.push({
    folder_type: "company_root",
    folder_name: companyKey,
    drive_folder_id: folderId,
    drive_folder_url: folderUrl(folderId),
    company_id: company?.id ?? null,
  });
}

for (const [inboxKey, folderId] of Object.entries(index.inbox ?? {})) {
  folders.push({
    folder_type: `inbox_${inboxKey}`,
    folder_name: `Inbox/${inboxKey}`,
    drive_folder_id: folderId,
    drive_folder_url: folderUrl(folderId),
    company_id: null,
  });
}

for (const [companyKey, modules] of Object.entries(index.modules ?? {})) {
  const company = companyByKey.get(companyKey);
  for (const [moduleKey, folderId] of Object.entries(modules ?? {})) {
    folders.push({
      folder_type: `module_${moduleKey.toLowerCase()}`,
      folder_name: `${companyKey}/${moduleKey}`,
      drive_folder_id: folderId,
      drive_folder_url: folderUrl(folderId),
      company_id: company?.id ?? null,
    });
  }
}

let inserted = 0;
let updated = 0;
let errors = 0;

for (const folder of folders) {
  try {
    const result = await upsertFolder(supabase, folder);
    if (result === "inserted") inserted += 1;
    if (result === "updated") updated += 1;
  } catch (error) {
    errors += 1;
    console.error(`Erro ao sincronizar ${folder.folder_type}/${folder.folder_name}:`, error.message);
  }
}

console.log(JSON.stringify({
  source: INDEX_FILE,
  planned: folders.length,
  inserted,
  updated,
  errors,
  companiesMatched: [...companyByKey.keys()],
}, null, 2));
