import { readFileSync } from "node:fs";

function readEnv(path) {
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/\\n/g, "\n")];
      }),
  );
}

const env = readEnv(".env.google-workspace.local");
const response = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: env.GOOGLE_WORKSPACE_CLIENT_ID,
    client_secret: env.GOOGLE_WORKSPACE_CLIENT_SECRET,
    refresh_token: env.GOOGLE_WORKSPACE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  }),
});

const body = await response.json();
if (!response.ok) {
  console.error(body.error_description || body.error || "Google OAuth token error");
  process.exit(1);
}

console.log("Gmail OAuth refresh token OK.");
