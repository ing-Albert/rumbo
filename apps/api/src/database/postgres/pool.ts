import "dotenv/config";
import { Pool } from "pg";

export function createPostgresPool(): Pool {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("Falta DATABASE_URL en apps/api/.env");
  }
  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000
  });
}
