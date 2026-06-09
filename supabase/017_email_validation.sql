-- Prodelar RH
-- Email queue validation helpers.

alter table public.email_events
  add column if not exists validation_errors text[] not null default '{}',
  add column if not exists validated_at timestamptz;

create or replace function public.validate_email_event_payload()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_errors text[] := '{}';
begin
  if coalesce(new.recipient_email, '') !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    v_errors := array_append(v_errors, 'recipient_email_invalido');
  end if;

  if coalesce(new.template_key, '') = '' then
    v_errors := array_append(v_errors, 'template_key_obrigatorio');
  end if;

  if coalesce(new.app_name, '') = '' then
    v_errors := array_append(v_errors, 'app_name_obrigatorio');
  end if;

  new.validation_errors := v_errors;
  new.validated_at := now();

  if array_length(v_errors, 1) is not null then
    new.status := 'failed';
    new.last_error := array_to_string(v_errors, ', ');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_email_event_payload on public.email_events;
create trigger trg_validate_email_event_payload
before insert or update of recipient_email, template_key, app_name
on public.email_events
for each row execute function public.validate_email_event_payload();

