import { readFileSync, writeFileSync } from "node:fs";

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

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const env = readEnv(".env.google-workspace.local");
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente em .env.google-workspace.local");

writeFileSync(".tmp-schedule-email-worker.sql", `
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if exists (select 1 from vault.decrypted_secrets where name = 'prodelar_rh_service_role_key') then
    perform vault.update_secret(
      (select id from vault.decrypted_secrets where name = 'prodelar_rh_service_role_key' limit 1),
      ${sqlString(serviceRoleKey)},
      'prodelar_rh_service_role_key',
      'Service role key for Prodelar RH email worker cron',
      null
    );
  else
    perform vault.create_secret(
      ${sqlString(serviceRoleKey)},
      'prodelar_rh_service_role_key',
      'Service role key for Prodelar RH email worker cron',
      null
    );
  end if;
end $$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'prodelar-rh-process-email-events') then
    perform cron.unschedule('prodelar-rh-process-email-events');
  end if;
end $$;

select cron.schedule(
  'prodelar-rh-process-email-events',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://vncgdelxlevdndnyjyth.supabase.co/functions/v1/process-email-events',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'prodelar_rh_service_role_key'
        limit 1
      )
    ),
    body := jsonb_build_object('batchSize', 20)
  );
  $$
);
`);

console.log("SQL temporário de agendamento criado.");
