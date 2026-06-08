-- Schedule the transactional email worker.
-- Runs every minute and asks the Edge Function to process the pending queue.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'prodelar-rh-process-email-events'
  ) then
    perform cron.unschedule('prodelar-rh-process-email-events');
  end if;
end $$;

select cron.schedule(
  'prodelar-rh-process-email-events',
  '* * * * *',
  $$
  select
    net.http_post(
      url := 'https://vncgdelxlevdndnyjyth.supabase.co/functions/v1/process-email-events',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization',
        'Bearer ' || (
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
