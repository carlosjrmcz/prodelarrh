update public.hr_employees
set leadership_level = 'director'
where full_name in (
  'CARLOS ALBERTO PIMENTEL DE ANDRADE JUNIOR',
  'ANDERSON PRAZERES NASCIMENTO'
);

update public.hr_profiles
set role_code = 'diretor'
where employee_id in (
  select id
  from public.hr_employees
  where full_name in (
    'CARLOS ALBERTO PIMENTEL DE ANDRADE JUNIOR',
    'ANDERSON PRAZERES NASCIMENTO'
  )
);
