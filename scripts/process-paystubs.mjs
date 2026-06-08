import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseDir = path.join(rootDir, "production", "contracheques");
const inputDir = path.join(baseDir, "entrada");
const outputDir = path.join(baseDir, "saida");
const processedDir = path.join(baseDir, "processados");
const pendingDir = path.join(baseDir, "pendencias");
const mapPath = path.join(baseDir, "mapas", "employee-destinations.csv");

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function slug(value) {
  return normalize(value)
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

async function loadEmployeeMap() {
  const content = await fs.readFile(mapPath, "utf8");
  const [headerLine, ...lines] = content.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(headerLine);
  return lines.map((line) => {
    const row = Object.fromEntries(parseCsvLine(line).map((cell, index) => [headers[index], cell]));
    return {
      employeeCode: row.employee_code,
      cpf: row.cpf,
      cpfDigits: onlyDigits(row.cpf),
      employeeName: row.employee_name,
      normalizedName: normalize(row.employee_name),
      destinationFolder: row.destination_folder,
    };
  });
}

async function extractPageText(pdfBytes, pageNumber) {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes), disableWorker: true }).promise;
  const page = await pdf.getPage(pageNumber);
  const textContent = await page.getTextContent();
  return textContent.items.map((item) => item.str).join(" ");
}

function identifyEmployee(text, employees) {
  const normalizedText = normalize(text);
  const digitsText = onlyDigits(text);

  for (const employee of employees) {
    if (employee.employeeCode && normalizedText.includes(normalize(employee.employeeCode))) {
      return { employee, method: "employee_code", confidence: "high" };
    }
  }

  for (const employee of employees) {
    if (employee.cpfDigits && digitsText.includes(employee.cpfDigits)) {
      return { employee, method: "cpf", confidence: "high" };
    }
  }

  for (const employee of employees) {
    if (employee.normalizedName && normalizedText.includes(employee.normalizedName)) {
      return { employee, method: "employee_name", confidence: "medium" };
    }
  }

  return { employee: null, method: "unmatched", confidence: "none" };
}

async function saveSinglePagePdf(sourcePdf, pageIndex, targetPath) {
  const outPdf = await PDFDocument.create();
  const [copiedPage] = await outPdf.copyPages(sourcePdf, [pageIndex]);
  outPdf.addPage(copiedPage);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, await outPdf.save());
}

async function processPdf(fileName, employees) {
  const sourcePath = path.join(inputDir, fileName);
  const bytes = await fs.readFile(sourcePath);
  const sourcePdf = await PDFDocument.load(bytes);
  const pageCount = sourcePdf.getPageCount();
  const batchStamp = new Date().toISOString().replace(/[:.]/g, "-");
  const manifest = {
    sourceFile: fileName,
    processedAt: new Date().toISOString(),
    totalPages: pageCount,
    matchedPages: 0,
    unmatchedPages: 0,
    pages: [],
  };

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const pageNumber = pageIndex + 1;
    const text = await extractPageText(bytes, pageNumber);
    const match = identifyEmployee(text, employees);

    if (match.employee) {
      const folder = path.resolve(rootDir, match.employee.destinationFolder || outputDir);
      const fileBase = `${match.employee.employeeCode || slug(match.employee.employeeName)}-${slug(match.employee.employeeName)}-${batchStamp}-p${pageNumber}.pdf`;
      const targetPath = path.join(folder, fileBase);
      await saveSinglePagePdf(sourcePdf, pageIndex, targetPath);
      manifest.matchedPages += 1;
      manifest.pages.push({
        pageNumber,
        status: "matched",
        employeeCode: match.employee.employeeCode,
        employeeName: match.employee.employeeName,
        cpf: match.employee.cpf,
        method: match.method,
        confidence: match.confidence,
        outputPath: path.relative(rootDir, targetPath),
        textSample: text.slice(0, 300),
      });
      continue;
    }

    const pendingFile = `PENDENTE-${slug(fileName)}-${batchStamp}-p${pageNumber}.pdf`;
    const pendingPath = path.join(pendingDir, pendingFile);
    await saveSinglePagePdf(sourcePdf, pageIndex, pendingPath);
    manifest.unmatchedPages += 1;
    manifest.pages.push({
      pageNumber,
      status: "unmatched",
      outputPath: path.relative(rootDir, pendingPath),
      textSample: text.slice(0, 300),
    });
  }

  const manifestPath = path.join(processedDir, `${slug(fileName)}-${batchStamp}.manifest.json`);
  await fs.mkdir(processedDir, { recursive: true });
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  await fs.rename(sourcePath, path.join(processedDir, `${batchStamp}-${fileName}`));
  return manifest;
}

async function main() {
  await Promise.all([inputDir, outputDir, processedDir, pendingDir].map((dir) => fs.mkdir(dir, { recursive: true })));
  const employees = await loadEmployeeMap();
  const files = (await fs.readdir(inputDir)).filter((file) => file.toLowerCase().endsWith(".pdf"));

  if (!files.length) {
    console.log(`Nenhum PDF encontrado em ${path.relative(rootDir, inputDir)}.`);
    return;
  }

  const results = [];
  for (const fileName of files) {
    console.log(`Processando ${fileName}...`);
    results.push(await processPdf(fileName, employees));
  }

  const summary = results.reduce(
    (acc, item) => ({
      files: acc.files + 1,
      totalPages: acc.totalPages + item.totalPages,
      matchedPages: acc.matchedPages + item.matchedPages,
      unmatchedPages: acc.unmatchedPages + item.unmatchedPages,
    }),
    { files: 0, totalPages: 0, matchedPages: 0, unmatchedPages: 0 },
  );

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
