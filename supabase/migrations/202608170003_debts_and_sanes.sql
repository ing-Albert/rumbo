begin;

-- Deudas, prestamos y sanes.
--
-- Un san (tanda rotativa) no es una deuda ni un ahorro corriente: un grupo
-- aporta una cuota fija cada periodo y por turnos cada miembro se lleva el
-- total recaudado. Antes de tu turno estas prestando; despues, devolviendo.
-- Ninguna app internacional lo modela, y en Republica Dominicana lo maneja
-- media poblacion, asi que va como ciudadano de primera y no encajado a la
-- fuerza dentro de "prestamo".
create type public.debt_kind as enum ('DEBT', 'LOAN', 'SAN');
create type public.debt_status as enum ('ACTIVE', 'SETTLED');

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null,
  kind public.debt_kind not null,
  status public.debt_status not null default 'ACTIVE',
  name text not null,
  counterparty text,

  -- DEBT y LOAN: lo que se debe o se presto en total.
  -- SAN: se deriva de cuota x numero de miembros, y queda en cero.
  principal_cents bigint not null default 0,

  -- Solo para SAN. La cuota es por periodo y el turno es la posicion en la
  -- rueda, empezando en 1.
  installment_cents bigint not null default 0,
  members integer,
  turn_position integer,

  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  settled_at timestamptz,

  constraint debts_amounts_positive check (principal_cents >= 0 and installment_cents >= 0),
  constraint debts_amounts_safe check (
    principal_cents <= 9000000000000000 and installment_cents <= 9000000000000000
  ),
  constraint debts_name_length check (char_length(trim(name)) between 1 and 120),
  constraint debts_counterparty_length
    check (counterparty is null or char_length(trim(counterparty)) between 1 and 120),
  constraint debts_notes_length check (notes is null or char_length(notes) <= 1000),
  -- Un san sin cuota, sin miembros o con un turno fuera de la rueda no se
  -- puede calcular, y una cifra inventada es peor que ninguna.
  constraint debts_san_shape check (
    kind <> 'SAN' or (
      installment_cents > 0
      and members is not null and members between 2 and 100
      and turn_position is not null and turn_position between 1 and members
    )
  ),
  constraint debts_non_san_shape check (kind = 'SAN' or principal_cents > 0),
  unique(id, user_id, space_id),
  foreign key (space_id, user_id)
    references public.spaces(id, user_id) on delete cascade
);

-- Cada pago o cobro contra una deuda. Los aportes de un san tambien viven
-- aqui: son los pagos de la rueda.
create table public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid not null,
  movement_id uuid,
  amount_cents bigint not null,
  effective_date date not null,
  created_at timestamptz not null default now(),
  constraint debt_payments_amount_positive check (amount_cents > 0),
  constraint debt_payments_amount_safe check (amount_cents <= 9000000000000000),
  foreign key (debt_id, user_id) references public.debts(id, user_id) on delete cascade
);

create index debts_space_index on public.debts (user_id, space_id, status);
create index debt_payments_debt_index on public.debt_payments (user_id, debt_id, effective_date);

alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;

create policy debts_owner_all on public.debts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy debt_payments_owner_all on public.debt_payments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.debts to authenticated;
grant select, insert, update, delete on public.debt_payments to authenticated;

commit;
