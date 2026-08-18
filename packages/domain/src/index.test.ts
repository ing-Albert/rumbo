import { describe, expect, it } from "vitest";
import {
  calculateBudgetAlerts,
  calculateGoalPace,
  calculateSummary,
  dominicanDate,
  calculateBalance,
  calculateDebtProgress,
  nextRecurrenceDate,
  summarizeDebts,
  type BalanceTotals,
  type Movement
} from "./index.js";

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

describe("calculateBudgetAlerts", () => {
  const limit = (category: string, limitCents: number) => ({ category, limitCents });
  const spent = (category: string, amountCents: number) => ({ category, amountCents });

  it("warns once a category reaches 80% of its limit", () => {
    const alerts = calculateBudgetAlerts(
      [limit("Alimentacion", 10_000_00)],
      [spent("Alimentacion", 8_000_00)]
    );

    expect(alerts.categories[0]!.level).toBe("NEAR");
    expect(alerts.nearCount).toBe(1);
    expect(alerts.overCount).toBe(0);
  });

  it("stays quiet just below the threshold", () => {
    const alerts = calculateBudgetAlerts(
      [limit("Alimentacion", 10_000_00)],
      [spent("Alimentacion", 7_999_00)]
    );

    expect(alerts.categories[0]!.level).toBe("OK");
    expect(alerts.nearCount).toBe(0);
  });

  it("only reports over budget once the limit is actually passed", () => {
    const exact = calculateBudgetAlerts(
      [limit("Transporte", 5_000_00)],
      [spent("Transporte", 5_000_00)]
    );
    const passed = calculateBudgetAlerts(
      [limit("Transporte", 5_000_00)],
      [spent("Transporte", 5_000_01)]
    );

    expect(exact.categories[0]!.level).toBe("NEAR");
    expect(passed.categories[0]!.level).toBe("OVER");
    expect(passed.categories[0]!.remainingCents).toBe(-1);
  });

  it("ignores categories with no limit set, instead of calling them exceeded", () => {
    const alerts = calculateBudgetAlerts(
      [limit("Ocio", 0), limit("Salud", 1_000_00)],
      [spent("Ocio", 9_000_00)]
    );

    expect(alerts.categories.map((item) => item.category)).toEqual(["Salud"]);
    expect(alerts.overCount).toBe(0);
  });

  it("treats a category with a limit and no spending as untouched", () => {
    const alerts = calculateBudgetAlerts([limit("Salud", 1_000_00)], []);

    expect(alerts.categories[0]).toMatchObject({
      spentCents: 0,
      usedRatio: 0,
      remainingCents: 1_000_00,
      level: "OK"
    });
  });

  it("puts the most consumed category first, whatever the amounts", () => {
    const alerts = calculateBudgetAlerts(
      [limit("Salud", 100_000_00), limit("Ocio", 1_000_00), limit("Transporte", 10_000_00)],
      [spent("Salud", 10_000_00), spent("Ocio", 1_500_00), spent("Transporte", 9_000_00)]
    );

    expect(alerts.categories.map((item) => item.category)).toEqual(["Ocio", "Transporte", "Salud"]);
    expect(alerts.overCount).toBe(1);
    expect(alerts.nearCount).toBe(1);
  });
});

describe("nextRecurrenceDate", () => {
  it("moves a monthly rule to the same day of the next month", () => {
    expect(nextRecurrenceDate("2026-01-15", "MONTHLY", "2026-01-15")).toBe("2026-02-15");
  });

  it("clamps to the last day when the anchor day does not exist", () => {
    expect(nextRecurrenceDate("2026-01-31", "MONTHLY", "2026-01-31")).toBe("2026-02-28");
  });

  it("returns to the anchor day after a short month, instead of staying clamped", () => {
    // Es la razon de contar desde el origen: encadenando desde el 28 la serie
    // se quedaria en el 28 para siempre.
    expect(nextRecurrenceDate("2026-01-31", "MONTHLY", "2026-02-28")).toBe("2026-03-31");
  });

  it("handles a leap February", () => {
    expect(nextRecurrenceDate("2028-01-31", "MONTHLY", "2028-01-31")).toBe("2028-02-29");
  });

  it("rolls a monthly rule over the end of the year", () => {
    expect(nextRecurrenceDate("2026-03-10", "MONTHLY", "2026-12-10")).toBe("2027-01-10");
  });

  it("adds seven days for a weekly rule, across month and year ends", () => {
    expect(nextRecurrenceDate("2026-08-25", "WEEKLY", "2026-08-25")).toBe("2026-09-01");
    expect(nextRecurrenceDate("2026-12-28", "WEEKLY", "2026-12-28")).toBe("2027-01-04");
  });

  it("adds fourteen days for a biweekly rule", () => {
    expect(nextRecurrenceDate("2026-08-25", "BIWEEKLY", "2026-08-25")).toBe("2026-09-08");
  });

  it("keeps a monthly series stable when applied repeatedly", () => {
    let date = "2026-01-31";
    const series = [date];
    for (let index = 0; index < 4; index += 1) {
      date = nextRecurrenceDate("2026-01-31", "MONTHLY", date);
      series.push(date);
    }

    expect(series).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30", "2026-05-31"]);
  });
});

describe("calculateBalance", () => {
  const totals = (overrides: Partial<BalanceTotals> = {}): BalanceTotals => ({
    openingCents: 0,
    incomeCents: 0,
    expenseCents: 0,
    contributionCents: 0,
    ...overrides
  });

  it("carries the opening balance into the total", () => {
    const balance = calculateBalance(totals({ openingCents: 50_000_00 }));

    expect(balance.totalCents).toBe(50_000_00);
    expect(balance.freeCents).toBe(50_000_00);
  });

  it("does not spend money that was only set aside for a goal", () => {
    // Un aporte mueve dinero, no lo gasta: el total no cambia, solo deja de
    // estar libre.
    const balance = calculateBalance(
      totals({ incomeCents: 30_000_00, contributionCents: 10_000_00 })
    );

    expect(balance.totalCents).toBe(30_000_00);
    expect(balance.earmarkedCents).toBe(10_000_00);
    expect(balance.freeCents).toBe(20_000_00);
  });

  it("subtracts expenses from the total, unlike contributions", () => {
    const balance = calculateBalance(totals({ incomeCents: 30_000_00, expenseCents: 12_000_00 }));

    expect(balance.totalCents).toBe(18_000_00);
    expect(balance.freeCents).toBe(18_000_00);
  });

  it("reports a negative total when spending outran the money available", () => {
    const balance = calculateBalance(totals({ incomeCents: 5_000_00, expenseCents: 8_000_00 }));

    expect(balance.totalCents).toBe(-3_000_00);
  });

  it("reports negative free money when more was set aside than is left", () => {
    const balance = calculateBalance(
      totals({ incomeCents: 10_000_00, expenseCents: 7_000_00, contributionCents: 5_000_00 })
    );

    expect(balance.totalCents).toBe(3_000_00);
    expect(balance.freeCents).toBe(-2_000_00);
  });

  it("accepts a negative opening balance, for a space that starts in the red", () => {
    const balance = calculateBalance(totals({ openingCents: -1_000_00, incomeCents: 4_000_00 }));

    expect(balance.totalCents).toBe(3_000_00);
  });
});

describe("calculateDebtProgress", () => {
  const debt = (overrides: Partial<Parameters<typeof calculateDebtProgress>[0]> = {}) => ({
    kind: "DEBT" as const,
    principalCents: 100_000_00,
    installmentCents: 0,
    members: null,
    turnPosition: null,
    paidCents: 0,
    ...overrides
  });

  it("measures a plain debt against what was borrowed", () => {
    const progress = calculateDebtProgress(debt({ paidCents: 25_000_00 }));

    expect(progress.totalCents).toBe(100_000_00);
    expect(progress.remainingCents).toBe(75_000_00);
    expect(progress.percent).toBe(25);
    expect(progress.potCents).toBeNull();
  });

  it("does not report a negative remainder when overpaid", () => {
    const progress = calculateDebtProgress(debt({ paidCents: 120_000_00 }));

    expect(progress.remainingCents).toBe(0);
    expect(progress.percent).toBe(100);
  });

  const san = (overrides = {}) =>
    debt({
      kind: "SAN" as const,
      principalCents: 0,
      installmentCents: 5_000_00,
      members: 10,
      turnPosition: 7,
      ...overrides
    });

  it("derives the pot of a san from the instalment and the members", () => {
    const progress = calculateDebtProgress(san());

    expect(progress.potCents).toBe(50_000_00);
    expect(progress.roundsTotal).toBe(10);
  });

  it("counts the rounds already paid", () => {
    const progress = calculateDebtProgress(san({ paidCents: 15_000_00 }));

    expect(progress.roundsPaid).toBe(3);
    expect(progress.turnReached).toBe(false);
  });

  it("shows money lent to the group while the turn has not arrived", () => {
    const progress = calculateDebtProgress(san({ paidCents: 30_000_00 }));

    expect(progress.turnReached).toBe(false);
    expect(progress.netCents).toBe(30_000_00);
  });

  it("flips the sign once the turn is collected", () => {
    // Ronda 7 de 10: se cobraron 50,000 tras haber puesto 35,000.
    const progress = calculateDebtProgress(san({ paidCents: 35_000_00 }));

    expect(progress.roundsPaid).toBe(7);
    expect(progress.turnReached).toBe(true);
    expect(progress.netCents).toBe(-15_000_00);
  });

  it("comes back to zero when the wheel finishes", () => {
    const progress = calculateDebtProgress(san({ paidCents: 50_000_00 }));

    expect(progress.netCents).toBe(0);
    expect(progress.remainingCents).toBe(0);
    expect(progress.percent).toBe(100);
  });

  it("treats collecting first as owing the group from round one", () => {
    const progress = calculateDebtProgress(san({ turnPosition: 1, paidCents: 5_000_00 }));

    expect(progress.turnReached).toBe(true);
    expect(progress.netCents).toBe(-45_000_00);
  });
});

describe("summarizeDebts", () => {
  const debt = (overrides: Partial<Parameters<typeof summarizeDebts>[0][number]> = {}) => ({
    kind: "DEBT" as const,
    status: "ACTIVE" as const,
    principalCents: 10_000_00,
    installmentCents: 0,
    members: null,
    turnPosition: null,
    paidCents: 0,
    ...overrides
  });

  it("separates what is owed from what is owed to you", () => {
    const overview = summarizeDebts([
      debt({ kind: "DEBT", principalCents: 45_000_00, paidCents: 32_000_00 }),
      debt({ kind: "LOAN", principalCents: 15_000_00, paidCents: 5_000_00 })
    ]);

    expect(overview.owedByMeCents).toBe(13_000_00);
    expect(overview.owedToMeCents).toBe(10_000_00);
  });

  it("counts what is left to put into a san on its own line", () => {
    const overview = summarizeDebts([
      debt({
        kind: "SAN",
        principalCents: 0,
        installmentCents: 5_000_00,
        members: 10,
        turnPosition: 7,
        paidCents: 20_000_00
      })
    ]);

    expect(overview.sanPendingCents).toBe(30_000_00);
    expect(overview.owedByMeCents).toBe(0);
  });

  it("leaves settled commitments out of every total", () => {
    // Contarlos inflaria las cifras justo despues de terminar de pagar algo.
    const overview = summarizeDebts([
      debt({ status: "SETTLED", principalCents: 80_000_00, paidCents: 80_000_00 }),
      debt({ principalCents: 10_000_00, paidCents: 4_000_00 })
    ]);

    expect(overview.owedByMeCents).toBe(6_000_00);
    expect(overview.settledCount).toBe(1);
    expect(overview.activeCount).toBe(1);
  });

  it("reports zeros for an empty list instead of failing", () => {
    expect(summarizeDebts([])).toEqual({
      owedByMeCents: 0,
      owedToMeCents: 0,
      sanPendingCents: 0,
      activeCount: 0,
      settledCount: 0
    });
  });
});
