alter table public.hr_profiles
  add column if not exists login_username text;

create unique index if not exists hr_profiles_login_username_key
  on public.hr_profiles (login_username)
  where login_username is not null;

comment on column public.hr_profiles.login_username is
  'Usuário curto definitivo para login no portal RH, gerado a partir do primeiro nome ou primeiro+segundo nome quando houver duplicidade.';
