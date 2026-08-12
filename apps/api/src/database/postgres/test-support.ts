import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { FinancePersistence, UserFinanceRepository } from "../../persistence.js";
import { PostgresFinancePersistence } from "./repository.js";

const PRODUCTION_HOST_PATTERN = /supabase\.co|pooler\.supabase\.com/i;

/**
 * Connects to the Postgres instance the API tests run against. Deliberately
 * reads TEST_DATABASE_URL instead of DATABASE_URL so tests can never
 * accidentally run against the production database configured for the app
 * itself (see apps/api/.env). Point this at `supabase start`'s local
 * Postgres (default: postgresql://postgres:postgres@127.0.0.1:54322/postgres).
 */
export function createTestPool(): Pool {
  const connectionString = process.env.TEST_DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "Falta TEST_DATABASE_URL. Los tests de la API corren contra un Postgres local " +
        "(`supabase start`), nunca contra la base de produccion (DATABASE_URL)."
    );
  }
  if (PRODUCTION_HOST_PATTERN.test(connectionString)) {
    throw new Error(
      "TEST_DATABASE_URL apunta a un host que parece de produccion (Supabase hosted). " +
        "Abortando por seguridad: los tests no deben correr contra produccion."
    );
  }
  return new Pool({ connectionString, max: 5 });
}

/**
 * Inserts a row directly into auth.users, which fires the
 * `auth_user_created` trigger (see supabase/migrations) and provisions the
 * same profile + personal space + default categories a real signup gets.
 */
export async function createTestUser(pool: Pool, email: string): Promise<string> {
  const id = randomUUID();
  await pool.query(
    `insert into auth.users (
       id, instance_id, aud, role, email, encrypted_password,
       email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
       created_at, updated_at
     ) values (
       $1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, '',
       now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
     )`,
    [id, email]
  );
  return id;
}

/** Deletes test users; cascades to their profile, spaces, movements, etc. */
export async function deleteTestUsers(pool: Pool, userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;
  await pool.query("delete from auth.users where id = any($1::uuid[])", [userIds]);
}

export async function personalSpaceId(pool: Pool, userId: string): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `select id from public.spaces where user_id = $1 and type = 'PERSONAL' limit 1`,
    [userId]
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error(`No se encontro el espacio personal del usuario de prueba ${userId}.`);
  }
  return row.id;
}

/**
 * Wraps PostgresFinancePersistence so `close()` is a no-op: the pool is
 * shared across a whole test file and closed once, explicitly, in afterAll.
 * buildApp() registers an onClose hook that calls persistence.close(), and
 * each test builds its own app instance sharing this pool.
 */
export function createNonClosingPersistence(pool: Pool): FinancePersistence {
  const delegate = new PostgresFinancePersistence(pool);
  return {
    forUser(userId: string): UserFinanceRepository {
      return delegate.forUser(userId);
    },
    async close(): Promise<void> {}
  };
}
