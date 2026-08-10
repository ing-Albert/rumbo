export async function apiFetch(
  accessToken: string | null | undefined,
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  if (!accessToken) throw new Error("Necesitas iniciar sesion.");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(input, { ...init, headers });
}
