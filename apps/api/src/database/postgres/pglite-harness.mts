/**
 * Levanta un Postgres de verdad sin Docker, para comprobar las migraciones.
 *
 * PGlite es Postgres compilado a WebAssembly: mismo motor, mismo dialecto,
 * mismas restricciones. No sustituye a `supabase start` —no trae Auth ni
 * Storage— pero responde la pregunta que importa aqui: si las migraciones
 * aplican y si el SQL que escribimos hace lo que creemos.
 *
 * Los objetos de Supabase que las migraciones dan por hechos (el esquema
 * `auth`, los roles, `auth.uid()`) se crean antes a mano, en la version minima
 * que necesitan.
 *
 * Uso: node apps/api/src/database/postgres/pglite-harness.mts
 */
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
// gen_random_uuid() vive en pgcrypto, y PGlite no carga las extensiones solo.
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const migrationsDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "..",
  "..",
  "supabase",
  "migrations"
);

const SUPABASE_STUBS = `
  create schema if not exists auth;
  create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb,
    created_at timestamptz default now()
  );
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
      create role authenticated;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'anon') then
      create role anon;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then
      create role service_role;
    end if;
  end $$;
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
`;

const results: Array<{ ok: boolean; label: string; detail?: string }> = [];

function check(label: string, ok: boolean, detail?: string) {
  results.push({ ok, label, detail });
}

async function expectFailure(database: PGlite, label: string, sql: string) {
  try {
    await database.exec(sql);
    check(label, false, "se acepto cuando deberia haber fallado");
  } catch {
    check(label, true);
  }
}

const database = await PGlite.create({ extensions: { pgcrypto } });
await database.exec(SUPABASE_STUBS);

// --- Migraciones -----------------------------------------------------------
const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();
for (const file of files) {
  const source = await readFile(join(migrationsDirectory, file), "utf8");
  const sql = source.replace(/^\s*begin;\s*/i, "").replace(/\s*commit;\s*$/i, "");
  try {
    await database.exec(sql);
    check(`migracion ${file}`, true);
  } catch (error) {
    check(`migracion ${file}`, false, (error as Error).message.split("\n")[0]);
  }
}

// Sin esquema no hay nada mas que comprobar, y el error de la migracion es mas
// util que la cascada de fallos que vendria detras.
if (results.some((result) => !result.ok)) {
  for (const result of results) {
    console.log(`${result.ok ? "OK  " : "FALLA"} ${result.label}${result.detail ? ` -> ${result.detail}` : ""}`);
  }
  await database.close();
  process.exit(1);
}

// --- Datos de partida ------------------------------------------------------
const user = await database.query<{ id: string }>(
  "insert into auth.users (email) values ('prueba@rumbo.test') returning id"
);
const userId = user.rows[0]!.id;
// El trigger create_user_defaults ya siembra espacios y categorias al crear el
// usuario, asi que aqui se leen en vez de insertarlos: comprobar que existen es
// parte de lo que interesa.
const space = await database.query<{ id: string }>(
  `select id from public.spaces where user_id = $1 and type = 'PERSONAL'`,
  [userId]
);
check("el trigger siembra los espacios del usuario nuevo", space.rows.length === 1);
const spaceId = space.rows[0]!.id;

const category = await database.query<{ id: string }>(
  `select id from public.categories
   where user_id = $1 and space_id = $2 and nature = 'EXPENSE' limit 1`,
  [userId, spaceId]
);
check("el trigger siembra las categorias de gasto", category.rows.length === 1);
const categoryId = category.rows[0]!.id;

// --- Recurrencias ----------------------------------------------------------
const rule = await database.query<{ id: string }>(
  `insert into public.recurring_movements (
     user_id, space_id, category_id, type, frequency, amount_cents,
     description, start_date, next_run_date
   ) values ($1, $2, $3, 'EXPENSE', 'MONTHLY', 2500000, 'Alquiler', '2026-01-31', '2026-01-31')
   returning id`,
  [userId, spaceId, categoryId]
);
const ruleId = rule.rows[0]!.id;
check("crear una regla recurrente", true);

await database.query(
  `insert into public.movements (
     user_id, space_id, category_id, type, status, source,
     amount_cents, effective_date, description, recurring_movement_id
   ) values ($1, $2, $3, 'EXPENSE', 'REGISTERED', 'RECURRENCE', 2500000, '2026-01-31', 'Alquiler', $4)`,
  [userId, spaceId, categoryId, ruleId]
);

// La red de seguridad contra duplicados: el mismo dia, la misma regla, otra vez.
const duplicate = await database.query<{ count: string }>(
  `with intento as (
     insert into public.movements (
       user_id, space_id, category_id, type, status, source,
       amount_cents, effective_date, description, recurring_movement_id
     ) values ($1, $2, $3, 'EXPENSE', 'REGISTERED', 'RECURRENCE', 2500000, '2026-01-31', 'Alquiler', $4)
     on conflict do nothing
     returning 1
   ) select count(*)::text as count from intento`,
  [userId, spaceId, categoryId, ruleId]
);
check(
  "el indice unico impide generar dos veces la misma ocurrencia",
  duplicate.rows[0]!.count === "0",
  `filas insertadas: ${duplicate.rows[0]!.count}`
);

// --- Saldo inicial ---------------------------------------------------------
await database.query("update public.spaces set opening_balance_cents = 1000000 where id = $1", [
  spaceId
]);
const balance = await database.query<{
  opening: string;
  expense: string;
}>(
  `select s.opening_balance_cents::text as opening,
          coalesce(sum(m.amount_cents) filter (where m.type = 'EXPENSE'), 0)::text as expense
   from public.spaces s
   left join public.movements m
     on m.space_id = s.id and m.user_id = s.user_id
    and m.deleted_at is null and m.status = 'REGISTERED'
   where s.id = $1 group by s.id`,
  [spaceId]
);
check(
  "el saldo agrega el inicial y lo registrado",
  balance.rows[0]!.opening === "1000000" && balance.rows[0]!.expense === "2500000",
  JSON.stringify(balance.rows[0])
);

// --- Deudas y sanes --------------------------------------------------------
await database.query(
  `insert into public.debts (user_id, space_id, kind, name, principal_cents)
   values ($1, $2, 'DEBT', 'Prestamo', 5000000)`,
  [userId, spaceId]
);
check("crear una deuda normal", true);

await database.query(
  `insert into public.debts (user_id, space_id, kind, name, installment_cents, members, turn_position)
   values ($1, $2, 'SAN', 'San del trabajo', 500000, 10, 7)`,
  [userId, spaceId]
);
check("crear un san completo", true);

await expectFailure(
  database,
  "un san sin miembros lo rechaza la base",
  `insert into public.debts (user_id, space_id, kind, name, installment_cents)
   values ('${userId}', '${spaceId}', 'SAN', 'San incompleto', 500000)`
);

await expectFailure(
  database,
  "un turno fuera de la rueda lo rechaza la base",
  `insert into public.debts (user_id, space_id, kind, name, installment_cents, members, turn_position)
   values ('${userId}', '${spaceId}', 'SAN', 'San torcido', 500000, 5, 9)`
);

await expectFailure(
  database,
  "una deuda normal sin monto la rechaza la base",
  `insert into public.debts (user_id, space_id, kind, name)
   values ('${userId}', '${spaceId}', 'DEBT', 'Deuda vacia')`
);

// --- Recibos ---------------------------------------------------------------
await database.query(
  "update public.movements set receipt_path = $2 where user_id = $1",
  [userId, `${userId}/recibo.jpg`]
);
check("guardar la ruta del recibo", true);

// --- Aislamiento entre usuarios -------------------------------------------
const other = await database.query<{ id: string }>(
  "insert into auth.users (email) values ('otro@rumbo.test') returning id"
);
await expectFailure(
  database,
  "no se puede colgar una deuda de un espacio ajeno",
  `insert into public.debts (user_id, space_id, kind, name, principal_cents)
   values ('${other.rows[0]!.id}', '${spaceId}', 'DEBT', 'Intruso', 100)`
);

await database.close();

// --- Informe ---------------------------------------------------------------
for (const result of results) {
  console.log(`${result.ok ? "OK  " : "FALLA"} ${result.label}${result.detail ? ` -> ${result.detail}` : ""}`);
}
const failed = results.filter((result) => !result.ok).length;
console.log(`\n${results.length - failed}/${results.length} comprobaciones en verde`);
process.exit(failed === 0 ? 0 : 1);
