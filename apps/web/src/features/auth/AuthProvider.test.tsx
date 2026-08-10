import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/supabase", () => ({
  supabase: null,
  supabaseConfigured: false
}));

import { AuthGate, AuthProvider } from "./AuthProvider";

afterEach(cleanup);

describe("AuthGate", () => {
  it("fails closed while Supabase is not configured", () => {
    render(<AuthProvider><AuthGate><p>Aplicacion local</p></AuthGate></AuthProvider>);

    expect(screen.getByRole("heading", { name: /Falta configurar Supabase/i })).toBeInTheDocument();
    expect(screen.queryByText("Aplicacion local")).not.toBeInTheDocument();
  });
});
