import "@testing-library/jest-dom/vitest";
import { formatDop } from "@ahorra/domain";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../features/auth/AuthProvider", () => ({
  useAuth: () => ({
    configured: true,
    loading: false,
    session: { access_token: "test-token", user: { id: "user-1", email: "usuario@example.com" } },
    user: { id: "user-1", email: "usuario@example.com" },
    signOut: async () => undefined
  })
}));

import App from "./App";

/** Movimiento minimo, para que las pruebas digan solo lo que les importa. */
function movementFixture(
  id: string,
  type: "INCOME" | "EXPENSE" | "CONTRIBUTION",
  amountCents: number,
  category: string,
  description = category
) {
  return {
    id,
    spaceId: "personal",
    type,
    status: "REGISTERED",
    amountCents,
    effectiveDate: "2026-08-07",
    description,
    category,
    createdAt: "2026-08-07T12:00:00.000Z"
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
});

describe("App", () => {
  it("shows the empty-state action when there are no movements", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/spaces"))
        return new Response(
          JSON.stringify([{ id: "personal", name: "Personal", type: "PERSONAL" }])
        );
      if (url.includes("/api/summary"))
        return new Response(
          JSON.stringify({
            incomeCents: 0,
            expenseCents: 0,
            contributionCents: 0,
            availableBeforeSavingsCents: 0,
            availableAfterSavingsCents: 0,
            projectedAvailableCents: 0,
            expenseByCategory: []
          })
        );
      return new Response(JSON.stringify([]));
    });

    render(<App />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /todavia no podemos/i })).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "Registrar ingreso" })).toBeInTheDocument();
  });

  it("opens a movement with its current values for editing", async () => {
    const movement = {
      id: "expense-1",
      spaceId: "personal",
      type: "EXPENSE",
      status: "REGISTERED",
      amountCents: 300_000,
      effectiveDate: "2026-08-07",
      description: "Supermercado",
      category: "Alimentacion",
      createdAt: "2026-08-07T12:00:00.000Z"
    };

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/spaces"))
        return new Response(
          JSON.stringify([{ id: "personal", name: "Personal", type: "PERSONAL" }])
        );
      if (url.includes("/api/summary"))
        return new Response(
          JSON.stringify({
            incomeCents: 0,
            expenseCents: 300_000,
            contributionCents: 0,
            availableBeforeSavingsCents: -300_000,
            availableAfterSavingsCents: -300_000,
            projectedAvailableCents: -300_000,
            expenseByCategory: [{ category: "Alimentacion", amountCents: 300_000 }]
          })
        );
      if (url.includes("/api/movements")) return new Response(JSON.stringify([movement]));
      return new Response(JSON.stringify([]));
    });

    render(<App />);

    const editButton = await screen.findByRole("button", { name: "Editar Supermercado" });
    fireEvent.click(editButton);

    expect(screen.getByRole("heading", { name: "Editar gasto" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("3,000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Supermercado")).toBeInTheDocument();
  });

  it("opens modules as separate routes instead of page anchors", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/spaces"))
        return new Response(
          JSON.stringify([{ id: "personal", name: "Personal", type: "PERSONAL" }])
        );
      if (url.includes("/api/summary"))
        return new Response(
          JSON.stringify({
            incomeCents: 0,
            expenseCents: 0,
            contributionCents: 0,
            availableBeforeSavingsCents: 0,
            availableAfterSavingsCents: 0,
            projectedAvailableCents: 0,
            expenseByCategory: []
          })
        );
      return new Response(JSON.stringify([]));
    });

    render(<App />);
    fireEvent.click(screen.getAllByRole("link", { name: /Movimientos/i })[0]!);

    expect(await screen.findByRole("heading", { name: "Movimientos" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/movimientos");
    expect(screen.queryByRole("heading", { name: /Disponible estimado/i })).not.toBeInTheDocument();
  });

  it("renders the goals module from its direct URL", async () => {
    window.history.replaceState({}, "", "/metas");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/spaces"))
        return new Response(
          JSON.stringify([{ id: "personal", name: "Personal", type: "PERSONAL" }])
        );
      if (url.includes("/api/summary"))
        return new Response(
          JSON.stringify({
            incomeCents: 0,
            expenseCents: 0,
            contributionCents: 0,
            availableBeforeSavingsCents: 0,
            availableAfterSavingsCents: 0,
            projectedAvailableCents: 0,
            expenseByCategory: []
          })
        );
      return new Response(JSON.stringify([]));
    });

    render(<App />);
    expect(await screen.findByRole("heading", { name: "Metas de ahorro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nueva meta/i })).toBeInTheDocument();
  });

  it("shows income minus expenses as available instead of budget remaining", async () => {
    window.history.replaceState({}, "", "/presupuesto");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/spaces"))
        return new Response(
          JSON.stringify([{ id: "personal", name: "Personal", type: "PERSONAL" }])
        );
      if (url.includes("/api/summary"))
        return new Response(
          JSON.stringify({
            incomeCents: 1_324_000,
            expenseCents: 1_240_000,
            contributionCents: 0,
            availableBeforeSavingsCents: 84_000,
            availableAfterSavingsCents: 84_000,
            projectedAvailableCents: 84_000,
            expenseByCategory: [{ category: "Transporte", amountCents: 200_000 }]
          })
        );
      // El resumen se calcula en el cliente a partir de estos movimientos, para
      // que lo registrado sin conexion cuente. Tienen que cuadrar con las
      // cifras de arriba o la prueba estaria comprobando una imposibilidad.
      if (url.includes("/api/movements"))
        return new Response(
          JSON.stringify([
            movementFixture("income-1", "INCOME", 1_324_000, "Sueldo"),
            movementFixture("expense-1", "EXPENSE", 200_000, "Transporte"),
            movementFixture("expense-2", "EXPENSE", 1_040_000, "Otros gastos")
          ])
        );
      return new Response(JSON.stringify([]));
    });

    render(<App />);

    expect(await screen.findByText("Disponible")).toBeInTheDocument();
    expect(await screen.findByText(formatDop(84_000))).toBeInTheDocument();
    expect(screen.queryByText(formatDop(-1_240_000))).not.toBeInTheDocument();
    expect(
      screen.getAllByText("Define un limite para comparar este gasto.").length
    ).toBeGreaterThan(0);
  });

  it("paginates movement results in groups of fifteen", async () => {
    window.history.replaceState({}, "", "/movimientos");
    const movements = Array.from({ length: 16 }, (_, index) => ({
      id: `movement-${index + 1}`,
      spaceId: "personal",
      type: "EXPENSE",
      status: "REGISTERED",
      amountCents: 10_000,
      effectiveDate: "2026-08-07",
      description: `Movimiento ${index + 1}`,
      category: "Otros gastos",
      createdAt: "2026-08-07T12:00:00.000Z"
    }));

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/spaces"))
        return new Response(
          JSON.stringify([{ id: "personal", name: "Personal", type: "PERSONAL" }])
        );
      if (url.includes("/api/summary"))
        return new Response(
          JSON.stringify({
            incomeCents: 0,
            expenseCents: 160_000,
            contributionCents: 0,
            availableBeforeSavingsCents: -160_000,
            availableAfterSavingsCents: -160_000,
            projectedAvailableCents: -160_000,
            expenseByCategory: []
          })
        );
      if (url.includes("/api/movements")) return new Response(JSON.stringify(movements));
      return new Response(JSON.stringify([]));
    });

    render(<App />);

    // La pagina dibuja los mismos movimientos dos veces: la tabla para
    // escritorio y la lista para telefono, y el CSS oculta una segun el ancho.
    // Aqui no hay CSS, asi que las consultas se acotan a la tabla; comprobar la
    // paginacion una vez basta, porque ambas reciben la misma pagina ya
    // recortada.
    const table = await screen.findByRole("table");

    expect(within(table).getByText("Movimiento 15")).toBeInTheDocument();
    expect(within(table).queryByText("Movimiento 16")).not.toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(16);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await within(table).findByText("Movimiento 16")).toBeInTheDocument();
    expect(within(table).queryByText("Movimiento 1")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => element?.tagName === "SPAN" && element.textContent === "Pagina 2 de 2"
      )
    ).toBeInTheDocument();
  });

  it("opens the form to add a custom expense category", async () => {
    window.history.replaceState({}, "", "/presupuesto");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/spaces"))
        return new Response(
          JSON.stringify([{ id: "personal", name: "Personal", type: "PERSONAL" }])
        );
      if (url.includes("/api/summary"))
        return new Response(
          JSON.stringify({
            incomeCents: 0,
            expenseCents: 0,
            contributionCents: 0,
            availableBeforeSavingsCents: 0,
            availableAfterSavingsCents: 0,
            projectedAvailableCents: 0,
            expenseByCategory: []
          })
        );
      return new Response(JSON.stringify([]));
    });

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Nueva categoria" }));
    expect(screen.getByLabelText("Nombre de la categoria")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar categoria" })).toBeInTheDocument();
  });

  it("explains a negative available amount after savings", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/spaces"))
        return new Response(
          JSON.stringify([{ id: "personal", name: "Personal", type: "PERSONAL" }])
        );
      if (url.includes("/api/summary"))
        return new Response(
          JSON.stringify({
            incomeCents: 1_324_000,
            expenseCents: 1_270_000,
            contributionCents: 100_000,
            availableBeforeSavingsCents: 54_000,
            availableAfterSavingsCents: -46_000,
            projectedAvailableCents: -46_000,
            expenseByCategory: []
          })
        );
      if (url.includes("/api/movements"))
        return new Response(
          JSON.stringify([
            movementFixture("income-1", "INCOME", 1_324_000, "Sueldo"),
            movementFixture("expense-1", "EXPENSE", 1_270_000, "Otros gastos"),
            movementFixture("1", "CONTRIBUTION", 100_000, "Ahorro", "Aporte")
          ])
        );
      return new Response(JSON.stringify([]));
    });

    render(<App />);

    expect(
      await screen.findByText(`Tu plan supera el dinero disponible por ${formatDop(46_000)}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "SPAN" &&
          element.textContent === `Antes de ahorro: ${formatDop(54_000)}`
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "SPAN" &&
          element.textContent === `Ahorro separado: ${formatDop(100_000)}`
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ajustar metas" })).toBeInTheDocument();
  });

  it("opens an existing goal aporte for editing", async () => {
    window.history.replaceState({}, "", "/metas");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/goals/goal-1/contributions"))
        return new Response(
          JSON.stringify([
            {
              id: "contribution-1",
              goalId: "goal-1",
              movementId: "movement-1",
              amountCents: 100_000,
              effectiveDate: "2026-08-07",
              createdAt: "2026-08-07T12:00:00.000Z"
            }
          ])
        );
      if (url.includes("/api/goals"))
        return new Response(
          JSON.stringify([
            {
              id: "goal-1",
              spaceId: "personal",
              name: "PC Gamer",
              targetCents: 10_000_000,
              savedCents: 100_000,
              targetDate: "2027-08-07",
              priority: "MEDIUM",
              status: "ACTIVE",
              createdAt: "2026-08-07T12:00:00.000Z"
            }
          ])
        );
      if (url.includes("/api/spaces"))
        return new Response(
          JSON.stringify([{ id: "personal", name: "Personal", type: "PERSONAL" }])
        );
      if (url.includes("/api/summary"))
        return new Response(
          JSON.stringify({
            incomeCents: 0,
            expenseCents: 0,
            contributionCents: 100_000,
            availableBeforeSavingsCents: 0,
            availableAfterSavingsCents: -100_000,
            projectedAvailableCents: -100_000,
            expenseByCategory: []
          })
        );
      return new Response(JSON.stringify([]));
    });

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver y editar aportes" }));
    fireEvent.click(await screen.findByRole("button", { name: "Editar" }));

    expect(screen.getByLabelText("Monto del aporte")).toHaveValue("1,000");
    expect(screen.getByLabelText("Fecha del aporte")).toHaveValue("2026-08-07");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();
  });
});
