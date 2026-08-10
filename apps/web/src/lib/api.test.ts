import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./api";

afterEach(() => vi.restoreAllMocks());

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
