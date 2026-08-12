import { z } from "zod";

export const movementTypes = ["INCOME", "EXPENSE", "CONTRIBUTION"] as const;
export const movementStatuses = ["REGISTERED", "SCHEDULED"] as const;
export const entityIdSchema = z.uuid();
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const amountCentsSchema = z.number().int().nonnegative().max(9_000_000_000_000_000);

export const createMovementSchema = z.object({
  spaceId: entityIdSchema,
  type: z.enum(movementTypes),
  status: z.enum(movementStatuses),
  amountCents: amountCentsSchema.positive(),
  effectiveDate: z.iso.date(),
  description: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(80)
});

export const budgetLimitSchema = z.object({
  spaceId: entityIdSchema,
  month: monthSchema,
  category: z.string().trim().min(1).max(80),
  limitCents: amountCentsSchema
});

export const createGoalSchema = z.object({
  spaceId: entityIdSchema,
  name: z.string().trim().min(1).max(120),
  targetCents: amountCentsSchema.positive(),
  initialAmountCents: amountCentsSchema.default(0),
  targetDate: z.iso.date().nullable(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM")
});

export const goalContributionSchema = z.object({
  amountCents: amountCentsSchema.positive(),
  effectiveDate: z.iso.date()
});

export const createExpenseCategorySchema = z.object({
  spaceId: entityIdSchema,
  name: z.string().trim().min(2).max(80)
});

export const updateExpenseCategorySchema = z.object({
  name: z.string().trim().min(2).max(80)
});

export type MovementType = (typeof movementTypes)[number];
export type MovementStatus = (typeof movementStatuses)[number];
export type CreateMovement = z.infer<typeof createMovementSchema>;
export type BudgetLimitInput = z.infer<typeof budgetLimitSchema>;
export type CreateGoal = z.infer<typeof createGoalSchema>;
export type GoalContributionInput = z.infer<typeof goalContributionSchema>;
export type CreateExpenseCategory = z.infer<typeof createExpenseCategorySchema>;
export type UpdateExpenseCategory = z.infer<typeof updateExpenseCategorySchema>;

export interface Movement extends CreateMovement {
  id: string;
  createdAt: string;
}

export interface BudgetLimit extends BudgetLimitInput {
  id: string;
}

export interface Goal {
  id: string;
  spaceId: string;
  name: string;
  targetCents: number;
  savedCents: number;
  targetDate: string | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  createdAt: string;
}

export interface ExpenseCategory extends CreateExpenseCategory {
  id: string;
  createdAt: string;
}

export interface GoalContribution extends GoalContributionInput {
  id: string;
  goalId: string;
  movementId: string | null;
  createdAt: string;
}

export interface Summary {
  incomeCents: number;
  expenseCents: number;
  contributionCents: number;
  availableBeforeSavingsCents: number;
  availableAfterSavingsCents: number;
  projectedAvailableCents: number;
  expenseByCategory: Array<{ category: string; amountCents: number }>;
}

export function calculateSummary(movements: Movement[]): Summary {
  let incomeCents = 0;
  let expenseCents = 0;
  let contributionCents = 0;
  let scheduledIncomeCents = 0;
  let scheduledExpenseCents = 0;
  let scheduledContributionCents = 0;
  const categories = new Map<string, number>();

  for (const movement of movements) {
    const registered = movement.status === "REGISTERED";

    if (movement.type === "INCOME") {
      if (registered) incomeCents += movement.amountCents;
      else scheduledIncomeCents += movement.amountCents;
    }

    if (movement.type === "EXPENSE") {
      if (registered) {
        expenseCents += movement.amountCents;
        categories.set(
          movement.category,
          (categories.get(movement.category) ?? 0) + movement.amountCents
        );
      } else {
        scheduledExpenseCents += movement.amountCents;
      }
    }

    if (movement.type === "CONTRIBUTION") {
      if (registered) contributionCents += movement.amountCents;
      else scheduledContributionCents += movement.amountCents;
    }
  }

  const availableBeforeSavingsCents = incomeCents - expenseCents;
  const availableAfterSavingsCents = availableBeforeSavingsCents - contributionCents;

  return {
    incomeCents,
    expenseCents,
    contributionCents,
    availableBeforeSavingsCents,
    availableAfterSavingsCents,
    projectedAvailableCents:
      availableAfterSavingsCents +
      scheduledIncomeCents -
      scheduledExpenseCents -
      scheduledContributionCents,
    expenseByCategory: [...categories.entries()]
      .map(([category, amountCents]) => ({ category, amountCents }))
      .sort((left, right) => right.amountCents - left.amountCents)
  };
}

export function dominicanDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santo_Domingo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export function formatDop(amountCents: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amountCents / 100);
}
