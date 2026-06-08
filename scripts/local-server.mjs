import http from "node:http";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 5180);
const host = process.env.HOST || "127.0.0.1";

const routineCompanies = [
  { key: "Prodelar", tokens: ["PRODELAR"] },
  { key: "Colmob", tokens: ["COLMOB", "COMOB", "COMOVEL", "COMÓVEL"] },
  { key: "Servimec", tokens: ["SERVIMEC"] },
];

const routineFolders = [
  { key: "registration_cards", folder: "production/fichas-funcionais/entrada", hasFile: true },
  { key: "vacation_forecasts", folder: "production/ferias/entrada", hasFile: true },
  { key: "vacation_changes", folder: "Módulo Gestão de férias", hasFile: false },
  { key: "paystubs", folder: "production/contracheques/entrada", hasFile: true },
  { key: "monthly_point", folder: "production/ponto/entrada", hasFile: true },
  { key: "accounting_package", folder: "production/pacote-mensal", hasFile: true },
  { key: "aso", folder: "production/aso/entrada", hasFile: true },
  { key: "medical_leave", folder: "production/atestados/entrada", hasFile: true },
  { key: "training_equipment", folder: "production/treinamentos-epi/entrada", hasFile: true },
  { key: "communications", folder: "Central de e-mails / Mural RH", hasFile: false },
];

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".csv": "text/csv; charset=utf-8",
};

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function routineKey(companyKey, routineKey) {
  return `${companyKey}::${routineKey}`;
}

async function listFiles(folder) {
  const absoluteFolder = path.join(rootDir, folder);
  const entries = await fs.readdir(absoluteFolder, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && !entry.name.startsWith(".")).map((entry) => entry.name);
}

function chooseCompanyFile(files, companyKey) {
  if (!files.length) return "";
  const company = routineCompanies.find((item) => item.key === companyKey);
  const match = files.find((file) => company?.tokens.some((token) => normalize(file).includes(normalize(token))));
  return match || (files.length === 1 ? files[0] : "");
}

async function buildRoutineStatus(companyKeys) {
  const results = {};

  for (const routine of routineFolders) {
    for (const companyKey of companyKeys) {
      const key = routineKey(companyKey, routine.key);

      if (!routine.hasFile) {
        results[key] = { done: true, fileName: "Executado pelo painel", source: "system" };
        continue;
      }

      try {
        const files = await listFiles(routine.folder);
        const fileName = chooseCompanyFile(files, companyKey);
        results[key] = fileName
          ? { done: true, fileName, source: "folder", folder: routine.folder }
          : {
              done: false,
              fileName: "",
              source: "folder",
              folder: routine.folder,
              error: files.length ? "Há arquivos na pasta, mas nenhum identificado para esta empresa." : "Nenhum arquivo encontrado na pasta de entrada.",
            };
      } catch {
        results[key] = {
          done: false,
          fileName: "",
          source: "folder",
          folder: routine.folder,
          error: `Pasta não encontrada ou sem acesso: ${routine.folder}`,
        };
      }
    }
  }

  return results;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(payload));
}

async function serveStatic(req, res, url) {
  const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const absolutePath = path.normalize(path.join(rootDir, requestedPath));
  if (!absolutePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(absolutePath);
    const filePath = stat.isDirectory() ? path.join(absolutePath, "index.html") : absolutePath;
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${host}:${port}`);
  if (url.pathname === "/api/rh-routines/check") {
    const company = url.searchParams.get("company") || "Todas";
    const companyKeys = company === "Todas" ? routineCompanies.map((item) => item.key) : [company];
    const results = await buildRoutineStatus(companyKeys);
    sendJson(res, 200, { ok: true, checkedAt: new Date().toISOString(), results });
    return;
  }

  await serveStatic(req, res, url);
});

server.listen(port, host, () => {
  console.log(`Prodelar RH local server: http://${host}:${port}/`);
});
