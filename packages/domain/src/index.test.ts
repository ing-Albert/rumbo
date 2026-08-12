import { describe, expect, it } from "vitest";
import { calculateSummary, dominicanDate, type Movement } from "./index.js";

const base = {
  spaceId: "personal",
  effectiveDate: "2026-08-07",
  createdAt: "2026-08-07T12:00:00.000Z"
};

function movement(
  id: string,
  type: Movement["type"],
  status: Movement["status"],
  amountCents: number,
  category = "General"
): Movement {
  return { ...base, id, type, status, amountCents, category, description: category };
}

describe("calculateSummary", () => {
  it("separates registered and projected money", () => {
    const summary = calculateSummary([
      movement("1", "INCOME", "REGISTERED", 1_500_000, "Sueldo"),
      movement("2", "EXPENSE", "REGISTERED", 300_000),
      movement("3", "CONTRIBUTION", "REGISTERED", 200_000, "Ahorro"),
      movement("4", "INCOME", "SCHEDULED", 400_000, "Extra"),
      movement("5", "EXPENSE", "SCHEDULED", 150_000)
    ]);

    expect(summary.availableBeforeSavingsCents).toBe(1_200_000);
    expect(summary.availableAfterSavingsCents).toBe(1_000_000);
    expect(summary.projectedAvailableCents).toBe(1_250_000);
  });

  it("groups registered expenses by category", () => {
    const summary = calculateSummary([
      movement("1", "EXPENSE", "REGISTERED", 100_000, "Alimentacion"),
      movement("2", "EXPENSE", "REGISTERED", 50_000, "Transporte"),
      movement("3", "EXPENSE", "REGISTERED", 25_000, "Alimentacion"),
      movement("4", "EXPENSE", "SCHEDULED", 200_000, "Vivienda")
    ]);

    expect(summary.expenseByCategory).toEqual([
      { category: "Alimentacion", amountCents: 125_000 },
      { category: "Transporte", amountCents: 50_000 }
    ]);
  });
});

describe("dominicanDate", () => {
  it("returns today's date in America/Santo_Domingo as YYYY-MM-DD", () => {
    const expected = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Santo_Domingo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());

    expect(dominicanDate()).toBe(expected);
    expect(dominicanDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
