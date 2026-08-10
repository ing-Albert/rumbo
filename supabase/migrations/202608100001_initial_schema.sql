begin;

create extension if not exists pgcrypto;

create type public.space_type as enum ('PERSONAL', 'BUSINESS');
create type public.category_nature as enum ('INCOME', 'EXPENSE');
create type public.expense_classification as enum ('NECESSARY', 'PERSONAL', 'SAVINGS');
create type public.movement_type as enum ('INCOME', 'EXPENSE', 'CONTRIBUTION');
create type public.movement_status as enum ('REGISTERED', 'SCHEDULED', 'VOIDED');
create type public.movement_source as enum ('MANUAL', 'RECURRENCE', 'IMPORT');
create type public.goal_status as enum ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
create type public.goal_priority as enum ('HIGH', 'MEDIUM', 'LOW');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  locale text not null default 'es-DO',
  timezone text not null default 'America/Santo_Domingo',
  hide_amounts boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) <= 100)
);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.space_type not null,
  name text not null,
  currency char(3) not null default 'DOP',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint spaces_name_length check (char_length(trim(name)) between 1 and 100),
  constraint spaces_currency_dop check (currency = 'DOP'),
  unique(id, user_id)
);

create unique index spaces_active_name_unique
  on public.spaces (user_id, lower(trim(name)))
  where archived_at is null;
create index spaces_user_index on public.spaces(user_id, archived_at);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null,
  nature public.category_nature not null,
  name text not null,
  classification public.expense_classification,
  is_essential boolean not null default false,
  icon text,
  color text,
  sort_order integer not null default 0,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint categories_name_length check (char_length(trim(name)) between 1 and 80),
  constraint categories_classification_expense_only check (
    nature = 'EXPENSE' or classification is null
  ),
  constraint categories_color_format check (
    color is null or color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  unique(id, user_id, space_id),
  foreign key (space_id, user_id)
    references public.spaces(id, user_id) on delete cascade
);

create unique index categories_active_name_unique
  on public.categories (space_id, nature, lower(trim(name)))
  where archived_at is null;
create index categories_space_index on public.categories(space_id, nature, archived_at);

create table public.movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null,
  category_id uuid,
  type public.movement_type not null,
  status public.movement_status not null,
  source public.movement_source not null default 'MANUAL',
  amount_cents bigint not null,
  effective_date date not null,
  description text not null,
  notes text,
  client_operation_id uuid,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  delete_after timestamptz,
  constraint movements_amount_positive check (amount_cents > 0),
  constraint movements_amount_safe check (amount_cents <= 9000000000000000),
  constraint movements_description_length check (char_length(trim(description)) between 1 and 160),
  constraint movements_notes_length check (notes is null or char_length(notes) <= 1000),
  unique(id, user_id, space_id),
  foreign key (space_id, user_id)
    references public.spaces(id, user_id) on delete cascade,
  foreign key (category_id, user_id, space_id)
    references public.categories(id, user_id, space_id)
);

create unique index movements_client_operation_unique
  on public.movements(user_id, client_operation_id)
  where client_operation_id is not null;
create index movements_space_date_index
  on public.movements(space_id, effective_date desc)
  where deleted_at is null;
create index movements_user_updated_index
  on public.movements(user_id, updated_at);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null,
  month date not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_month_first_day check (extract(day from month) = 1),
  unique(space_id, month),
  unique(id, user_id, space_id),
  foreign key (space_id, user_id)
    references public.spaces(id, user_id) on delete cascade
);

create table public.budget_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null,
  budget_id uuid not null,
  category_id uuid not null,
  limit_cents bigint not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_limits_nonnegative check (limit_cents >= 0),
  unique(budget_id, category_id),
  foreign key (budget_id, user_id, space_id)
    references public.budgets(id, user_id, space_id) on delete cascade,
  foreign key (category_id, user_id, space_id)
    references public.categories(id, user_id, space_id)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null,
  name text not null,
  target_cents bigint not null,
  target_date date,
  priority public.goal_priority not null default 'MEDIUM',
  status public.goal_status not null default 'ACTIVE',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint goals_name_length check (char_length(trim(name)) between 1 and 120),
  constraint goals_target_positive check (target_cents > 0),
  unique(id, user_id, space_id),
  foreign key (space_id, user_id)
    references public.spaces(id, user_id) on delete cascade
);

create index goals_space_status_index on public.goals(space_id, status);

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null,
  goal_id uuid not null,
  movement_id uuid unique,
  amount_cents bigint not null,
  effective_date date not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint goal_contributions_amount_positive check (amount_cents > 0),
  foreign key (goal_id, user_id, space_id)
    references public.goals(id, user_id, space_id) on delete cascade,
  foreign key (movement_id, user_id, space_id)
    references public.movements(id, user_id, space_id)
);

create index goal_contributions_goal_index
  on public.goal_contributions(goal_id, effective_date desc)
  where deleted_at is null;

create table public.sync_operations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null,
  entity_type text not null,
  entity_id uuid not null,
  operation text not null,
  result_version integer,
  processed_at timestamptz not null default now(),
  constraint sync_operations_operation check (operation in ('CREATE', 'UPDATE', 'DELETE'))
);

create index sync_operations_user_device_index
  on public.sync_operations(user_id, device_id, processed_at desc);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index audit_events_user_date_index on public.audit_events(user_id, occurred_at desc);

create or replace function public.set_updated_version()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.version = old.version + 1;
  return new;
end;
$$;

create trigger spaces_updated_version
before update on public.spaces
for each row execute function public.set_updated_version();

create trigger categories_updated_version
before update on public.categories
for each row execute function public.set_updated_version();

create trigger movements_updated_version
before update on public.movements
for each row execute function public.set_updated_version();

create trigger budgets_updated_version
before update on public.budgets
for each row execute function public.set_updated_version();

create trigger budget_limits_updated_version
before update on public.budget_limits
for each row execute function public.set_updated_version();

create trigger goals_updated_version
before update on public.goals
for each row execute function public.set_updated_version();

create trigger goal_contributions_updated_version
before update on public.goal_contributions
for each row execute function public.set_updated_version();

create or replace function public.create_user_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  personal_space_id uuid;
begin
  insert into public.profiles(id, display_name)
  values(new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));

  insert into public.spaces(user_id, type, name)
  values(new.id, 'PERSONAL', 'Personal')
  returning id into personal_space_id;

  insert into public.categories(user_id, space_id, nature, name, classification, is_essential, sort_order)
  values
    (new.id, personal_space_id, 'INCOME', 'Sueldo', null, false, 10),
    (new.id, personal_space_id, 'INCOME', 'Trabajo independiente', null, false, 20),
    (new.id, personal_space_id, 'INCOME', 'Otros ingresos', null, false, 30),
    (new.id, personal_space_id, 'EXPENSE', 'Vivienda', 'NECESSARY', true, 10),
    (new.id, personal_space_id, 'EXPENSE', 'Alimentacion', 'NECESSARY', true, 20),
    (new.id, personal_space_id, 'EXPENSE', 'Transporte', 'NECESSARY', true, 30),
    (new.id, personal_space_id, 'EXPENSE', 'Servicios', 'NECESSARY', true, 40),
    (new.id, personal_space_id, 'EXPENSE', 'Salud', 'NECESSARY', true, 50),
    (new.id, personal_space_id, 'EXPENSE', 'Educacion', 'NECESSARY', false, 60),
    (new.id, personal_space_id, 'EXPENSE', 'Entretenimiento', 'PERSONAL', false, 70),
    (new.id, personal_space_id, 'EXPENSE', 'Otros gastos', 'PERSONAL', false, 80);

  return new;
end;
$$;

create trigger auth_user_created
after insert on auth.users
for each row execute function public.create_user_defaults();

alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.categories enable row level security;
alter table public.movements enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_limits enable row level security;
alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.sync_operations enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_owner_all on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy spaces_owner_all on public.spaces
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy categories_owner_all on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy movements_owner_all on public.movements
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy budgets_owner_all on public.budgets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy budget_limits_owner_all on public.budget_limits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy goals_owner_all on public.goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy goal_contributions_owner_all on public.goal_contributions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy sync_operations_owner_select on public.sync_operations
  for select using (user_id = auth.uid());

revoke all on public.audit_events from anon, authenticated;

commit;
