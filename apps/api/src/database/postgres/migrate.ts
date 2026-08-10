import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPostgresPool } from "./pool.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = join(currentDirectory, "..", "..", "..", "..", "..", "supabase", "migrations");
const pool = createPostgresPool();

try {
  await pool.query(`
    create table if not exists public.schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const appliedResult = await pool.query<{ name: string }>("select name from public.schema_migrations");
  const applied = new Set(appliedResult.rows.map((row) => row.name));
  const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const source = await readFile(join(migrationsDirectory, file), "utf8");
    const sql = source
      .replace(/^\s*begin;\s*/i, "")
      .replace(/\s*commit;\s*$/i, "");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into public.schema_migrations(name) values ($1)", [file]);
      await client.query("commit");
      console.log(`Migracion aplicada: ${file}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  console.log("Migraciones PostgreSQL al dia.");
} finally {
  await pool.end();
}
