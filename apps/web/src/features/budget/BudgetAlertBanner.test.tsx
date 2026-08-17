import "@testing-library/jest-dom/vitest";
import { calculateSummary, type BudgetLimit, type Movement } from "@ahorra/domain";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BudgetAlertBanner } from "./BudgetAlertBanner";

afterEach(cleanup);

const limit = (category: string, limitCents: number): BudgetLimit => ({
  id: `limit-${category}`,
  spaceId: "space-1",
  month: "2026-08",
  category,
  limitCents
});

const expense = (category: string, amountCents: number): Movement => ({
  id: `movement-${category}`,
  spaceId: "space-1",
  type: "EXPENSE",
  status: "REGISTERED",
  amountCents,
  effectiveDate: "2026-08-07",
  description: `Gasto de ${category}`,
  category,
  createdAt: "2026-08-07T12:00:00.000Z"
});

const summaryOf = (...movements: Movement[]) => calculateSummary(movements);

describe("BudgetAlertBanner", () => {
  it("stays out of the way while every category is within its limit", () => {
    const { container } = render(
      <BudgetAlertBanner
        limits={[limit("Alimentacion", 10_000_00)]}
        summary={summaryOf(expense("Alimentacion", 1_000_00))}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("names the category and what is left when it gets close to the limit", () => {
    render(
      <BudgetAlertBanner
        limits={[limit("Alimentacion", 10_000_00)]}
        summary={summaryOf(expense("Alimentacion", 8_500_00))}
      />
    );

    expect(screen.getByText(/Estas cerca del limite en 1 categoria/)).toBeInTheDocument();
    expect(screen.getByText("Alimentacion")).toBeInTheDocument();
    expect(screen.getByText(/quedan RD\$1,500/)).toBeInTheDocument();
  });

  it("switches to the exceeded wording and amount once the limit is passed", () => {
    render(
      <BudgetAlertBanner
        limits={[limit("Transporte", 5_000_00)]}
        summary={summaryOf(expense("Transporte", 6_200_00))}
      />
    );

    expect(screen.getByText(/Te pasaste del limite en 1 categoria/)).toBeInTheDocument();
    expect(screen.getByText(/excedida por RD\$1,200/)).toBeInTheDocument();
  });

  it("leads with exceeded categories when both kinds are present", () => {
    render(
      <BudgetAlertBanner
        limits={[limit("Alimentacion", 10_000_00), limit("Transporte", 5_000_00)]}
        summary={summaryOf(expense("Alimentacion", 8_500_00), expense("Transporte", 6_200_00))}
      />
    );

    expect(screen.getByText(/Te pasaste del limite en 1 categoria/)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Transporte");
  });

  it("summarises the rest instead of listing every category", () => {
    render(
      <BudgetAlertBanner
        limits={[
          limit("Alimentacion", 1_000_00),
          limit("Transporte", 1_000_00),
          limit("Salud", 1_000_00),
          limit("Ocio", 1_000_00)
        ]}
        summary={summaryOf(
          expense("Alimentacion", 2_000_00),
          expense("Transporte", 2_000_00),
          expense("Salud", 2_000_00),
          expense("Ocio", 2_000_00)
        )}
      />
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("y 1 mas")).toBeInTheDocument();
  });

  it("ignores categories left without a limit, however much they were spent", () => {
    const { container } = render(
      <BudgetAlertBanner
        limits={[limit("Ocio", 0)]}
        summary={summaryOf(expense("Ocio", 50_000_00))}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
