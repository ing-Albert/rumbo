import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, resolveApiUrl } from "./api";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

/** Recarga el modulo para releer VITE_API_BASE_URL, que se evalua al importar. */
async function importApiWithBase(baseUrl: string) {
  vi.stubEnv("VITE_API_BASE_URL", baseUrl);
  vi.resetModules();
  return import("./api");
}

describe("apiFetch", () => {
  it("adds the current bearer token and preserves existing headers", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));

    await apiFetch("session-token", "/api/spaces", {
      headers: { "Content-Type": "application/json" }
    });

    const [, init] = fetchMock.mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer session-token");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("does not make financial requests without a session", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(apiFetch(null, "/api/spaces")).rejects.toThrow("Necesitas iniciar sesion");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("resolveApiUrl", () => {
  it("keeps paths relative on the web build, where the API shares the domain", () => {
    expect(resolveApiUrl("/api/spaces")).toBe("/api/spaces");
  });

  it("rewrites relative paths against the production API in the native build", async () => {
    const api = await importApiWithBase("https://rumbo-web-sepia.vercel.app");

    expect(api.resolveApiUrl("/api/spaces")).toBe("https://rumbo-web-sepia.vercel.app/api/spaces");
  });

  it("does not double the slash when the base ends with one", async () => {
    const api = await importApiWithBase("https://rumbo-web-sepia.vercel.app/");

    expect(api.resolveApiUrl("/api/spaces")).toBe("https://rumbo-web-sepia.vercel.app/api/spaces");
  });

  it("leaves absolute URLs untouched", async () => {
    const api = await importApiWithBase("https://rumbo-web-sepia.vercel.app");

    expect(api.resolveApiUrl("https://otro.example/api/spaces")).toBe(
      "https://otro.example/api/spaces"
    );
  });
});
