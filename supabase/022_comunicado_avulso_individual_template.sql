insert into public.email_templates (
  app_name,
  module_name,
  template_key,
  recipient_type,
  subject_template,
  body_template,
  body_html_template,
  delivery_channel,
  audience_scope,
  requires_review,
  is_active
)
values (
  'recursos_humanos',
  'comunicados',
  'comunicado_avulso_individual',
  'colaborador',
  '[RH] {{assunto}}',
  'Olá {{colaborador_nome}},

{{mensagem}}

Enviado por: {{remetente_nome}}

{{link}}
',
  $html$
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{assunto}}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#f4f6f8;margin:0;padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 12px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:100%;background:#ffffff;border:1px solid #dde3ea;border-radius:8px;overflow:hidden;">
            <tr><td style="height:6px;background:#e87722;font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr>
              <td style="background:#1a5c3a;color:#ffffff;padding:22px 26px;">
                <div style="font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#d9f5e5;">Recursos Humanos &middot; Grupo Prodelar</div>
                <div style="font-size:22px;font-weight:700;line-height:1.25;margin-top:6px;">{{assunto}}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:26px;">
                <div style="display:inline-block;background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700;text-transform:uppercase;">Comunicado individual</div>
                <h1 style="font-size:24px;line-height:1.3;color:#111827;margin:18px 0 10px;">Olá, {{colaborador_nome}}</h1>
                <div style="font-size:15px;line-height:1.6;margin:0 0 18px;color:#334155;">{{mensagem_html}}</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                  <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;width:35%;">Empresa</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{empresa}}</td></tr>
                  <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Departamento</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{departamento}}</td></tr>
                  <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Enviado por</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{remetente_nome}}</td></tr>
                </table>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:24px;"><tr><td bgcolor="#1a5c3a" style="border-radius:6px;"><a href="{{link}}" style="display:inline-block;padding:13px 18px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Acessar portal</a></td></tr></table>
              </td>
            </tr>
            <tr><td style="border-top:1px solid #e5e7eb;padding:16px 26px;color:#64748b;font-size:12px;line-height:1.5;background:#fbfcfd;">Esta é uma comunicação operacional automática do RH. Não envie dados sensíveis por resposta de e-mail; use o portal autenticado quando houver link.</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
$html$,
  'email',
  'individual',
  false,
  true
)
on conflict (app_name, template_key) do update
set
  app_name = excluded.app_name,
  module_name = excluded.module_name,
  recipient_type = excluded.recipient_type,
  subject_template = excluded.subject_template,
  body_template = excluded.body_template,
  body_html_template = excluded.body_html_template,
  delivery_channel = excluded.delivery_channel,
  audience_scope = excluded.audience_scope,
  requires_review = excluded.requires_review,
  is_active = excluded.is_active,
  updated_at = now();
