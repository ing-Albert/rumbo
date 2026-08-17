/**
 * Base absoluta de la API.
 *
 * En la web desplegada en Vercel queda vacia: el frontend y la API viven en el
 * mismo dominio y los rewrites de `vercel.json` resuelven las rutas relativas.
 * En la app nativa (Capacitor) no hay "mismo dominio" que valga, asi que se
 * define `VITE_API_BASE_URL` con la URL de produccion y todas las rutas que
 * empiezan con "/" se reescriben contra ella.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");

export function resolveApiUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (!API_BASE_URL) return input;
  if (typeof input === "string" && input.startsWith("/")) return `${API_BASE_URL}${input}`;
  if (input instanceof Request && input.url.startsWith("/")) {
    return new Request(`${API_BASE_URL}${input.url}`, input);
  }
  return input;
}

export async function apiFetch(
  accessToken: string | null | undefined,
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  if (!accessToken) throw new Error("Necesitas iniciar sesion.");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(resolveApiUrl(input), { ...init, headers });
}
