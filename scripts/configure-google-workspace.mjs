import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import readline from "node:readline";

const DEFAULT_SUPABASE_URL = "https://vncgdelxlevdndnyjyth.supabase.co";
const DEFAULT_PROJECT_REF = "vncgdelxlevdndnyjyth";
const FUNCTION_URL = `${DEFAULT_SUPABASE_URL}/functions/v1/upload-google-drive-file`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question, fallback = "") {
  return new Promise((resolve) => {
    const suffix = fallback ? ` [${fallback}]` : "";
    rl.question(`${question}${suffix}: `, (answer) => resolve(answer.trim() || fallback));
  });
}

function askSecret(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    stdout.write(`${question}: `);
    stdin.resume();
    stdin.setRawMode?.(true);
    let value = "";
    function onData(buffer) {
      const char = buffer.toString("utf8");
      if (char === "\u0003") process.exit(130);
      if (char === "\r" || char === "\n") {
        stdin.setRawMode?.(false);
        stdin.off("data", onData);
        stdout.write("\n");
        resolve(value.trim());
        return;
      }
      if (char === "\u007f") {
        value = value.slice(0, -1);
        return;
      }
      value += char;
    }
    stdin.on("data", onData);
  });
}

function which(command) {
  const result = spawnSync("command", ["-v", command], { shell: true, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

function envLine(key, value) {
  const escaped = String(value ?? "").replace(/\n/g, "\\n");
  return `${key}=${escaped}`;
}

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  return spawnSync(command, args, { stdio: "inherit" });
}

async function main() {
  console.log("Configuração Google Workspace - Prodelar RH");
  console.log("Os segredos ficam apenas nos arquivos locais/CLI, não no chat.\n");

  const supabaseProjectRef = await ask("Supabase project ref", DEFAULT_PROJECT_REF);
  const senderEmail = await ask("GOOGLE_WORKSPACE_SENDER_EMAIL");
  const oauthClientId = await ask("GOOGLE_WORKSPACE_CLIENT_ID");
  const oauthClientSecret = await askSecret("GOOGLE_WORKSPACE_CLIENT_SECRET");
  const refreshToken = await askSecret("GOOGLE_WORKSPACE_REFRESH_TOKEN");
  const serviceAccountPath = await ask("Caminho do JSON da service account do Drive (opcional)");
  const rootFolderId = await ask("GOOGLE_DRIVE_ROOT_FOLDER_ID (pasta do RH no Drive, opcional)");
  const sharedDriveId = await ask("GOOGLE_DRIVE_SHARED_DRIVE_ID (opcional)");
  const impersonateEmail = await ask("GOOGLE_IMPERSONATE_EMAIL (opcional)");
  const testMode = await ask("EMAIL_TEST_MODE", "true");
  const testRecipient = await ask("EMAIL_TEST_RECIPIENT", senderEmail);
  const frontendMode = await ask("Modo do upload no frontend: test ou production", "test");

  let googleClientEmail = "";
  let googlePrivateKey = "";
  let googleProjectId = "";

  if (serviceAccountPath) {
    if (!existsSync(serviceAccountPath)) {
      throw new Error(`Arquivo não encontrado: ${serviceAccountPath}`);
    }
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    googleClientEmail = serviceAccount.client_email || "";
    googlePrivateKey = serviceAccount.private_key || "";
    googleProjectId = serviceAccount.project_id || "";
  }

  const env = [
    envLine("SUPABASE_URL", DEFAULT_SUPABASE_URL),
    envLine("SUPABASE_SERVICE_ROLE_KEY", ""),
    envLine("GOOGLE_WORKSPACE_SENDER_EMAIL", senderEmail),
    envLine("GOOGLE_WORKSPACE_CLIENT_ID", oauthClientId),
    envLine("GOOGLE_WORKSPACE_CLIENT_SECRET", oauthClientSecret),
    envLine("GOOGLE_WORKSPACE_REFRESH_TOKEN", refreshToken),
    envLine("GOOGLE_PROJECT_ID", googleProjectId),
    envLine("GOOGLE_CLIENT_EMAIL", googleClientEmail),
    envLine("GOOGLE_PRIVATE_KEY", googlePrivateKey),
    envLine("GOOGLE_DRIVE_SHARED_DRIVE_ID", sharedDriveId),
    envLine("GOOGLE_DRIVE_ROOT_FOLDER_ID", rootFolderId),
    envLine("GOOGLE_WORKSPACE_DOMAIN", "grupoprodelar.com.br"),
    envLine("GOOGLE_IMPERSONATE_EMAIL", impersonateEmail),
    envLine("GOOGLE_DRIVE_SCOPE", "https://www.googleapis.com/auth/drive.file"),
    envLine("EMAIL_TEST_MODE", testMode),
    envLine("EMAIL_TEST_RECIPIENT", testRecipient),
    envLine("EMAIL_MAX_PER_BATCH", "20"),
    envLine("EMAIL_MAX_PER_HOUR", "300"),
    envLine("EMAIL_MAX_PER_DAY", "1000"),
    envLine("EMAIL_DAILY_ALERT_THRESHOLD", "1000"),
    envLine("EMAIL_PAUSE_AUTOMATIC", "false"),
    "",
  ].join("\n");

  writeFileSync(".env.google-workspace.local", env);

  const frontendConfig = `window.googleWorkspaceConfig = {
  mode: "${frontendMode}",
  edgeFunctionUrl: "${FUNCTION_URL}",
  rootFolderId: "${rootFolderId}",
  sharedDriveId: "${sharedDriveId}",
};
`;
  writeFileSync("services/googleWorkspaceConfig.js", frontendConfig);

  console.log("\nArquivos gerados:");
  console.log("- .env.google-workspace.local");
  console.log("- services/googleWorkspaceConfig.js");

  const supabaseCli = which("supabase");
  if (!supabaseCli) {
    console.log("\nSupabase CLI não encontrada. Rode manualmente quando instalar:");
    console.log(`supabase secrets set --env-file .env.google-workspace.local --project-ref ${supabaseProjectRef}`);
    console.log("supabase functions deploy process-email-events");
    console.log("supabase functions deploy upload-google-drive-file");
    rl.close();
    return;
  }

  const applySecrets = await ask("Aplicar secrets no Supabase agora? yes/no", "no");
  if (applySecrets.toLowerCase() === "yes") {
    run("supabase", ["secrets", "set", "--env-file", ".env.google-workspace.local", "--project-ref", supabaseProjectRef]);
  }

  const deployFunctions = await ask("Publicar Edge Functions agora? yes/no", "no");
  if (deployFunctions.toLowerCase() === "yes") {
    run("supabase", ["functions", "deploy", "process-email-events", "--project-ref", supabaseProjectRef]);
    run("supabase", ["functions", "deploy", "upload-google-drive-file", "--project-ref", supabaseProjectRef]);
  }

  rl.close();
}

main().catch((error) => {
  rl.close();
  console.error(error.message);
  process.exit(1);
});
