import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { transform } from "esbuild";

const root = process.cwd();
const dist = path.join(root, "dist");

function hashContent(content) {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 10);
}

function hashedTarget(target, content) {
  const extension = path.extname(target);
  const basename = target.slice(0, -extension.length);
  return `${basename}-${hashContent(content)}${extension}`;
}

async function writeFile(target, content) {
  const outputPath = path.join(dist, target);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content);
}

async function copyFile(source, target) {
  const content = await fs.readFile(path.join(root, source));
  await writeFile(target, content);
}

async function copyHashedFile(source, target) {
  const content = await fs.readFile(path.join(root, source));
  const hashed = hashedTarget(target, content);
  await writeFile(hashed, content);
  return hashed;
}

async function copyDir(source, target) {
  await fs.mkdir(path.join(dist, target), { recursive: true });
  await fs.cp(path.join(root, source), path.join(dist, target), { recursive: true });
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyHashedAssets() {
  const assetsDir = path.join(root, "assets");
  const entries = await fs.readdir(assetsDir, { withFileTypes: true });
  const assetMap = new Map();

  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith(".")) continue;
    const source = `assets/${entry.name}`;
    const target = await copyHashedFile(source, source);
    assetMap.set(`./${source}`, `./${target}`);
  }

  return assetMap;
}

function rewriteAssetUrls(source, assetMap) {
  let result = source;
  for (const [from, to] of assetMap.entries()) {
    result = result.split(from).join(to);
  }
  return result;
}

async function minifyScript(source, target, assetMap = new Map()) {
  const code = rewriteAssetUrls(await fs.readFile(path.join(root, source), "utf8"), assetMap);
  const minified = await transform(code, {
    minify: true,
    legalComments: "none",
    target: "es2020",
  });
  const hashed = hashedTarget(target, minified.code);
  await writeFile(hashed, minified.code);
  return hashed;
}

async function createWorkspaceConfig() {
  const configPath = path.join(root, "services/googleWorkspaceConfig.js");
  const examplePath = path.join(root, "services/googleWorkspaceConfig.example.js");

  if (await pathExists(configPath)) {
    await copyFile("services/googleWorkspaceConfig.js", "services/googleWorkspaceConfig.js");
    return;
  }

  const fallback = await fs.readFile(examplePath, "utf8");
  await writeFile("services/googleWorkspaceConfig.js", fallback);
}

async function writeStaticHostFiles() {
  await writeFile(
    "_headers",
    `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: SAMEORIGIN
  Cache-Control: no-cache

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/vendor/*
  Cache-Control: public, max-age=31536000, immutable

/app-*.js
  Cache-Control: public, max-age=31536000, immutable

/services/*-*.js
  Cache-Control: public, max-age=31536000, immutable

/services/googleWorkspaceConfig.js
  Cache-Control: no-store
`,
  );

  await writeFile("_redirects", "/* /index.html 200\n");
}

const assetMap = await copyHashedAssets();
const appScript = await minifyScript("app.js", "app.js", assetMap);
const emailQueueScript = await minifyScript("services/emailQueue.js", "services/emailQueue.js");
const workspaceStorageScript = await minifyScript("services/googleWorkspaceStorage.js", "services/googleWorkspaceStorage.js");
const supabaseVendor = await minifyScript("node_modules/@supabase/supabase-js/dist/umd/supabase.js", "vendor/supabase.js");
await createWorkspaceConfig();
await writeStaticHostFiles();

const indexPath = path.join(dist, "index.html");
let html = await fs.readFile(indexPath, "utf8");
html = html.replace("./node_modules/@supabase/supabase-js/dist/umd/supabase.js", `./${supabaseVendor}`);
html = html.replace(/\.\/services\/googleWorkspaceStorage\.js(?:\?[^"]*)?/, `./${workspaceStorageScript}`);
html = html.replace(/\.\/services\/emailQueue\.js(?:\?[^"]*)?/, `./${emailQueueScript}`);
html = html.replace(/\.\/app\.js(?:\?[^"]*)?/, `./${appScript}`);
html = html.replace(/href="\/assets\//g, 'href="./assets/');
await fs.writeFile(indexPath, html);

console.log("dist preparado com app estático minificado, assets versionados e Supabase UMD.");
