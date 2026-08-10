begin;

create or replace function public.create_user_defaults()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id, display_name)
  values(new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));

  insert into public.spaces(user_id, type, name)
  values
    (new.id, 'PERSONAL', 'Personal'),
    (new.id, 'BUSINESS', 'Mi negocio');

  insert into public.categories(
    user_id, space_id, nature, name, classification, is_essential, sort_order
  )
  select
    new.id,
    space.id,
    defaults.nature::public.category_nature,
    defaults.name,
    defaults.classification::public.expense_classification,
    defaults.is_essential,
    defaults.sort_order
  from public.spaces space
  cross join (values
    ('INCOME', 'Sueldo', null, false, 10),
    ('INCOME', 'Trabajo independiente', null, false, 20),
    ('INCOME', 'Ventas', null, false, 30),
    ('INCOME', 'Remesas', null, false, 40),
    ('INCOME', 'Otros ingresos', null, false, 50),
    ('EXPENSE', 'Vivienda', 'NECESSARY', true, 10),
    ('EXPENSE', 'Alimentacion', 'NECESSARY', true, 20),
    ('EXPENSE', 'Transporte', 'NECESSARY', true, 30),
    ('EXPENSE', 'Servicios', 'NECESSARY', true, 40),
    ('EXPENSE', 'Salud', 'NECESSARY', true, 50),
    ('EXPENSE', 'Educacion', 'NECESSARY', false, 60),
    ('EXPENSE', 'Entretenimiento', 'PERSONAL', false, 70),
    ('EXPENSE', 'Otros gastos', 'PERSONAL', false, 80)
  ) as defaults(nature, name, classification, is_essential, sort_order)
  where space.user_id = new.id and space.archived_at is null;

  return new;
end;
$$;

insert into public.profiles(id, display_name)
select user_account.id, coalesce(user_account.raw_user_meta_data ->> 'display_name', '')
from auth.users user_account
on conflict (id) do nothing;

insert into public.spaces(user_id, type, name)
select user_account.id, 'PERSONAL', 'Personal'
from auth.users user_account
where not exists (
  select 1 from public.spaces space
  where space.user_id = user_account.id
    and space.type = 'PERSONAL'
    and space.archived_at is null
);

insert into public.spaces(user_id, type, name)
select user_account.id, 'BUSINESS', 'Mi negocio'
from auth.users user_account
where not exists (
  select 1 from public.spaces space
  where space.user_id = user_account.id
    and space.type = 'BUSINESS'
    and space.archived_at is null
);

insert into public.categories(
  user_id, space_id, nature, name, classification, is_essential, sort_order
)
select
  space.user_id,
  space.id,
  defaults.nature::public.category_nature,
  defaults.name,
  defaults.classification::public.expense_classification,
  defaults.is_essential,
  defaults.sort_order
from public.spaces space
cross join (values
  ('INCOME', 'Sueldo', null, false, 10),
  ('INCOME', 'Trabajo independiente', null, false, 20),
  ('INCOME', 'Ventas', null, false, 30),
  ('INCOME', 'Remesas', null, false, 40),
  ('INCOME', 'Otros ingresos', null, false, 50),
  ('EXPENSE', 'Vivienda', 'NECESSARY', true, 10),
  ('EXPENSE', 'Alimentacion', 'NECESSARY', true, 20),
  ('EXPENSE', 'Transporte', 'NECESSARY', true, 30),
  ('EXPENSE', 'Servicios', 'NECESSARY', true, 40),
  ('EXPENSE', 'Salud', 'NECESSARY', true, 50),
  ('EXPENSE', 'Educacion', 'NECESSARY', false, 60),
  ('EXPENSE', 'Entretenimiento', 'PERSONAL', false, 70),
  ('EXPENSE', 'Otros gastos', 'PERSONAL', false, 80)
) as defaults(nature, name, classification, is_essential, sort_order)
where space.archived_at is null
  and not exists (
    select 1 from public.categories category
    where category.space_id = space.id
      and category.nature = defaults.nature::public.category_nature
      and lower(trim(category.name)) = lower(trim(defaults.name))
      and category.archived_at is null
  );

grant usage on schema public to authenticated;
grant usage on type
  public.space_type,
  public.category_nature,
  public.expense_classification,
  public.movement_type,
  public.movement_status,
  public.movement_source,
  public.goal_status,
  public.goal_priority
to authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.spaces,
  public.categories,
  public.movements,
  public.budgets,
  public.budget_limits,
  public.goals,
  public.goal_contributions,
  public.sync_operations
to authenticated;
revoke all on public.audit_events from anon, authenticated;

commit;
