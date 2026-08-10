import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { AppDatabase, PERSONAL_SPACE_ID } from "./database.js";
import type { AuthVerifier } from "./auth/supabase-verifier.js";
import type { FinancePersistence, UserFinanceRepository } from "./persistence.js";

const apps: ReturnType<typeof buildApp>[] = [];
const authenticated = { authorization: "Bearer valid-token" };
const secondUser = { authorization: "Bearer second-token" };

const authVerifier: AuthVerifier = {
  async verify(token) {
    if (token === "valid-token") return { id: "user-1", email: "usuario@example.com" };
    if (token === "second-token") return { id: "user-2", email: "otro@example.com" };
    throw new Error("invalid");
  }
};

class TestPersistence implements FinancePersistence {
  private readonly users = new Map<string, AppDatabase>();

  forUser(userId: string): UserFinanceRepository {
    let database = this.users.get(userId);
    if (!database) {
      database = new AppDatabase(":memory:");
      this.users.set(userId, database);
    }
    return database;
  }

  close(): void {
    for (const database of this.users.values()) database.close();
    this.users.clear();
  }
}

function createTestApp() {
  const app = buildApp(new TestPersistence(), { authVerifier });
  apps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("movements API", () => {
  it("protects the authenticated API while keeping health public", async () => {
    const app = createTestApp();

    const anonymous = await app.inject({ method: "GET", url: "/api/v1/me" });
    expect(anonymous.statusCode).toBe(401);
    const anonymousFinances = await app.inject({ method: "GET", url: "/api/spaces" });
    expect(anonymousFinances.statusCode).toBe(401);
    const invalidSession = await app.inject({
      method: "GET",
      url: "/api/spaces",
      headers: { authorization: "Bearer invalid-token" }
    });
    expect(invalidSession.statusCode).toBe(401);
    expect((await app.inject({ method: "GET", url: "/health" })).statusCode).toBe(200);

    const authenticatedUser = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { authorization: "Bearer valid-token" }
    });
    expect(authenticatedUser.statusCode).toBe(200);
    expect(authenticatedUser.json()).toEqual({ id: "user-1", email: "usuario@example.com" });
  });

  it("creates a movement and updates the summary", async () => {
    const app = createTestApp();

    const created = await app.inject({
      method: "POST",
      url: "/api/movements",
      headers: authenticated,
      payload: {
        spaceId: PERSONAL_SPACE_ID,
        type: "INCOME",
        status: "REGISTERED",
        amountCents: 5_000_000,
        effectiveDate: "2026-08-07",
        description: "Sueldo",
        category: "Sueldo"
      }
    });

    expect(created.statusCode).toBe(201);

    const summary = await app.inject({
      method: "GET",
      url: `/api/summary?spaceId=${PERSONAL_SPACE_ID}&month=2026-08`,
      headers: authenticated
    });

    expect(summary.statusCode).toBe(200);
    expect(summary.json().availableAfterSavingsCents).toBe(5_000_000);
  });

  it("rejects invalid amounts", async () => {
    const app = createTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/movements",
      headers: authenticated,
      payload: {
        spaceId: PERSONAL_SPACE_ID,
        type: "EXPENSE",
        status: "REGISTERED",
        amountCents: 0,
        effectiveDate: "2026-08-07",
        description: "Invalido",
        category: "Otros"
      }
    });

    expect(response.statusCode).toBe(400);
  });

  it("edits a movement and recalculates the summary", async () => {
    const app = createTestApp();

    const created = await app.inject({
      method: "POST",
      url: "/api/movements",
      headers: authenticated,
      payload: {
        spaceId: PERSONAL_SPACE_ID,
        type: "EXPENSE",
        status: "REGISTERED",
        amountCents: 300_000,
        effectiveDate: "2026-08-07",
        description: "Compra inicial",
        category: "Alimentacion"
      }
    });

    const movementId = created.json().id as string;
    const updated = await app.inject({
      method: "PUT",
      url: `/api/movements/${movementId}`,
      headers: authenticated,
      payload: {
        spaceId: PERSONAL_SPACE_ID,
        type: "EXPENSE",
        status: "REGISTERED",
        amountCents: 200_000,
        effectiveDate: "2026-08-07",
        description: "Compra corregida",
        category: "Alimentacion"
      }
    });

    expect(updated.statusCode).toBe(200);
    expect(updated.json().amountCents).toBe(200_000);

    const summary = await app.inject({
      method: "GET",
      url: `/api/summary?spaceId=${PERSONAL_SPACE_ID}&month=2026-08`,
      headers: authenticated
    });
    expect(summary.json().expenseCents).toBe(200_000);
    expect(summary.json().availableAfterSavingsCents).toBe(-200_000);
  });

  it("saves and retrieves budget limits", async () => {
    const app = createTestApp();

    const saved = await app.inject({
      method: "PUT",
      url: "/api/budget",
      headers: authenticated,
      payload: { spaceId: PERSONAL_SPACE_ID, month: "2026-08", category: "Alimentacion", limitCents: 500_000 }
    });
    expect(saved.statusCode).toBe(200);

    const budget = await app.inject({
      method: "GET",
      url: `/api/budget?spaceId=${PERSONAL_SPACE_ID}&month=2026-08`,
      headers: authenticated
    });
    expect(budget.json()).toMatchObject([
      { spaceId: PERSONAL_SPACE_ID, month: "2026-08", category: "Alimentacion", limitCents: 500_000 }
    ]);
  });

  it("creates and edits a goal aporte in the financial summary", async () => {
    const app = createTestApp();

    const created = await app.inject({
      method: "POST",
      url: "/api/goals",
      headers: authenticated,
      payload: {
        spaceId: PERSONAL_SPACE_ID,
        name: "Fondo de emergencia",
        targetCents: 2_000_000,
        initialAmountCents: 100_000,
        targetDate: "2027-08-07",
        priority: "HIGH"
      }
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().savedCents).toBe(100_000);

    const contributed = await app.inject({
      method: "POST",
      url: `/api/goals/${created.json().id}/contributions`,
      headers: authenticated,
      payload: { amountCents: 200_000, effectiveDate: "2026-08-07" }
    });
    expect(contributed.statusCode).toBe(201);
    expect(contributed.json().savedCents).toBe(300_000);

    const summary = await app.inject({
      method: "GET",
      url: `/api/summary?spaceId=${PERSONAL_SPACE_ID}&month=2026-08`,
      headers: authenticated
    });
    expect(summary.json().contributionCents).toBe(200_000);
    expect(summary.json().availableAfterSavingsCents).toBe(-200_000);

    const contributions = await app.inject({
      method: "GET",
      url: `/api/goals/${created.json().id}/contributions`,
      headers: authenticated
    });
    const editable = contributions.json().find((item: { movementId: string | null }) => item.movementId);
    const edited = await app.inject({
      method: "PUT",
      url: `/api/goals/${created.json().id}/contributions/${editable.id}`,
      headers: authenticated,
      payload: { amountCents: 50_000, effectiveDate: "2026-08-08" }
    });
    expect(edited.statusCode).toBe(200);
    expect(edited.json().amountCents).toBe(50_000);

    const updatedSummary = await app.inject({
      method: "GET",
      url: `/api/summary?spaceId=${PERSONAL_SPACE_ID}&month=2026-08`,
      headers: authenticated
    });
    expect(updatedSummary.json().contributionCents).toBe(50_000);
    expect(updatedSummary.json().availableAfterSavingsCents).toBe(-50_000);

    const goals = await app.inject({
      method: "GET",
      url: `/api/goals?spaceId=${PERSONAL_SPACE_ID}`,
      headers: authenticated
    });
    expect(goals.json()[0].savedCents).toBe(150_000);
  });

  it("creates custom expense categories without duplicates", async () => {
    const app = createTestApp();

    const created = await app.inject({
      method: "POST",
      url: "/api/categories",
      headers: authenticated,
      payload: { spaceId: PERSONAL_SPACE_ID, name: "Mascotas" }
    });
    expect(created.statusCode).toBe(201);

    const categories = await app.inject({
      method: "GET",
      url: `/api/categories?spaceId=${PERSONAL_SPACE_ID}`,
      headers: authenticated
    });
    expect(categories.json()).toMatchObject([{ spaceId: PERSONAL_SPACE_ID, name: "Mascotas" }]);

    const duplicate = await app.inject({
      method: "POST",
      url: "/api/categories",
      headers: authenticated,
      payload: { spaceId: PERSONAL_SPACE_ID, name: "mascotas" }
    });
    expect(duplicate.statusCode).toBe(409);
  });

  it("isolates financial records between authenticated users", async () => {
    const app = createTestApp();
    const created = await app.inject({
      method: "POST",
      url: "/api/movements",
      headers: authenticated,
      payload: {
        spaceId: PERSONAL_SPACE_ID,
        type: "INCOME",
        status: "REGISTERED",
        amountCents: 250_000,
        effectiveDate: "2026-08-10",
        description: "Ingreso privado",
        category: "Sueldo"
      }
    });
    expect(created.statusCode).toBe(201);

    const otherSummary = await app.inject({
      method: "GET",
      url: `/api/summary?spaceId=${PERSONAL_SPACE_ID}&month=2026-08`,
      headers: secondUser
    });
    expect(otherSummary.statusCode).toBe(200);
    expect(otherSummary.json().incomeCents).toBe(0);

    const crossUserUpdate = await app.inject({
      method: "PUT",
      url: `/api/movements/${created.json().id}`,
      headers: secondUser,
      payload: {
        spaceId: PERSONAL_SPACE_ID,
        type: "INCOME",
        status: "REGISTERED",
        amountCents: 1,
        effectiveDate: "2026-08-10",
        description: "Intento ajeno",
        category: "Sueldo"
      }
    });
    expect(crossUserUpdate.statusCode).toBe(404);
  });
});
