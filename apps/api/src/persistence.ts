import type {
  BudgetLimit,
  BudgetLimitInput,
  CreateExpenseCategory,
  CreateGoal,
  CreateMovement,
  ExpenseCategory,
  Goal,
  GoalContribution,
  GoalContributionInput,
  Movement
} from "@ahorra/domain";

export interface Space {
  id: string;
  name: string;
  type: "PERSONAL" | "BUSINESS";
}

type Awaitable<T> = T | Promise<T>;

export interface UserFinanceRepository {
  listSpaces(): Awaitable<Space[]>;
  spaceExists(id: string): Awaitable<boolean>;
  listMovements(spaceId: string, month?: string): Awaitable<Movement[]>;
  createMovement(input: CreateMovement): Awaitable<Movement | undefined>;
  updateMovement(id: string, input: CreateMovement): Awaitable<Movement | undefined>;
  listBudgetLimits(spaceId: string, month: string): Awaitable<BudgetLimit[]>;
  upsertBudgetLimit(input: BudgetLimitInput): Awaitable<BudgetLimit | undefined>;
  listGoals(spaceId: string): Awaitable<Goal[]>;
  createGoal(input: CreateGoal): Awaitable<Goal | undefined>;
  addGoalContribution(goalId: string, input: GoalContributionInput): Awaitable<Goal | undefined>;
  listGoalContributions(goalId: string): Awaitable<GoalContribution[]>;
  updateGoalContribution(
    goalId: string,
    contributionId: string,
    input: GoalContributionInput
  ): Awaitable<GoalContribution | undefined>;
  listExpenseCategories(spaceId: string): Awaitable<ExpenseCategory[]>;
  createExpenseCategory(input: CreateExpenseCategory): Awaitable<ExpenseCategory | undefined>;
  updateExpenseCategory(id: string, name: string): Awaitable<ExpenseCategory | undefined>;
  deleteExpenseCategory(id: string): Awaitable<boolean>;
}

export interface FinancePersistence {
  forUser(userId: string): UserFinanceRepository;
  close(): Awaitable<void>;
}
