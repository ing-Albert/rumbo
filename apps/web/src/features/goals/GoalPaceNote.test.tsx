import "@testing-library/jest-dom/vitest";
import type { Goal } from "@ahorra/domain";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Fecha fija: el mensaje depende de hoy, y un test que cambia de resultado
// cada dia no prueba nada.
vi.mock("../../lib/format", () => ({ today: () => "2026-11-23" }));

import { GoalPaceNote } from "./GoalPaceNote";

afterEach(cleanup);

const goal = (overrides: Partial<Goal> = {}): Goal => ({
  id: "goal-1",
  spaceId: "space-1",
  name: "Fondo de emergencia",
  targetCents: 100_000_00,
  savedCents: 0,
  targetDate: "2027-03-15",
  priority: "MEDIUM",
  status: "ACTIVE",
  createdAt: "2026-08-01T12:00:00.000Z",
  ...overrides
});

describe("GoalPaceNote", () => {
  it("tells the user how much to set aside each month to arrive on time", () => {
    render(<GoalPaceNote goal={goal({ savedCents: 50_000_00 })} />);

    expect(screen.getByText(/RD\$12,500/)).toBeInTheDocument();
    expect(screen.getByText(/durante 4 meses/)).toBeInTheDocument();
    expect(screen.getByText(/llegas a tiempo/)).toBeInTheDocument();
  });

  it("raises the monthly amount and says so when the goal fell behind", () => {
    render(<GoalPaceNote goal={goal({ savedCents: 10_000_00 })} />);

    expect(screen.getByText(/RD\$22,500/)).toBeInTheDocument();
    expect(screen.getByText(/ponerte al dia/)).toBeInTheDocument();
  });

  it("asks for a decision instead of a monthly amount once the date passed", () => {
    render(<GoalPaceNote goal={goal({ savedCents: 1_00, targetDate: "2026-10-01" })} />);

    expect(screen.getByText(/La fecha ya paso/)).toBeInTheDocument();
    expect(screen.queryByText(/al mes/)).not.toBeInTheDocument();
  });

  it("says nothing for a goal with no target date", () => {
    const { container } = render(<GoalPaceNote goal={goal({ targetDate: null })} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("says nothing for a goal already reached", () => {
    const { container } = render(<GoalPaceNote goal={goal({ savedCents: 100_000_00 })} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("uses the singular when a single month is left", () => {
    render(<GoalPaceNote goal={goal({ targetDate: "2026-11-30" })} />);

    expect(screen.getByText(/durante 1 mes\b/)).toBeInTheDocument();
  });
});
