import { createPostgresPool } from "./pool.js";

const pool = createPostgresPool();

try {
  const result = await pool.query<{ database: string; server_time: Date }>(
    "select current_database() as database, now() as server_time"
  );
  console.log(`PostgreSQL conectado: ${result.rows[0]!.database}`);
  console.log(`Hora del servidor: ${result.rows[0]!.server_time.toISOString()}`);
} finally {
  await pool.end();
}
