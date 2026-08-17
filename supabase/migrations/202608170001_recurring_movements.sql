begin;

-- Reglas de movimientos que se repiten (alquiler, sueldo, suscripciones).
--
-- Hasta ahora un movimiento SCHEDULED se quedaba esperando a que alguien lo
-- editara a mano el dia que tocaba. Esta tabla guarda la regla, y la API
-- materializa las ocurrencias vencidas al consultar, sin depender de un cron.
create type public.recurrence_frequency as enum ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

create table public.recurring_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null,
  category_id uuid,
  type public.movement_type not null,
  frequency public.recurrence_frequency not null,
  amount_cents bigint not null,
  description text not null,
  -- El dia de `start_date` es el ancla de la serie. Para las mensuales importa
  -- de verdad: una regla que arranca un dia 31 tiene que volver al 31 despues
  -- de pasar por un febrero, y eso solo se puede reconstruir desde el origen.
  start_date date not null,
  end_date date,
  -- Proxima fecha pendiente de generar. Avanza dentro de la misma transaccion
  -- que inserta el movimiento, asi que reintentar es inofensivo.
  next_run_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_movements_amount_positive check (amount_cents > 0),
  constraint recurring_movements_amount_safe check (amount_cents <= 9000000000000000),
  constraint recurring_movements_description_length
    check (char_length(trim(description)) between 1 and 160),
  constraint recurring_movements_period check (end_date is null or end_date >= start_date),
  -- Los aportes a metas tienen su propio flujo, con su propio saldo.
  constraint recurring_movements_type check (type in ('INCOME', 'EXPENSE')),
  unique(id, user_id, space_id),
  foreign key (space_id, user_id)
    references public.spaces(id, user_id) on delete cascade,
  foreign key (category_id, user_id, space_id)
    references public.categories(id, user_id, space_id)
);

create index recurring_movements_due_index
  on public.recurring_movements (user_id, space_id, next_run_date)
  where active;

-- Enlaza cada movimiento generado con su regla, para poder distinguirlo de uno
-- escrito a mano y para no repetirlo.
alter table public.movements
  add column recurring_movement_id uuid,
  add constraint movements_recurrence_fk
    foreign key (recurring_movement_id, user_id, space_id)
    references public.recurring_movements(id, user_id, space_id) on delete set null;

-- La red de seguridad real contra duplicados. `next_run_date` ya evita generar
-- dos veces en el curso normal, pero dos peticiones simultaneas del mismo
-- usuario pueden solaparse: aqui la segunda choca en vez de duplicar el gasto.
create unique index movements_recurrence_occurrence_index
  on public.movements (recurring_movement_id, effective_date)
  where recurring_movement_id is not null and deleted_at is null;

alter table public.recurring_movements enable row level security;

create policy recurring_movements_owner_all on public.recurring_movements
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.recurring_movements to authenticated;

commit;
