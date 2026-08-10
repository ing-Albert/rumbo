import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createPostgresPool } from "./pool.js";
import { withUserTransaction } from "./transaction.js";

const rlsTables = [
  "audit_events",
  "budget_limits",
  "budgets",
  "categories",
  "goal_contributions",
  "goals",
  "movements",
  "profiles",
  "spaces",
  "sync_operations"
];
const ownerPolicyTables = rlsTables.filter((table) => table !== "audit_events");
const pool = createPostgresPool();

try {
  const rls = await pool.query<{ table_name: string }>(
    `select class.relname as table_name
     from pg_class class
     join pg_namespace namespace on namespace.oid = class.relnamespace
     where namespace.nspname = 'public'
       and class.relname = any($1::text[])
       and class.relrowsecurity`,
    [rlsTables]
  );
  const securedTables = new Set(rls.rows.map((row) => row.table_name));
  const missingRls = rlsTables.filter((table) => !securedTables.has(table));
  if (missingRls.length > 0) throw new Error(`Falta RLS en: ${missingRls.join(", ")}`);

  const policies = await pool.query<{ table_name: string }>(
    `select distinct tablename as table_name
     from pg_policies
     where schemaname = 'public' and tablename = any($1::text[])`,
    [ownerPolicyTables]
  );
  const tablesWithPolicies = new Set(policies.rows.map((row) => row.table_name));
  const missingPolicies = ownerPolicyTables.filter((table) => !tablesWithPolicies.has(table));
  if (missingPolicies.length > 0) {
    throw new Error(`Faltan politicas de usuario en: ${missingPolicies.join(", ")}`);
  }

  const temporaryUserId = randomUUID();
  await withUserTransaction(pool, temporaryUserId, async (client) => {
    const identity = await client.query<{
      database_role: string;
      authenticated_user_id: string | null;
      visible_spaces: number;
    }>(
      `select current_user as database_role,
              auth.uid()::text as authenticated_user_id,
              (select count(*)::int from public.spaces) as visible_spaces`
    );
    const row = identity.rows[0]!;
    if (row.database_role !== "authenticated") {
      throw new Error("La API no esta ejecutando consultas con el rol authenticated.");
    }
    if (row.authenticated_user_id !== temporaryUserId) {
      throw new Error("auth.uid() no coincide con el usuario de la solicitud.");
    }
    if (row.visible_spaces !== 0) {
      throw new Error("RLS permitio leer espacios de otro usuario.");
    }
  });

  console.log(
    `Seguridad PostgreSQL verificada: ${rlsTables.length} tablas con RLS y contexto auth.uid() aislado.`
  );
} finally {
  await pool.end();
}
