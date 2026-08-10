import { buildApp } from "../apps/api/src/app.js";
import { SupabaseAuthVerifier } from "../apps/api/src/auth/supabase-verifier.js";
import { createPostgresPool } from "../apps/api/src/database/postgres/pool.js";
import { PostgresFinancePersistence } from "../apps/api/src/database/postgres/repository.js";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
if (!supabaseUrl || !process.env.DATABASE_URL?.trim()) {
  console.warn("ADVERTENCIA: Faltan variables de entorno SUPABASE_URL o DATABASE_URL.");
}

const persistence = new PostgresFinancePersistence(createPostgresPool());
const app = buildApp(persistence, {
  authVerifier: supabaseUrl ? new SupabaseAuthVerifier(supabaseUrl) : undefined
});

export default async function handler(req: any, res: any) {
  await app.ready();
  app.server.emit('request', req, res);
}
