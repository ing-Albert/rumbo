import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import type {
  BudgetLimit,
  BudgetLimitInput,
  CreateGoal,
  CreateExpenseCategory,
  CreateMovement,
  ExpenseCategory,
  Goal,
  GoalContribution,
  GoalContributionInput,
  Movement
} from "@ahorra/domain";
import type { Space, UserFinanceRepository } from "./persistence.js";

export const PERSONAL_SPACE_ID = "00000000-0000-4000-8000-000000000001";
export const BUSINESS_SPACE_ID = "00000000-0000-4000-8000-000000000002";

type MovementRow = {
  id: string;
  space_id: string;
  type: Movement["type"];
  status: Movement["status"];
  amount_cents: number;
  effective_date: string;
  description: string;
  category: string;
  created_at: string;
};

type GoalRow = {
  id: string;
  space_id: string;
  name: string;
  target_cents: number;
  saved_cents: number;
  target_date: string | null;
  priority: Goal["priority"];
  status: Goal["status"];
  created_at: string;
};

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const defaultPath = join(currentDirectory, "..", "data", "ahorra.db");

function mapMovement(row: MovementRow): Movement {
  return {
    id: row.id,
    spaceId: row.space_id,
    type: row.type,
    status: row.status,
    amountCents: row.amount_cents,
    effectiveDate: row.effective_date,
    description: row.description,
    category: row.category,
    createdAt: row.created_at
  };
}

function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    spaceId: row.space_id,
    name: row.name,
    targetCents: row.target_cents,
    savedCents: row.saved_cents,
    targetDate: row.target_date,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at
  };
}

export class AppDatabase implements UserFinanceRepository {
  private readonly database: DatabaseSync;

  constructor(path = defaultPath) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.database = new DatabaseSync(path);
    this.database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    this.migrate();
    this.seed();
  }

  close(): void {
    this.database.close();
  }

  listSpaces(): Space[] {
    return this.database
      .prepare("SELECT id, name, type FROM spaces ORDER BY created_at")
      .all() as unknown as Space[];
  }

  spaceExists(id: string): boolean {
    return Boolean(this.database.prepare("SELECT 1 FROM spaces WHERE id = ?").get(id));
  }

  listMovements(spaceId: string, month?: string): Movement[] {
    const rows = month
      ? this.database
          .prepare(
            `SELECT * FROM movements
             WHERE space_id = ? AND substr(effective_date, 1, 7) = ?
             ORDER BY effective_date DESC, created_at DESC`
          )
          .all(spaceId, month)
      : this.database
          .prepare(
            `SELECT * FROM movements
             WHERE space_id = ?
             ORDER BY effective_date DESC, created_at DESC`
          )
          .all(spaceId);

    return (rows as unknown as MovementRow[]).map(mapMovement);
  }

  createMovement(input: CreateMovement): Movement {
    const movement: Movement = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };

    this.database
      .prepare(
        `INSERT INTO movements (
          id, space_id, type, status, amount_cents, effective_date,
          description, category, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        movement.id,
        movement.spaceId,
        movement.type,
        movement.status,
        movement.amountCents,
        movement.effectiveDate,
        movement.description,
        movement.category,
        movement.createdAt
      );

    return movement;
  }

  updateMovement(id: string, input: CreateMovement): Movement | undefined {
    const result = this.database
      .prepare(
        `UPDATE movements SET
          space_id = ?, type = ?, status = ?, amount_cents = ?,
          effective_date = ?, description = ?, category = ?
         WHERE id = ?`
      )
      .run(
        input.spaceId,
        input.type,
        input.status,
        input.amountCents,
        input.effectiveDate,
        input.description,
        input.category,
        id
      );

    if (result.changes === 0) return undefined;
    const row = this.database.prepare("SELECT * FROM movements WHERE id = ?").get(id);
    return mapMovement(row as unknown as MovementRow);
  }

  listBudgetLimits(spaceId: string, month: string): BudgetLimit[] {
    return this.database
      .prepare(
        `SELECT id, space_id AS spaceId, month, category, limit_cents AS limitCents
         FROM budget_limits WHERE space_id = ? AND month = ? ORDER BY category`
      )
      .all(spaceId, month) as unknown as BudgetLimit[];
  }

  upsertBudgetLimit(input: BudgetLimitInput): BudgetLimit {
    const existing = this.database
      .prepare("SELECT id FROM budget_limits WHERE space_id = ? AND month = ? AND category = ?")
      .get(input.spaceId, input.month, input.category) as { id: string } | undefined;
    const id = existing?.id ?? randomUUID();

    this.database
      .prepare(
        `INSERT INTO budget_limits (id, space_id, month, category, limit_cents)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(space_id, month, category)
         DO UPDATE SET limit_cents = excluded.limit_cents`
      )
      .run(id, input.spaceId, input.month, input.category, input.limitCents);

    return { id, ...input };
  }

  listGoals(spaceId: string): Goal[] {
    const rows = this.database
      .prepare(
        `SELECT g.*, COALESCE(SUM(c.amount_cents), 0) AS saved_cents
         FROM goals g
         LEFT JOIN goal_contributions c ON c.goal_id = g.id
         WHERE g.space_id = ?
         GROUP BY g.id
         ORDER BY CASE g.status WHEN 'ACTIVE' THEN 0 WHEN 'PAUSED' THEN 1 ELSE 2 END,
                  g.created_at DESC`
      )
      .all(spaceId) as unknown as GoalRow[];
    return rows.map(mapGoal);
  }

  createGoal(input: CreateGoal): Goal {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    this.database.exec("BEGIN");
    try {
      this.database
        .prepare(
          `INSERT INTO goals (
            id, space_id, name, target_cents, target_date, priority, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`
        )
        .run(id, input.spaceId, input.name, input.targetCents, input.targetDate, input.priority, createdAt);
      if (input.initialAmountCents > 0) {
        this.database
          .prepare(
            `INSERT INTO goal_contributions (id, goal_id, amount_cents, effective_date, created_at)
             VALUES (?, ?, ?, ?, ?)`
          )
          .run(randomUUID(), id, input.initialAmountCents, createdAt.slice(0, 10), createdAt);
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return this.listGoals(input.spaceId).find((goal) => goal.id === id)!;
  }

  addGoalContribution(goalId: string, input: GoalContributionInput): Goal | undefined {
    const goal = this.database.prepare("SELECT * FROM goals WHERE id = ?").get(goalId) as
      | Omit<GoalRow, "saved_cents">
      | undefined;
    if (!goal) return undefined;

    const createdAt = new Date().toISOString();
    this.database.exec("BEGIN");
    try {
      const movement = this.createMovement({
        spaceId: goal.space_id,
        type: "CONTRIBUTION",
        status: "REGISTERED",
        amountCents: input.amountCents,
        effectiveDate: input.effectiveDate,
        description: `Aporte a ${goal.name}`,
        category: "Ahorro"
      });
      this.database
        .prepare(
          `INSERT INTO goal_contributions (
            id, goal_id, movement_id, amount_cents, effective_date, created_at
           ) VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(randomUUID(), goalId, movement.id, input.amountCents, input.effectiveDate, createdAt);
      const total = this.database
        .prepare("SELECT SUM(amount_cents) AS total FROM goal_contributions WHERE goal_id = ?")
        .get(goalId) as { total: number };
      if (total.total >= goal.target_cents) {
        this.database.prepare("UPDATE goals SET status = 'COMPLETED' WHERE id = ?").run(goalId);
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return this.listGoals(goal.space_id).find((item) => item.id === goalId);
  }

  listGoalContributions(goalId: string): GoalContribution[] {
    return this.database
      .prepare(
        `SELECT id, goal_id AS goalId, movement_id AS movementId,
                amount_cents AS amountCents, effective_date AS effectiveDate,
                created_at AS createdAt
         FROM goal_contributions WHERE goal_id = ?
         ORDER BY effective_date DESC, created_at DESC`
      )
      .all(goalId) as unknown as GoalContribution[];
  }

  updateGoalContribution(
    goalId: string,
    contributionId: string,
    input: GoalContributionInput
  ): GoalContribution | undefined {
    const contribution = this.database
      .prepare("SELECT * FROM goal_contributions WHERE id = ? AND goal_id = ?")
      .get(contributionId, goalId) as
      | { movement_id: string | null }
      | undefined;
    if (!contribution) return undefined;

    this.database.exec("BEGIN");
    try {
      this.database
        .prepare(
          `UPDATE goal_contributions SET amount_cents = ?, effective_date = ?
           WHERE id = ? AND goal_id = ?`
        )
        .run(input.amountCents, input.effectiveDate, contributionId, goalId);
      if (contribution.movement_id) {
        this.database
          .prepare(
            `UPDATE movements SET amount_cents = ?, effective_date = ?
             WHERE id = ? AND type = 'CONTRIBUTION'`
          )
          .run(input.amountCents, input.effectiveDate, contribution.movement_id);
      }
      const goal = this.database.prepare("SELECT target_cents FROM goals WHERE id = ?").get(goalId) as {
        target_cents: number;
      };
      const total = this.database
        .prepare("SELECT SUM(amount_cents) AS total FROM goal_contributions WHERE goal_id = ?")
        .get(goalId) as { total: number };
      this.database
        .prepare("UPDATE goals SET status = ? WHERE id = ?")
        .run(total.total >= goal.target_cents ? "COMPLETED" : "ACTIVE", goalId);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }

    return this.listGoalContributions(goalId).find((item) => item.id === contributionId);
  }

  listExpenseCategories(spaceId: string): ExpenseCategory[] {
    return this.database
      .prepare(
        `SELECT id, space_id AS spaceId, name, created_at AS createdAt
         FROM expense_categories WHERE space_id = ? ORDER BY name COLLATE NOCASE`
      )
      .all(spaceId) as unknown as ExpenseCategory[];
  }

  createExpenseCategory(input: CreateExpenseCategory): ExpenseCategory | undefined {
    const category: ExpenseCategory = {
      id: randomUUID(),
      spaceId: input.spaceId,
      name: input.name,
      createdAt: new Date().toISOString()
    };
    try {
      this.database
        .prepare(
          `INSERT INTO expense_categories (id, space_id, name, created_at)
           VALUES (?, ?, ?, ?)`
        )
        .run(category.id, category.spaceId, category.name, category.createdAt);
      return category;
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) return undefined;
      throw error;
    }
  }

  updateExpenseCategory(id: string, name: string): ExpenseCategory | undefined {
    try {
      const result = this.database
        .prepare(`UPDATE expense_categories SET name = ? WHERE id = ? RETURNING id, space_id AS spaceId, name, created_at AS createdAt`)
        .get(name, id) as ExpenseCategory | undefined;
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) return undefined;
      throw error;
    }
  }

  deleteExpenseCategory(id: string): boolean {
    const result = this.database.prepare(`DELETE FROM expense_categories WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  private migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS spaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('PERSONAL', 'BUSINESS')),
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS movements (
        id TEXT PRIMARY KEY,
        space_id TEXT NOT NULL REFERENCES spaces(id),
        type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'CONTRIBUTION')),
        status TEXT NOT NULL CHECK (status IN ('REGISTERED', 'SCHEDULED')),
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        effective_date TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS movements_space_date
      ON movements(space_id, effective_date DESC);

      CREATE TABLE IF NOT EXISTS budget_limits (
        id TEXT PRIMARY KEY,
        space_id TEXT NOT NULL REFERENCES spaces(id),
        month TEXT NOT NULL,
        category TEXT NOT NULL,
        limit_cents INTEGER NOT NULL CHECK (limit_cents >= 0),
        UNIQUE(space_id, month, category)
      );

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        space_id TEXT NOT NULL REFERENCES spaces(id),
        name TEXT NOT NULL,
        target_cents INTEGER NOT NULL CHECK (target_cents > 0),
        target_date TEXT,
        priority TEXT NOT NULL CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
        status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED')),
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS goal_contributions (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL REFERENCES goals(id),
        movement_id TEXT REFERENCES movements(id),
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        effective_date TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS goals_space_status ON goals(space_id, status);
      CREATE INDEX IF NOT EXISTS contributions_goal ON goal_contributions(goal_id);

      CREATE TABLE IF NOT EXISTS expense_categories (
        id TEXT PRIMARY KEY,
        space_id TEXT NOT NULL REFERENCES spaces(id),
        name TEXT NOT NULL COLLATE NOCASE,
        created_at TEXT NOT NULL,
        UNIQUE(space_id, name)
      );

      CREATE INDEX IF NOT EXISTS expense_categories_space
      ON expense_categories(space_id, name);
    `);

    const contributionColumns = this.database.prepare("PRAGMA table_info(goal_contributions)").all() as unknown as Array<{ name: string }>;
    if (!contributionColumns.some((column) => column.name === "movement_id")) {
      this.database.exec("ALTER TABLE goal_contributions ADD COLUMN movement_id TEXT");
    }
    this.database.exec(`
      UPDATE goal_contributions AS contribution
      SET movement_id = (
        SELECT movement.id
        FROM movements AS movement
        JOIN goals AS goal ON goal.id = contribution.goal_id
        WHERE movement.space_id = goal.space_id
          AND movement.type = 'CONTRIBUTION'
          AND movement.amount_cents = contribution.amount_cents
          AND movement.effective_date = contribution.effective_date
          AND movement.description = 'Aporte a ' || goal.name
        ORDER BY movement.created_at DESC
        LIMIT 1
      )
      WHERE movement_id IS NULL;
    `);
  }

  private seed(): void {
    const count = this.database.prepare("SELECT COUNT(*) AS count FROM spaces").get() as {
      count: number;
    };
    if (count.count > 0) return;

    const now = new Date().toISOString();
    this.database
      .prepare("INSERT INTO spaces (id, name, type, created_at) VALUES (?, ?, ?, ?)")
      .run(PERSONAL_SPACE_ID, "Personal", "PERSONAL", now);
    this.database
      .prepare("INSERT INTO spaces (id, name, type, created_at) VALUES (?, ?, ?, ?)")
      .run(BUSINESS_SPACE_ID, "Mi negocio", "BUSINESS", now);
  }
}
