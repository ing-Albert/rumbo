import type { Pool, PoolClient } from "pg";

export async function withUserTransaction<T>(
  pool: Pool,
  userId: string,
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `select
         set_config('request.jwt.claim.sub', $1, true),
         set_config('request.jwt.claims', $2, true)`,
      [userId, JSON.stringify({ sub: userId, role: "authenticated" })]
    );
    await client.query("SET LOCAL ROLE authenticated");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
