-- MIGRATION 010 — Supabase Auth -> HR Profile
-- Mantém compatibilidade com o schema atual, onde hr_profiles.id já referencia auth.users(id).
-- Adiciona auth_user_id explícito e cria perfil RH automaticamente ao criar usuário no Supabase Auth.

alter table public.hr_profiles
  add column if not exists auth_user_id uuid;

update public.hr_profiles
set auth_user_id = id
where auth_user_id is null;

do $$
begin
  alter table public.hr_profiles
    add constraint hr_profiles_auth_user_fk
    foreign key (auth_user_id) references auth.users(id) on delete cascade;
exception when duplicate_object then null;
end $$;

create unique index if not exists hr_profiles_auth_user_id_uidx
  on public.hr_profiles (auth_user_id)
  where auth_user_id is not null;

create or replace function public.create_hr_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  profile_name text;
  profile_email text;
  profile_role text;
begin
  profile_email := coalesce(new.email, new.id::text || '@auth.local');
  profile_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    split_part(profile_email, '@', 1),
    'Novo usuário'
  );
  profile_role := coalesce(nullif(new.raw_user_meta_data->>'role_code', ''), 'employee');

  insert into public.hr_profiles (
    id,
    auth_user_id,
    full_name,
    email,
    role_code,
    is_active
  )
  values (
    new.id,
    new.id,
    profile_name,
    profile_email,
    profile_role,
    true
  )
  on conflict (id) do update
  set
    auth_user_id = coalesce(public.hr_profiles.auth_user_id, excluded.auth_user_id),
    full_name = coalesce(nullif(public.hr_profiles.full_name, ''), excluded.full_name),
    email = coalesce(nullif(public.hr_profiles.email, ''), excluded.email),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_create_hr_profile_for_auth_user on auth.users;

create trigger trg_create_hr_profile_for_auth_user
after insert on auth.users
for each row
execute function public.create_hr_profile_for_auth_user();
