import {
  calculateBalance,
  dominicanDate,
  nextRecurrenceDate,
  type Balance,
  type BudgetLimit,
  type BudgetLimitInput,
  type CreateExpenseCategory,
  type CreateGoal,
  type CreateMovement,
  type CreateRecurringMovement,
  type ExpenseCategory,
  type Goal,
  type GoalContribution,
  type GoalContributionInput,
  type Movement,
  type RecurrenceFrequency,
  type RecurringMovement,
  type UpdateRecurringMovement
} from "@ahorra/domain";
import type { Pool, PoolClient } from "pg";
import type { FinancePersistence, Space, UserFinanceRepository } from "../../persistence.js";
import { withUserTransaction } from "./transaction.js";

type DatabaseNumber = number | string;
type DatabaseDate = Date | string;

interface MovementRow {
  id: string;
  space_id: string;
  type: Movement["type"];
  status: Movement["status"];
  amount_cents: DatabaseNumber;
  effective_date: DatabaseDate;
  description: string;
  category: string;
  created_at: DatabaseDate;
  recurring_movement_id?: string | null;
}

interface RecurringMovementRow {
  id: string;
  space_id: string;
  type: RecurringMovement["type"];
  frequency: RecurrenceFrequency;
  amount_cents: DatabaseNumber;
  description: string;
  category: string;
  start_date: DatabaseDate;
  end_date: DatabaseDate | null;
  next_run_date: DatabaseDate;
  active: boolean;
  created_at: DatabaseDate;
}

interface GoalRow {
  id: string;
  space_id: string;
  name: string;
  target_cents: DatabaseNumber;
  saved_cents: DatabaseNumber;
  target_date: DatabaseDate | null;
  priority: Goal["priority"];
  status: Goal["status"];
  created_at: DatabaseDate;
}

interface ContributionRow {
  id: string;
  goal_id: string;
  movement_id: string | null;
  amount_cents: DatabaseNumber;
  effective_date: DatabaseDate;
  created_at: DatabaseDate;
}

/**
 * Techo de ocurrencias por peticion. Una regla semanal olvidada durante anos
 * pediria miles de inserciones de golpe; lo que sobre se genera en la siguiente
 * lectura, sin dejar una peticion colgada.
 */
const MAX_OCCURRENCES_PER_RUN = 240;

const RECURRING_SELECT = `select r.id, r.space_id, r.type, r.frequency, r.amount_cents,
                                 r.description, r.start_date, r.end_date, r.next_run_date,
                                 r.active, r.created_at,
                                 coalesce(c.name, 'Sin categoria') as category
                          from public.recurring_movements r
                          left join public.categories c
                            on c.id = r.category_id and c.user_id = r.user_id
                           and c.space_id = r.space_id`;

function safeInteger(value: DatabaseNumber): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(number))
    throw new Error("PostgreSQL devolvio un monto fuera del rango seguro.");
  return number;
}

function dateOnly(value: DatabaseDate): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

function timestamp(value: DatabaseDate): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapMovement(row: MovementRow): Movement {
  return {
    id: row.id,
    spaceId: row.space_id,
    type: row.type,
    status: row.status,
    amountCents: safeInteger(row.amount_cents),
    effectiveDate: dateOnly(row.effective_date),
    description: row.description,
    category: row.category,
    createdAt: timestamp(row.created_at),
    recurringMovementId: row.recurring_movement_id ?? null
  };
}

function mapRecurringMovement(row: RecurringMovementRow): RecurringMovement {
  return {
    id: row.id,
    spaceId: row.space_id,
    type: row.type,
    frequency: row.frequency,
    amountCents: safeInteger(row.amount_cents),
    description: row.description,
    category: row.category,
    startDate: dateOnly(row.start_date),
    endDate: row.end_date === null ? null : dateOnly(row.end_date),
    nextRunDate: dateOnly(row.next_run_date),
    active: row.active,
    createdAt: timestamp(row.created_at)
  };
}

function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    spaceId: row.space_id,
    name: row.name,
    targetCents: safeInteger(row.target_cents),
    savedCents: safeInteger(row.saved_cents),
    targetDate: row.target_date ? dateOnly(row.target_date) : null,
    priority: row.priority,
    status: row.status,
    createdAt: timestamp(row.created_at)
  };
}

function mapContribution(row: ContributionRow): GoalContribution {
  return {
    id: row.id,
    goalId: row.goal_id,
    movementId: row.movement_id,
    amountCents: safeInteger(row.amount_cents),
    effectiveDate: dateOnly(row.effective_date),
    createdAt: timestamp(row.created_at)
  };
}

function monthRange(month: string): [string, string] {
  const year = Number(month.slice(0, 4));
  const value = Number(month.slice(5, 7));
  const nextYear = value === 12 ? year + 1 : year;
  const nextMonth = value === 12 ? 1 : value + 1;
  return [`${month}-01`, `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`];
}

async function ownedSpaceExists(
  client: PoolClient,
  userId: string,
  spaceId: string
): Promise<boolean> {
  const result = await client.query(
    `select 1 from public.spaces
     where id = $1 and user_id = $2 and archived_at is null`,
    [spaceId, userId]
  );
  return result.rowCount === 1;
}

async function resolveCategory(
  client: PoolClient,
  userId: string,
  input: Pick<CreateMovement, "spaceId" | "type" | "category">
): Promise<string | null> {
  if (input.type === "CONTRIBUTION") return null;

  await client.query(
    `insert into public.categories (user_id, space_id, nature, name)
     select $1, $2, $3::public.category_nature, $4
     where exists (
       select 1 from public.spaces
       where id = $2 and user_id = $1 and archived_at is null
     )
     on conflict do nothing`,
    [userId, input.spaceId, input.type, input.category]
  );
  const category = await client.query<{ id: string }>(
    `select id from public.categories
     where user_id = $1 and space_id = $2 and nature = $3
       and lower(trim(name)) = lower(trim($4)) and archived_at is null`,
    [userId, input.spaceId, input.type, input.category]
  );
  return category.rows[0]?.id ?? null;
}

async function findGoal(
  client: PoolClient,
  userId: string,
  goalId: string
): Promise<Goal | undefined> {
  const result = await client.query<GoalRow>(
    `select g.id, g.space_id, g.name, g.target_cents, g.target_date,
            g.priority, g.status, g.created_at,
            coalesce(sum(c.amount_cents) filter (where c.deleted_at is null), 0) as saved_cents
     from public.goals g
     left join public.goal_contributions c
       on c.goal_id = g.id and c.user_id = g.user_id
     where g.id = $1 and g.user_id = $2 and g.archived_at is null
     group by g.id`,
    [goalId, userId]
  );
  return result.rows[0] ? mapGoal(result.rows[0]) : undefined;
}

export class PostgresFinancePersistence implements FinancePersistence {
  constructor(private readonly pool: Pool) {}

  forUser(userId: string): UserFinanceRepository {
    return new PostgresFinanceRepository(this.pool, userId);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

class PostgresFinanceRepository implements UserFinanceRepository {
  constructor(
    private readonly pool: Pool,
    private readonly userId: string
  ) {}

  async listSpaces(): Promise<Space[]> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      const result = await client.query<Space>(
        `select id, name, type from public.spaces
         where user_id = $1 and archived_at is null
         order by case type when 'PERSONAL' then 0 else 1 end, created_at`,
        [this.userId]
      );
      return result.rows;
    });
  }

  async spaceExists(id: string): Promise<boolean> {
    return withUserTransaction(this.pool, this.userId, (client) =>
      ownedSpaceExists(client, this.userId, id)
    );
  }

  async listMovements(spaceId: string, month?: string): Promise<Movement[]> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      const parameters: unknown[] = [this.userId, spaceId];
      let periodFilter = "";
      if (month) {
        const [start, end] = monthRange(month);
        parameters.push(start, end);
        periodFilter = "and m.effective_date >= $3::date and m.effective_date < $4::date";
      }
      const result = await client.query<MovementRow>(
        `select m.id, m.space_id, m.type, m.status, m.amount_cents,
                m.effective_date, m.description, m.created_at, m.recurring_movement_id,
                coalesce(c.name, case when m.type = 'CONTRIBUTION' then 'Ahorro' else 'Sin categoria' end) as category
         from public.movements m
         left join public.categories c
           on c.id = m.category_id and c.user_id = m.user_id and c.space_id = m.space_id
         where m.user_id = $1 and m.space_id = $2
           and m.deleted_at is null and m.status <> 'VOIDED'
           ${periodFilter}
         order by m.effective_date desc, m.created_at desc`,
        parameters
      );
      return result.rows.map(mapMovement);
    });
  }

  async createMovement(input: CreateMovement): Promise<Movement | undefined> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      if (!(await ownedSpaceExists(client, this.userId, input.spaceId))) return undefined;
      const categoryId = await resolveCategory(client, this.userId, input);
      if (input.type !== "CONTRIBUTION" && !categoryId) return undefined;

      const result = await client.query<Omit<MovementRow, "category">>(
        `insert into public.movements (
           user_id, space_id, category_id, type, status, amount_cents,
           effective_date, description
         ) values ($1, $2, $3, $4, $5, $6, $7::date, $8)
         returning id, space_id, type, status, amount_cents,
                   effective_date, description, created_at`,
        [
          this.userId,
          input.spaceId,
          categoryId,
          input.type,
          input.status,
          input.amountCents,
          input.effectiveDate,
          input.description
        ]
      );
      return mapMovement({ ...result.rows[0]!, category: input.category });
    });
  }

  async updateMovement(id: string, input: CreateMovement): Promise<Movement | undefined> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      if (!(await ownedSpaceExists(client, this.userId, input.spaceId))) return undefined;
      const categoryId = await resolveCategory(client, this.userId, input);
      if (input.type !== "CONTRIBUTION" && !categoryId) return undefined;

      const result = await client.query<Omit<MovementRow, "category">>(
        `update public.movements as movement set
           space_id = $3, category_id = $4, type = $5, status = $6,
           amount_cents = $7, effective_date = $8::date, description = $9
         where movement.id = $1 and movement.user_id = $2 and movement.deleted_at is null
           and not exists (
             select 1 from public.goal_contributions contribution
             where contribution.movement_id = movement.id and contribution.deleted_at is null
           )
         returning movement.id, movement.space_id, movement.type, movement.status,
                   movement.amount_cents, movement.effective_date,
                   movement.description, movement.created_at`,
        [
          id,
          this.userId,
          input.spaceId,
          categoryId,
          input.type,
          input.status,
          input.amountCents,
          input.effectiveDate,
          input.description
        ]
      );
      return result.rows[0]
        ? mapMovement({ ...result.rows[0], category: input.category })
        : undefined;
    });
  }

  async listBudgetLimits(spaceId: string, month: string): Promise<BudgetLimit[]> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      const result = await client.query<{
        id: string;
        space_id: string;
        month: string;
        category: string;
        limit_cents: DatabaseNumber;
      }>(
        `select bl.id, bl.space_id, to_char(budget.month, 'YYYY-MM') as month,
                category.name as category, bl.limit_cents
         from public.budget_limits bl
         join public.budgets budget
           on budget.id = bl.budget_id and budget.user_id = bl.user_id
         join public.categories category
           on category.id = bl.category_id and category.user_id = bl.user_id
         where bl.user_id = $1 and bl.space_id = $2 and budget.month = $3::date
         order by lower(category.name)`,
        [this.userId, spaceId, `${month}-01`]
      );
      return result.rows.map((row) => ({
        id: row.id,
        spaceId: row.space_id,
        month: row.month,
        category: row.category,
        limitCents: safeInteger(row.limit_cents)
      }));
    });
  }

  async upsertBudgetLimit(input: BudgetLimitInput): Promise<BudgetLimit | undefined> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      if (!(await ownedSpaceExists(client, this.userId, input.spaceId))) return undefined;
      const categoryId = await resolveCategory(client, this.userId, {
        spaceId: input.spaceId,
        type: "EXPENSE",
        category: input.category
      });
      if (!categoryId) return undefined;

      const insertedBudget = await client.query<{ id: string }>(
        `insert into public.budgets (user_id, space_id, month)
         values ($1, $2, $3::date)
         on conflict do nothing
         returning id`,
        [this.userId, input.spaceId, `${input.month}-01`]
      );
      let budgetId = insertedBudget.rows[0]?.id;
      if (!budgetId) {
        const existingBudget = await client.query<{ id: string }>(
          `select id from public.budgets
           where user_id = $1 and space_id = $2 and month = $3::date`,
          [this.userId, input.spaceId, `${input.month}-01`]
        );
        budgetId = existingBudget.rows[0]?.id;
      }
      if (!budgetId) return undefined;

      const result = await client.query<{ id: string }>(
        `insert into public.budget_limits (
           user_id, space_id, budget_id, category_id, limit_cents
         ) values ($1, $2, $3, $4, $5)
         on conflict (budget_id, category_id)
         do update set limit_cents = excluded.limit_cents
         returning id`,
        [this.userId, input.spaceId, budgetId, categoryId, input.limitCents]
      );
      return { id: result.rows[0]!.id, ...input };
    });
  }

  async listGoals(spaceId: string): Promise<Goal[]> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      const result = await client.query<GoalRow>(
        `select g.id, g.space_id, g.name, g.target_cents, g.target_date,
                g.priority, g.status, g.created_at,
                coalesce(sum(c.amount_cents) filter (where c.deleted_at is null), 0) as saved_cents
         from public.goals g
         left join public.goal_contributions c
           on c.goal_id = g.id and c.user_id = g.user_id
         where g.user_id = $1 and g.space_id = $2 and g.archived_at is null
         group by g.id
         order by case g.status when 'ACTIVE' then 0 when 'PAUSED' then 1 else 2 end,
                  g.created_at desc`,
        [this.userId, spaceId]
      );
      return result.rows.map(mapGoal);
    });
  }

  async createGoal(input: CreateGoal): Promise<Goal | undefined> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      if (!(await ownedSpaceExists(client, this.userId, input.spaceId))) return undefined;
      const status = input.initialAmountCents >= input.targetCents ? "COMPLETED" : "ACTIVE";
      const inserted = await client.query<{ id: string }>(
        `insert into public.goals (
           user_id, space_id, name, target_cents, target_date, priority, status
         ) values ($1, $2, $3, $4, $5::date, $6, $7)
         returning id`,
        [
          this.userId,
          input.spaceId,
          input.name,
          input.targetCents,
          input.targetDate,
          input.priority,
          status
        ]
      );
      const goalId = inserted.rows[0]!.id;
      if (input.initialAmountCents > 0) {
        await client.query(
          `insert into public.goal_contributions (
             user_id, space_id, goal_id, amount_cents, effective_date
           ) values ($1, $2, $3, $4, $5::date)`,
          [this.userId, input.spaceId, goalId, input.initialAmountCents, dominicanDate()]
        );
      }
      return findGoal(client, this.userId, goalId);
    });
  }

  async addGoalContribution(
    goalId: string,
    input: GoalContributionInput
  ): Promise<Goal | undefined> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      const goal = await client.query<{
        id: string;
        space_id: string;
        name: string;
        target_cents: DatabaseNumber;
      }>(
        `select id, space_id, name, target_cents from public.goals
         where id = $1 and user_id = $2 and archived_at is null
         for update`,
        [goalId, this.userId]
      );
      const ownedGoal = goal.rows[0];
      if (!ownedGoal) return undefined;

      const movement = await client.query<{ id: string }>(
        `insert into public.movements (
           user_id, space_id, type, status, amount_cents, effective_date, description
         ) values ($1, $2, 'CONTRIBUTION', 'REGISTERED', $3, $4::date, $5)
         returning id`,
        [
          this.userId,
          ownedGoal.space_id,
          input.amountCents,
          input.effectiveDate,
          `Aporte a ${ownedGoal.name}`
        ]
      );
      await client.query(
        `insert into public.goal_contributions (
           user_id, space_id, goal_id, movement_id, amount_cents, effective_date
         ) values ($1, $2, $3, $4, $5, $6::date)`,
        [
          this.userId,
          ownedGoal.space_id,
          goalId,
          movement.rows[0]!.id,
          input.amountCents,
          input.effectiveDate
        ]
      );
      const total = await client.query<{ amount: DatabaseNumber }>(
        `select coalesce(sum(amount_cents), 0) as amount
         from public.goal_contributions
         where goal_id = $1 and user_id = $2 and deleted_at is null`,
        [goalId, this.userId]
      );
      if (safeInteger(total.rows[0]!.amount) >= safeInteger(ownedGoal.target_cents)) {
        await client.query(
          `update public.goals set status = 'COMPLETED'
           where id = $1 and user_id = $2`,
          [goalId, this.userId]
        );
      }
      return findGoal(client, this.userId, goalId);
    });
  }

  async listGoalContributions(goalId: string): Promise<GoalContribution[]> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      const result = await client.query<ContributionRow>(
        `select contribution.id, contribution.goal_id, contribution.movement_id,
                contribution.amount_cents, contribution.effective_date,
                contribution.created_at
         from public.goal_contributions contribution
         join public.goals goal
           on goal.id = contribution.goal_id and goal.user_id = contribution.user_id
         where contribution.goal_id = $1 and contribution.user_id = $2
           and contribution.deleted_at is null and goal.archived_at is null
         order by contribution.effective_date desc, contribution.created_at desc`,
        [goalId, this.userId]
      );
      return result.rows.map(mapContribution);
    });
  }

  async updateGoalContribution(
    goalId: string,
    contributionId: string,
    input: GoalContributionInput
  ): Promise<GoalContribution | undefined> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      const goal = await client.query<{
        space_id: string;
        target_cents: DatabaseNumber;
        status: Goal["status"];
      }>(
        `select space_id, target_cents, status from public.goals
         where id = $1 and user_id = $2 and archived_at is null
         for update`,
        [goalId, this.userId]
      );
      const ownedGoal = goal.rows[0];
      if (!ownedGoal) return undefined;

      const contribution = await client.query<{ movement_id: string | null }>(
        `select movement_id from public.goal_contributions
         where id = $1 and goal_id = $2 and user_id = $3 and deleted_at is null
         for update`,
        [contributionId, goalId, this.userId]
      );
      const ownedContribution = contribution.rows[0];
      if (!ownedContribution) return undefined;

      const updated = await client.query<ContributionRow>(
        `update public.goal_contributions set
           amount_cents = $4, effective_date = $5::date
         where id = $1 and goal_id = $2 and user_id = $3
         returning id, goal_id, movement_id, amount_cents, effective_date, created_at`,
        [contributionId, goalId, this.userId, input.amountCents, input.effectiveDate]
      );
      if (ownedContribution.movement_id) {
        await client.query(
          `update public.movements set amount_cents = $3, effective_date = $4::date
           where id = $1 and user_id = $2 and type = 'CONTRIBUTION' and deleted_at is null`,
          [ownedContribution.movement_id, this.userId, input.amountCents, input.effectiveDate]
        );
      }

      const total = await client.query<{ amount: DatabaseNumber }>(
        `select coalesce(sum(amount_cents), 0) as amount
         from public.goal_contributions
         where goal_id = $1 and user_id = $2 and deleted_at is null`,
        [goalId, this.userId]
      );
      const completed = safeInteger(total.rows[0]!.amount) >= safeInteger(ownedGoal.target_cents);
      const nextStatus = completed
        ? "COMPLETED"
        : ownedGoal.status === "COMPLETED"
          ? "ACTIVE"
          : ownedGoal.status;
      await client.query(
        `update public.goals set status = $3
         where id = $1 and user_id = $2`,
        [goalId, this.userId, nextStatus]
      );
      return mapContribution(updated.rows[0]!);
    });
  }

  async getBalance(spaceId: string): Promise<Balance | undefined> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      const space = await client.query<{ opening_balance_cents: DatabaseNumber }>(
        `select opening_balance_cents from public.spaces
         where id = $1 and user_id = $2 and archived_at is null`,
        [spaceId, this.userId]
      );
      if (space.rowCount !== 1) return undefined;

      // Se agrega en la base y no cargando los movimientos: el saldo mira toda
      // la historia del espacio, no un mes, y esa lista solo crece.
      const totals = await client.query<{
        income_cents: DatabaseNumber;
        expense_cents: DatabaseNumber;
        contribution_cents: DatabaseNumber;
      }>(
        `select
           coalesce(sum(amount_cents) filter (where type = 'INCOME'), 0) as income_cents,
           coalesce(sum(amount_cents) filter (where type = 'EXPENSE'), 0) as expense_cents,
           coalesce(sum(amount_cents) filter (where type = 'CONTRIBUTION'), 0) as contribution_cents
         from public.movements
         where user_id = $1 and space_id = $2
           and deleted_at is null and status = 'REGISTERED'`,
        [this.userId, spaceId]
      );
      const row = totals.rows[0]!;

      return calculateBalance({
        openingCents: safeInteger(space.rows[0]!.opening_balance_cents),
        incomeCents: safeInteger(row.income_cents),
        expenseCents: safeInteger(row.expense_cents),
        contributionCents: safeInteger(row.contribution_cents)
      });
    });
  }

  async setOpeningBalance(spaceId: string, openingCents: number): Promise<Balance | undefined> {
    const updated = await withUserTransaction(this.pool, this.userId, async (client) => {
      const result = await client.query(
        `update public.spaces set opening_balance_cents = $3, updated_at = now()
         where id = $1 and user_id = $2 and archived_at is null`,
        [spaceId, this.userId, openingCents]
      );
      return result.rowCount === 1;
    });
    return updated ? this.getBalance(spaceId) : undefined;
  }

  async listRecurringMovements(spaceId: string): Promise<RecurringMovement[]> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      const result = await client.query<RecurringMovementRow>(
        `${RECURRING_SELECT}
         where r.user_id = $1 and r.space_id = $2
         order by r.active desc, r.next_run_date, r.created_at`,
        [this.userId, spaceId]
      );
      return result.rows.map(mapRecurringMovement);
    });
  }

  async createRecurringMovement(
    input: CreateRecurringMovement
  ): Promise<RecurringMovement | undefined> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      if (!(await ownedSpaceExists(client, this.userId, input.spaceId))) return undefined;
      const categoryId = await resolveCategory(client, this.userId, input);
      if (!categoryId) return undefined;

      const created = await client.query<{ id: string }>(
        `insert into public.recurring_movements (
           user_id, space_id, category_id, type, frequency, amount_cents,
           description, start_date, end_date, next_run_date
         ) values ($1, $2, $3, $4, $5, $6, $7, $8::date, $9::date, $8::date)
         returning id`,
        [
          this.userId,
          input.spaceId,
          categoryId,
          input.type,
          input.frequency,
          input.amountCents,
          input.description,
          input.startDate,
          input.endDate
        ]
      );
      return this.readRecurring(client, created.rows[0]!.id);
    });
  }

  async updateRecurringMovement(
    id: string,
    input: UpdateRecurringMovement
  ): Promise<RecurringMovement | undefined> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      const existing = await client.query<{ space_id: string; next_run_date: DatabaseDate }>(
        `select space_id, next_run_date from public.recurring_movements
         where id = $1 and user_id = $2`,
        [id, this.userId]
      );
      const current = existing.rows[0];
      if (!current) return undefined;

      const categoryId = await resolveCategory(client, this.userId, {
        spaceId: current.space_id,
        type: input.type,
        category: input.category
      });
      if (!categoryId) return undefined;

      // Cambiar la fecha de inicio redefine el ancla de la serie, asi que la
      // proxima ejecucion se recalcula desde ahi. Mientras el inicio no cambia,
      // se conserva lo ya avanzado para no regenerar lo que ya se registro.
      const startChanged = dateOnly(current.next_run_date) < input.startDate;
      const updated = await client.query<{ id: string }>(
        `update public.recurring_movements
         set category_id = $3, type = $4, frequency = $5, amount_cents = $6,
             description = $7, start_date = $8::date, end_date = $9::date,
             active = $10, updated_at = now(),
             next_run_date = case when $11 then $8::date else next_run_date end
         where id = $1 and user_id = $2
         returning id`,
        [
          id,
          this.userId,
          categoryId,
          input.type,
          input.frequency,
          input.amountCents,
          input.description,
          input.startDate,
          input.endDate,
          input.active,
          startChanged
        ]
      );
      if (updated.rowCount !== 1) return undefined;
      return this.readRecurring(client, id);
    });
  }

  async deleteRecurringMovement(id: string): Promise<boolean> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      // Los movimientos ya generados se quedan: son gastos que de verdad
      // ocurrieron, y borrarlos falsearia los meses pasados. La clave foranea
      // los desvincula sola.
      const result = await client.query(
        "delete from public.recurring_movements where id = $1 and user_id = $2",
        [id, this.userId]
      );
      return result.rowCount === 1;
    });
  }

  async materializeDueRecurrences(spaceId: string, today: string): Promise<number> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      // `for update` serializa dos peticiones simultaneas del mismo usuario:
      // la segunda espera y ya encuentra `next_run_date` avanzado.
      const due = await client.query<{
        id: string;
        category_id: string | null;
        type: RecurringMovement["type"];
        frequency: RecurrenceFrequency;
        amount_cents: DatabaseNumber;
        description: string;
        start_date: DatabaseDate;
        end_date: DatabaseDate | null;
        next_run_date: DatabaseDate;
      }>(
        `select id, category_id, type, frequency, amount_cents, description,
                start_date, end_date, next_run_date
         from public.recurring_movements
         where user_id = $1 and space_id = $2 and active and next_run_date <= $3::date
         for update`,
        [this.userId, spaceId, today]
      );

      let generated = 0;

      for (const rule of due.rows) {
        const startDate = dateOnly(rule.start_date);
        const endDate = rule.end_date === null ? null : dateOnly(rule.end_date);
        let occurrence = dateOnly(rule.next_run_date);
        let guard = 0;

        while (occurrence <= today && (endDate === null || occurrence <= endDate)) {
          // Tope de seguridad: una regla semanal con inicio muy antiguo podria
          // pedir miles de inserciones en una sola peticion. Lo que quede sin
          // generar se recupera en la siguiente lectura.
          if (guard >= MAX_OCCURRENCES_PER_RUN) break;

          const inserted = await client.query(
            `insert into public.movements (
               user_id, space_id, category_id, type, status, source,
               amount_cents, effective_date, description, recurring_movement_id
             ) values ($1, $2, $3, $4, 'REGISTERED', 'RECURRENCE', $5, $6::date, $7, $8)
             on conflict do nothing`,
            [
              this.userId,
              spaceId,
              rule.category_id,
              rule.type,
              safeInteger(rule.amount_cents),
              occurrence,
              rule.description,
              rule.id
            ]
          );
          generated += inserted.rowCount ?? 0;
          occurrence = nextRecurrenceDate(startDate, rule.frequency, occurrence);
          guard += 1;
        }

        const finished = endDate !== null && occurrence > endDate;
        await client.query(
          `update public.recurring_movements
           set next_run_date = $3::date, active = $4, updated_at = now()
           where id = $1 and user_id = $2`,
          [rule.id, this.userId, occurrence, !finished]
        );
      }

      return generated;
    });
  }

  private async readRecurring(
    client: PoolClient,
    id: string
  ): Promise<RecurringMovement | undefined> {
    const result = await client.query<RecurringMovementRow>(
      `${RECURRING_SELECT} where r.id = $1 and r.user_id = $2`,
      [id, this.userId]
    );
    const row = result.rows[0];
    return row ? mapRecurringMovement(row) : undefined;
  }

  async listExpenseCategories(spaceId: string): Promise<ExpenseCategory[]> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      const result = await client.query<{
        id: string;
        space_id: string;
        name: string;
        created_at: DatabaseDate;
      }>(
        `select id, space_id, name, created_at from public.categories
         where user_id = $1 and space_id = $2 and nature = 'EXPENSE'
           and archived_at is null
         order by lower(name)`,
        [this.userId, spaceId]
      );
      return result.rows.map((row) => ({
        id: row.id,
        spaceId: row.space_id,
        name: row.name,
        createdAt: timestamp(row.created_at)
      }));
    });
  }

  async createExpenseCategory(input: CreateExpenseCategory): Promise<ExpenseCategory | undefined> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      const result = await client.query<{
        id: string;
        space_id: string;
        name: string;
        created_at: DatabaseDate;
      }>(
        `insert into public.categories (user_id, space_id, nature, name)
         select $1, $2, 'EXPENSE', $3
         where exists (
           select 1 from public.spaces
           where id = $2 and user_id = $1 and archived_at is null
         )
         on conflict do nothing
         returning id, space_id, name, created_at`,
        [this.userId, input.spaceId, input.name]
      );
      const row = result.rows[0];
      return row
        ? {
            id: row.id,
            spaceId: row.space_id,
            name: row.name,
            createdAt: timestamp(row.created_at)
          }
        : undefined;
    });
  }

  async updateExpenseCategory(id: string, name: string): Promise<ExpenseCategory | undefined> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      const result = await client.query<{
        id: string;
        space_id: string;
        name: string;
        created_at: DatabaseDate;
      }>(
        `update public.categories set name = $1
         where id = $2 and user_id = $3 and archived_at is null
         returning id, space_id, name, created_at`,
        [name, id, this.userId]
      );
      const row = result.rows[0];
      return row
        ? {
            id: row.id,
            spaceId: row.space_id,
            name: row.name,
            createdAt: timestamp(row.created_at)
          }
        : undefined;
    });
  }

  async deleteExpenseCategory(id: string): Promise<boolean> {
    return withUserTransaction(this.pool, this.userId, async (client) => {
      const result = await client.query(
        `update public.categories set archived_at = now()
         where id = $1 and user_id = $2 and archived_at is null
         returning id`,
        [id, this.userId]
      );
      return result.rowCount ? result.rowCount > 0 : false;
    });
  }
}
