-- Prodelar RH
-- Template resolver used by safe email worker tests.

create or replace function public.resolve_email_payload(
  p_template_key text,
  p_payload jsonb default '{}'::jsonb
)
returns table (
  subject text,
  body text,
  body_html text
)
language plpgsql
stable
set search_path = public
as $$
declare
  v_template record;
  v_key text;
  v_value text;
begin
  select *
  into v_template
  from public.email_templates
  where app_name = 'recursos_humanos'
    and template_key = p_template_key
    and is_active = true
  limit 1;

  if not found then
    raise exception 'Template % nao encontrado ou inativo', p_template_key;
  end if;

  subject := v_template.subject_template;
  body := v_template.body_template;
  body_html := v_template.body_html_template;

  for v_key, v_value in
    select key, value #>> '{}'
    from jsonb_each(coalesce(p_payload, '{}'::jsonb))
  loop
    subject := replace(subject, '{{' || v_key || '}}', coalesce(v_value, ''));
    body := replace(body, '{{' || v_key || '}}', coalesce(v_value, ''));
    body_html := replace(coalesce(body_html, ''), '{{' || v_key || '}}', coalesce(v_value, ''));
  end loop;

  return next;
end;
$$;

