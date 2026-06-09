update public.email_templates
set body_html_template = $html$
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Boas-vindas ao Grupo Prodelar</title>
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
                <div style="font-size:22px;font-weight:700;line-height:1.25;margin-top:6px;">Orientações do primeiro dia</div>
              </td>
            </tr>
            <tr>
              <td style="padding:26px;">
                <div style="display:inline-block;background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700;text-transform:uppercase;">Bem-vindo(a)</div>
                <h1 style="font-size:24px;line-height:1.3;color:#111827;margin:18px 0 10px;">Olá, {{colaborador_nome}}</h1>
                <p style="font-size:15px;line-height:1.6;margin:0 0 18px;color:#334155;">Seu primeiro dia está previsto para <strong>{{data_inicio}}</strong>. Abaixo estão as informações iniciais para sua chegada.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                  <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;width:35%;">Empresa</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{empresa}}</td></tr>
                  <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Departamento</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{departamento}}</td></tr>
                  <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Cargo</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{cargo}}</td></tr>
                  <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Gestor</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{gestor_nome}}</td></tr>
                  <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Orientações</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{orientacoes}}</td></tr>
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
updated_at = now()
where template_key = 'primeiro_dia_colaborador';

update public.email_templates
set body_html_template = $html$
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Férias aprovadas</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#f4f6f8;margin:0;padding:24px 0;">
      <tr><td align="center" style="padding:0 12px;">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:100%;background:#ffffff;border:1px solid #dde3ea;border-radius:8px;overflow:hidden;">
          <tr><td style="height:6px;background:#e87722;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td style="background:#1a5c3a;color:#ffffff;padding:22px 26px;"><div style="font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#d9f5e5;">Recursos Humanos &middot; Grupo Prodelar</div><div style="font-size:22px;font-weight:700;line-height:1.25;margin-top:6px;">Programação de férias aprovada</div></td></tr>
          <tr><td style="padding:26px;">
            <div style="display:inline-block;background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700;text-transform:uppercase;">Aprovado</div>
            <h1 style="font-size:24px;line-height:1.3;color:#111827;margin:18px 0 10px;">Olá, {{colaborador_nome}}</h1>
            <p style="font-size:15px;line-height:1.6;margin:0 0 18px;color:#334155;">Sua programação de férias foi aprovada. Consulte o portal para acompanhar o registro e demais orientações.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;width:35%;">Período</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{data_inicio}} a {{data_fim}}</td></tr>
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Empresa</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{empresa}}</td></tr>
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Gestor</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{gestor_nome}}</td></tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:24px;"><tr><td bgcolor="#1a5c3a" style="border-radius:6px;"><a href="{{link}}" style="display:inline-block;padding:13px 18px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Ver no portal</a></td></tr></table>
          </td></tr>
          <tr><td style="border-top:1px solid #e5e7eb;padding:16px 26px;color:#64748b;font-size:12px;line-height:1.5;background:#fbfcfd;">Esta é uma comunicação operacional automática do RH. Não envie dados sensíveis por resposta de e-mail; use o portal autenticado quando houver link.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
$html$,
updated_at = now()
where template_key = 'ferias_aprovadas_colaborador';

update public.email_templates
set body_html_template = $html$
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Contracheque disponível</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#f4f6f8;margin:0;padding:24px 0;">
      <tr><td align="center" style="padding:0 12px;">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:100%;background:#ffffff;border:1px solid #dde3ea;border-radius:8px;overflow:hidden;">
          <tr><td style="height:6px;background:#e87722;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td style="background:#1a5c3a;color:#ffffff;padding:22px 26px;"><div style="font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#d9f5e5;">Recursos Humanos &middot; Grupo Prodelar</div><div style="font-size:22px;font-weight:700;line-height:1.25;margin-top:6px;">Contracheque disponível</div></td></tr>
          <tr><td style="padding:26px;">
            <div style="display:inline-block;background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700;text-transform:uppercase;">Documento disponível</div>
            <h1 style="font-size:24px;line-height:1.3;color:#111827;margin:18px 0 10px;">Olá, {{colaborador_nome}}</h1>
            <p style="font-size:15px;line-height:1.6;margin:0 0 18px;color:#334155;">Seu contracheque está disponível no portal com acesso autenticado.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;width:35%;">Competência</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{competencia}}</td></tr>
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Acesso</td><td style="padding:12px 14px;color:#111827;font-size:14px;">Portal autenticado do colaborador</td></tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:24px;"><tr><td bgcolor="#1d4ed8" style="border-radius:6px;"><a href="{{link}}" style="display:inline-block;padding:13px 18px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Ver contracheque</a></td></tr></table>
          </td></tr>
          <tr><td style="border-top:1px solid #e5e7eb;padding:16px 26px;color:#64748b;font-size:12px;line-height:1.5;background:#fbfcfd;">Esta é uma comunicação operacional automática do RH. Não envie dados sensíveis por resposta de e-mail; use o portal autenticado quando houver link.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
$html$,
updated_at = now()
where template_key = 'contracheque_disponivel';

update public.email_templates
set body_html_template = $html$
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pendência de ponto</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#f4f6f8;margin:0;padding:24px 0;">
      <tr><td align="center" style="padding:0 12px;">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:100%;background:#ffffff;border:1px solid #dde3ea;border-radius:8px;overflow:hidden;">
          <tr><td style="height:6px;background:#e87722;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td style="background:#1a5c3a;color:#ffffff;padding:22px 26px;"><div style="font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#d9f5e5;">Recursos Humanos &middot; Grupo Prodelar</div><div style="font-size:22px;font-weight:700;line-height:1.25;margin-top:6px;">Pendência de ponto</div></td></tr>
          <tr><td style="padding:26px;">
            <div style="display:inline-block;background:#fef3c7;color:#92400e;border:1px solid #fbbf24;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700;text-transform:uppercase;">Ação necessária</div>
            <h1 style="font-size:24px;line-height:1.3;color:#111827;margin:18px 0 10px;">Olá, {{colaborador_nome}}</h1>
            <p style="font-size:15px;line-height:1.6;margin:0 0 18px;color:#334155;">Existe uma pendência de ponto aguardando correção ou justificativa.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;width:35%;">Motivo</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{motivo}}</td></tr>
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Prazo</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{prazo}}</td></tr>
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Status</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{status}}</td></tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:24px;"><tr><td bgcolor="#e87722" style="border-radius:6px;"><a href="{{link}}" style="display:inline-block;padding:13px 18px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Solicitar ajuste</a></td></tr></table>
          </td></tr>
          <tr><td style="border-top:1px solid #e5e7eb;padding:16px 26px;color:#64748b;font-size:12px;line-height:1.5;background:#fbfcfd;">Esta é uma comunicação operacional automática do RH. Não envie dados sensíveis por resposta de e-mail; use o portal autenticado quando houver link.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
$html$,
updated_at = now()
where template_key = 'pendencia_ponto_colaborador';

update public.email_templates
set body_html_template = $html$
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ASO próximo do vencimento</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#f4f6f8;margin:0;padding:24px 0;">
      <tr><td align="center" style="padding:0 12px;">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:100%;background:#ffffff;border:1px solid #dde3ea;border-radius:8px;overflow:hidden;">
          <tr><td style="height:6px;background:#e87722;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td style="background:#1a5c3a;color:#ffffff;padding:22px 26px;"><div style="font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#d9f5e5;">Recursos Humanos &middot; Grupo Prodelar</div><div style="font-size:22px;font-weight:700;line-height:1.25;margin-top:6px;">ASO próximo do vencimento</div></td></tr>
          <tr><td style="padding:26px;">
            <div style="display:inline-block;background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700;text-transform:uppercase;">Atenção RH</div>
            <h1 style="font-size:24px;line-height:1.3;color:#111827;margin:18px 0 10px;">Olá, {{responsavel}}</h1>
            <p style="font-size:15px;line-height:1.6;margin:0 0 18px;color:#334155;">O ASO de <strong>{{colaborador_nome}}</strong> está próximo do vencimento. Registre o encaminhamento sem inserir informação médica no e-mail.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;width:35%;">Colaborador</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{colaborador_nome}}</td></tr>
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Empresa</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{empresa}}</td></tr>
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Área</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{departamento}}</td></tr>
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Vencimento</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{prazo}}</td></tr>
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Status</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{status}}</td></tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:24px;"><tr><td bgcolor="#b91c1c" style="border-radius:6px;"><a href="{{link}}" style="display:inline-block;padding:13px 18px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Contatar RH</a></td></tr></table>
          </td></tr>
          <tr><td style="border-top:1px solid #e5e7eb;padding:16px 26px;color:#64748b;font-size:12px;line-height:1.5;background:#fbfcfd;">Esta é uma comunicação operacional automática do RH. Não envie dados sensíveis por resposta de e-mail; use o portal autenticado quando houver link.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
$html$,
updated_at = now()
where template_key = 'aso_vencendo_rh';

update public.email_templates
set body_html_template = $html$
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Comunicado de desligamento</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#f4f6f8;margin:0;padding:24px 0;">
      <tr><td align="center" style="padding:0 12px;">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:100%;background:#ffffff;border:1px solid #dde3ea;border-radius:8px;overflow:hidden;">
          <tr><td style="height:6px;background:#e87722;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td style="background:#1a5c3a;color:#ffffff;padding:22px 26px;"><div style="font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#d9f5e5;">Recursos Humanos &middot; Grupo Prodelar</div><div style="font-size:22px;font-weight:700;line-height:1.25;margin-top:6px;">Comunicado de desligamento</div></td></tr>
          <tr><td style="padding:26px;">
            <div style="display:inline-block;background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700;text-transform:uppercase;">Comunicado interno</div>
            <h1 style="font-size:24px;line-height:1.3;color:#111827;margin:18px 0 10px;">Informativo ao grupo</h1>
            <p style="font-size:15px;line-height:1.6;margin:0 0 18px;color:#334155;">Informamos que <strong>{{colaborador_nome}}</strong> encerrou seu ciclo conosco em <strong>{{data_fim}}</strong>.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;width:35%;">Colaborador</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{colaborador_nome}}</td></tr>
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Data de encerramento</td><td style="padding:12px 14px;color:#111827;font-size:14px;">{{data_fim}}</td></tr>
              <tr><td style="padding:12px 14px;background:#f8fafc;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Orientação</td><td style="padding:12px 14px;color:#111827;font-size:14px;">Tratar a comunicação com respeito e discrição.</td></tr>
            </table>
            <p style="font-size:15px;line-height:1.6;margin:18px 0 0;color:#334155;">Agradecemos pela contribuição ao Grupo Prodelar e desejamos sucesso em seus próximos caminhos.</p>
          </td></tr>
          <tr><td style="border-top:1px solid #e5e7eb;padding:16px 26px;color:#64748b;font-size:12px;line-height:1.5;background:#fbfcfd;">Esta é uma comunicação operacional automática do RH. Não envie dados sensíveis por resposta de e-mail; use o portal autenticado quando houver link.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
$html$,
updated_at = now()
where template_key = 'desligamento_colaborador_grupo';
