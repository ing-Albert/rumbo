import type { ContentTypeParserDoneFunction } from "fastify/types/content-type-parser.js";
import type { IncomingMessage, ServerResponse } from "node:http";
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

// Vercel pre-parses the body, so we tell Fastify to trust it directly
// instead of trying to re-read it from the stream (which would be empty)
app.addContentTypeParser(
  ["application/json", "text/plain"],
  { parseAs: "string" },
  (_request, body: string | Buffer, done: ContentTypeParserDoneFunction) => {
    try {
      done(null, body ? JSON.parse(body.toString()) : null);
    } catch (error) {
      done(error as Error, undefined);
    }
  }
);

/**
 * Vercel entrega su propio par petición/respuesta de Node, no los de Fastify,
 * asi que se emiten al servidor interno. Se tipan como los de `node:http`, que
 * es lo que son: `any` no describia nada y ademas apagaba las comprobaciones.
 */
export default async function handler(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  await app.ready();
  app.server.emit("request", request, response);
}
