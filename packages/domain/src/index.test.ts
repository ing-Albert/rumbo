import { describe, expect, it } from "vitest";
import { calculateGoalPace, calculateSummary, dominicanDate, type Movement } from "./index.js";

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

describe("calculateGoalPace", () => {
  const goal = (overrides: Partial<Parameters<typeof calculateGoalPace>[0]> = {}) => ({
    targetCents: 100_000_00,
    savedCents: 0,
    targetDate: "2027-03-15" as string | null,
    createdAt: "2026-08-01T12:00:00.000Z",
    status: "ACTIVE" as "ACTIVE" | "PAUSED" | "COMPLETED",
    ...overrides
  });

  it("splits what is missing across the calendar months that are left", () => {
    // Del 17/08/2026 al 15/03/2027: 7 meses enteros, y marzo no cuenta porque
    // el dia 15 ya paso en agosto. Faltan 70,000 -> 10,000 por mes.
    const pace = calculateGoalPace(goal({ savedCents: 30_000_00 }), "2026-08-17");

    expect(pace.monthsLeft).toBe(7);
    expect(pace.remainingCents).toBe(70_000_00);
    expect(pace.monthlyTargetCents).toBe(10_000_00);
  });

  it("counts the target month when its day has not passed yet", () => {
    const pace = calculateGoalPace(goal({ targetDate: "2027-03-20" }), "2026-08-17");

    expect(pace.monthsLeft).toBe(8);
  });

  it("never divides by zero on the very last day", () => {
    const pace = calculateGoalPace(goal({ targetDate: "2026-08-17" }), "2026-08-17");

    expect(pace.monthsLeft).toBe(1);
    expect(pace.monthlyTargetCents).toBe(100_000_00);
  });

  it("rounds the monthly amount up, so the plan never falls short", () => {
    const pace = calculateGoalPace(
      goal({ targetCents: 10_00, savedCents: 0, targetDate: "2026-10-17" }),
      "2026-08-17"
    );

    expect(pace.monthsLeft).toBe(3);
    expect(pace.monthlyTargetCents).toBe(334);
  });

  it("flags a goal as behind when saving lags the elapsed time", () => {
    // Plazo del 01/08/2026 al 15/03/2027. A mitad de camino con un 10% ahorrado.
    const pace = calculateGoalPace(goal({ savedCents: 10_000_00 }), "2026-11-23");

    expect(pace.status).toBe("BEHIND");
    expect(pace.savedRatio).toBeLessThan(pace.expectedRatio!);
  });

  it("keeps a goal on track while it stays within the tolerance", () => {
    const pace = calculateGoalPace(goal({ savedCents: 50_000_00 }), "2026-11-23");

    expect(pace.status).toBe("ON_TRACK");
  });

  it("reports a goal past its date as overdue", () => {
    expect(calculateGoalPace(goal({ savedCents: 1_00 }), "2027-04-01").status).toBe("OVERDUE");
  });

  it("reports a goal without a date instead of inventing a pace", () => {
    const pace = calculateGoalPace(goal({ targetDate: null }), "2026-08-17");

    expect(pace.status).toBe("NO_DATE");
    expect(pace.monthlyTargetCents).toBeNull();
    expect(pace.expectedRatio).toBeNull();
  });

  it("treats a fully saved goal as completed even before its date", () => {
    const pace = calculateGoalPace(goal({ savedCents: 100_000_00 }), "2026-08-17");

    expect(pace.status).toBe("COMPLETED");
    expect(pace.remainingCents).toBe(0);
  });

  it("does not report a negative remainder when the goal is oversaved", () => {
    expect(calculateGoalPace(goal({ savedCents: 150_000_00 }), "2026-08-17").remainingCents).toBe(
      0
    );
  });
});
