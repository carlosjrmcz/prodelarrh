import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestsDir = path.join(root, "production/contracheques/processados");
const outputFile = path.join(root, "production/contracheques/saida/paystubs-index.json");

const monthNames = {
  "01": "Janeiro",
  "02": "Fevereiro",
  "03": "Março",
  "04": "Abril",
  "05": "Maio",
  "06": "Junho",
  "07": "Julho",
  "08": "Agosto",
  "09": "Setembro",
  "10": "Outubro",
  "11": "Novembro",
  "12": "Dezembro",
};

function competenceLabel(value) {
  const match = String(value || "").match(/^(\d{2})\/(\d{4})$/);
  if (!match) return value || "Sem competência";
  return `${monthNames[match[1]] || match[1]}/${match[2]}`;
}

function typeFromSource(sourceFile) {
  const text = String(sourceFile || "").toLowerCase();
  if (text.includes("quinzena")) return "2ª quinzena";
  if (text.includes("previa") || text.includes("prévia")) return "Prévia";
  return "Mensal";
}

function fileUrl(outputPath) {
  return `./${String(outputPath || "").replaceAll("\\", "/")}`;
}

const records = [];

for (const fileName of fs.readdirSync(manifestsDir).filter((name) => name.endsWith(".manifest.json")).sort()) {
  const manifestPath = path.join(manifestsDir, fileName);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const sourceFile = manifest.sourceFile || fileName;
  const processedAt = manifest.processedAt || "";

  for (const page of manifest.pages || []) {
    if (page.status !== "matched" || !page.outputPath) continue;
    const absolutePdf = path.join(root, page.outputPath);
    if (!fs.existsSync(absolutePdf)) continue;
    records.push({
      id: `${page.employeeCode || page.employeeName}-${page.competence || ""}-${page.pageNumber}-${path.basename(page.outputPath)}`,
      employee_code: page.employeeCode || "",
      employee_name: page.employeeName || "",
      cpf: page.cpf || "",
      company_name: page.companyName || "",
      department: page.department || "",
      position: page.position || "",
      competence: page.competence || "",
      competence_label: competenceLabel(page.competence),
      type: typeFromSource(sourceFile),
      status: "Disponível",
      file_name: path.basename(page.outputPath),
      file_url: fileUrl(page.outputPath),
      source_file: sourceFile,
      page_number: page.pageNumber,
      processed_at: processedAt,
    });
  }
}

records.sort((a, b) => {
  const byName = a.employee_name.localeCompare(b.employee_name, "pt-BR");
  if (byName) return byName;
  return String(b.competence).localeCompare(String(a.competence));
});

fs.writeFileSync(
  outputFile,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      records,
    },
    null,
    2,
  ),
);

console.log(`Contracheques indexados: ${records.length}`);
console.log(outputFile);
