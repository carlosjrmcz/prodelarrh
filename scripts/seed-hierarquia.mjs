import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1).replace(/^["']|["']$/g, "")];
    }),
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function getEmployee(nome, companyCode = "") {
  let query = supabase
    .from("hr_employees")
    .select("id, full_name, company:hr_companies(code)")
    .eq("full_name", nome);

  if (companyCode) query = query.eq("company.code", companyCode);

  const { data, error } = await query;
  if (error) throw new Error(`Erro ao buscar ${nome}: ${error.message}`);

  const rows = (data || []).filter((row) => !companyCode || row.company?.code === companyCode);
  if (rows.length === 1) return rows[0];
  if (rows.length > 1) {
    console.log(`⚠️ Ambíguo: ${nome} encontrado ${rows.length} vezes. Informe empresa.`);
    return null;
  }
  return null;
}

async function setManager(nomeColaborador, nomeGestor, companyCode = "", managerCompanyCode = "") {
  const employee = await getEmployee(nomeColaborador, companyCode);
  const manager = await getEmployee(nomeGestor, managerCompanyCode);

  if (!employee || !manager) {
    console.log(`⚠️ Não encontrado: ${nomeColaborador} ou ${nomeGestor}`);
    return false;
  }

  const { error } = await supabase
    .from("hr_employees")
    .update({ manager_employee_id: manager.id })
    .eq("id", employee.id);

  if (error) {
    console.log(`❌ ${nomeColaborador}: ${error.message}`);
    return false;
  }

  console.log(`✅ ${nomeColaborador} → ${nomeGestor}`);
  return true;
}

const C = "CARLOS ALBERTO PIMENTEL DE ANDRADE JUNIOR";
const PATRICIA = "PATRICIA ALVES SANTOS NASCIMENTO";

let ok = 0;
let failed = 0;
async function link(nomeColaborador, nomeGestor, companyCode = "", managerCompanyCode = "") {
  const done = await setManager(nomeColaborador, nomeGestor, companyCode, managerCompanyCode);
  if (done) ok += 1;
  else failed += 1;
}

// PRODELAR
await link("MARIA ANDRESSA LOURENCO DO NASCIMENTO", C, "PRODELAR", "PRODELAR");
await link("RUBENON HONORATO DA SILVA FILHO", C, "PRODELAR", "PRODELAR");
await link("ANA PAULA MAIA PAIVA", C, "PRODELAR", "PRODELAR");
await link("LYSIANE SARMENTO CASTRO MONTEIRO BARROS", "ARIANA DA COSTA MACHADO", "PRODELAR", "COLMOB");
await link("LUIZ FELIPE DA SILVA RODRIGUES", "MARIA ANDRESSA LOURENCO DO NASCIMENTO", "PRODELAR", "PRODELAR");
await link("JOSE ELOI DOS SANTOS JUNIOR", "RUBENON HONORATO DA SILVA FILHO", "PRODELAR", "PRODELAR");

for (const n of [
  "ANGELO DA GAMA FREIRE",
  "JOYCE CAMILA BARBOSA DA SILVA",
  "LETICIA MARIA DE ALBUQUERQUE SOUZA",
  "LEYLANE MARTINS CERQUEIRA LIMA BULHOES",
  "BRUNA STHEFANNY DE LIMA FRANCO",
]) {
  await link(n, PATRICIA, "PRODELAR", "PRODELAR");
}

for (const n of ["MICAELLE DA SILVA PEREIRA", "ERIJA FERNANDA DOS SANTOS"]) {
  await link(n, "LYSIANE SARMENTO CASTRO MONTEIRO BARROS", "PRODELAR", "PRODELAR");
}

for (const n of [
  "ALAN DAVID SANTOS ARAUJO",
  "PEDRO HENRIQUE ANDRADE DOS SANTOS",
  "FABRICIO SILVA DE ARAUJO",
  "CARLOS ADRIANO DA SILVA",
  "CARLOS EDUARDO FERNANDES JANUARIO",
  "WEVERTON OLIVEIRA GOMES",
]) {
  await link(n, "LUIZ FELIPE DA SILVA RODRIGUES", "PRODELAR", "PRODELAR");
}

for (const n of [
  "ALAN DENIS PEREIRA SILVA",
  "EDUARDO SILVA DE ARAUJO SABINO",
  "EDVALDO ANTONIO ROSENDO JUNIOR",
  "JOAO LUCAS LINS DOS SANTOS",
  "ERIVAN FERREIRA LINS JUNIOR",
  "LUCAS MATHEUS DA SILVA SANTIAGO",
  "JUAN RICARDO CONCEICAO DOS SANTOS",
  "JOSE EDILSON PEREIRA DA SILVA",
  "PAULO SERGIO DA SILVA SANTOS",
  "PHELLIPE BRUNO TELECIO SILVA",
]) {
  await link(n, "MARIA ANDRESSA LOURENCO DO NASCIMENTO", "PRODELAR", "PRODELAR");
}

for (const n of ["MARIA EDUARDA OLIVEIRA COSTA", "THAMYRES BARBOSA TENORIO", "AMARA MARIA DA CONCEICAO"]) {
  await link(n, "ANA PAULA MAIA PAIVA", "PRODELAR", "PRODELAR");
}

// COLMOB
await link("ARIANA DA COSTA MACHADO", C, "COLMOB", "PRODELAR");
await link("JONATHAN ALEXANDRE DOS SANTOS", C, "COLMOB", "PRODELAR");
await link("DAVID SANTOS DA SILVA", "ARIANA DA COSTA MACHADO", "COLMOB", "COLMOB");
await link("PABLO RODRIGO SANTOS MACARIO", "JONATHAN ALEXANDRE DOS SANTOS", "COLMOB", "COLMOB");

for (const n of [
  "ALDEMIR MARTILIANO DA SILVA",
  "CESAR SILVA DOS SANTOS",
  "CRISTIANO CORREIA DA SILVA",
  "ELIZABETE VIEIRA DA SILVA",
  "ERONILDO PEREIRA DOS SANTOS JUNIOR",
  "FELIPE DA SILVA PINTO",
  "IRANIZE JOSEFA LINS",
  "JOSE CICERO FERREIRA DA SILVA",
  "JOSE PEDRO DOS SANTOS NETO",
  "JULIANA MARIA DA SILVA",
  "JURANDIR JANUARIO DA SILVA",
  "LUCIANO DOS SANTOS SILVA",
  "MAYLSON GUSTAVO CORREIA COSTA",
  "RAFAEL CAETANO DA SILVA",
  "RENALDO BEZERRA DOS SANTOS FILHO",
  "RUBIAN CARLOS LIMA DOS SANTOS",
  "WHALYSON BATISTA DE OLIVEIRA",
]) {
  await link(n, "JONATHAN ALEXANDRE DOS SANTOS", "COLMOB", "COLMOB");
}

// SERVIMEC
await link("JOSE JOELLINGTON GOMES DOS SANTOS", C, "SERVIMEC", "PRODELAR");
await link("VINICIUS FILIPE DE SENA FREDINI BINAS", "JOSE JOELLINGTON GOMES DOS SANTOS", "SERVIMEC", "SERVIMEC");

for (const n of ["GERLAN JOSE DA SILVA", "JOSE CLAUDIO LEITE DOS SANTOS JUNIOR", "PAULO RENATO SOUZA FERREIRA"]) {
  await link(n, "JOSE JOELLINGTON GOMES DOS SANTOS", "SERVIMEC", "SERVIMEC");
}

for (const n of [
  "ANDERSON KAUE LIMA DA SILVA",
  "CAIO VITOR LINS CORREIA",
  "CELSO ALEXANDRE DUARTE SOBRAL",
  "CRISTIANO DA SILVA",
  "DAVI MIKAEL SOARES DE ARAUJO",
  "DIEGO VICTOR PEREIRA",
  "ESEQUIEL SEBASTIAO MARCELO LINS",
  "GETULIO PEREIRA SANTOS NETO",
  "GUSTAVO UMBELINO COSTA",
  "JEFFERSON KARLOS NOGUEIRA DE OLIVEIRA",
  "JOSE CICERO MARCELO LINS",
  "JOSE MARCELO LINS",
  "JOSE RENESON ALBUQUERQUE RAMOS",
  "JULIO CESAR DE SOUSA SILVA",
  "JULIO RODRIGUES DE MIRANDA",
  "NANDERSON GOMES DA CONCEICAO",
  "NATANIEL DA SILVA",
  "OSMAR FERREIRA DA SILVA",
  "PHILIPE EMANNUEL VIRTUOSO DA SILVA",
  "RENATO LEITE DA SILVA",
  "THALLES EDUARDO ARAUJO DOS SANTOS",
  "THARCIO CARLOS DA SILVA",
  "WANTUILIMAS DA SILVA SANTOS",
]) {
  await link(n, "JOSE JOELLINGTON GOMES DOS SANTOS", "SERVIMEC", "SERVIMEC");
}

await link("FERNANDA PATRICIA ROCHA CAVALCANTE", "ANA PAULA MAIA PAIVA", "SERVIMEC", "PRODELAR");

console.log(`\n✅ Hierarquia concluída: ${ok} vínculo(s), ${failed} falha(s)`);
