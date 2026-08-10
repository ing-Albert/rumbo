import "dotenv/config";
import { buildApp } from "./app.js";
import { SupabaseAuthVerifier } from "./auth/supabase-verifier.js";
import { createPostgresPool } from "./database/postgres/pool.js";
import { PostgresFinancePersistence } from "./database/postgres/repository.js";

const port = Number(process.env.PORT ?? 3001);
const supabaseUrl = process.env.SUPABASE_URL?.trim();
if (!supabaseUrl || !process.env.DATABASE_URL?.trim()) {
  throw new Error("La API requiere SUPABASE_URL y DATABASE_URL para iniciar de forma segura.");
}

const persistence = new PostgresFinancePersistence(createPostgresPool());
const app = buildApp(persistence, {
  authVerifier: new SupabaseAuthVerifier(supabaseUrl)
});

try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`API disponible en http://localhost:${port}`);
} catch (error) {
  app.log.error(error);
  await app.close();
  process.exit(1);
}
