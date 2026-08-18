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
  category: z.string().trim().min(1).max(80),
  /** Ruta de la foto del recibo dentro del bucket, no la imagen. */
  // nullish y no default(null): asi la clave queda opcional en el tipo, y los
  // movimientos sin recibo no tienen que declararlo en cada sitio.
  receiptPath: z.string().trim().max(400).nullish()
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

export const recurrenceFrequencies = ["WEEKLY", "BIWEEKLY", "MONTHLY"] as const;

export const createRecurringMovementSchema = z.object({
  spaceId: entityIdSchema,
  // Los aportes a metas se registran por su propio flujo, no como recurrencia.
  type: z.enum(["INCOME", "EXPENSE"]),
  frequency: z.enum(recurrenceFrequencies),
  amountCents: amountCentsSchema.positive(),
  description: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(80),
  startDate: z.iso.date(),
  endDate: z.iso.date().nullable().default(null)
});

export const updateRecurringMovementSchema = createRecurringMovementSchema
  .omit({ spaceId: true })
  .extend({ active: z.boolean().default(true) });

export const debtKinds = ["DEBT", "LOAN", "SAN"] as const;

export const createDebtSchema = z
  .object({
    spaceId: entityIdSchema,
    kind: z.enum(debtKinds),
    name: z.string().trim().min(1).max(120),
    counterparty: z.string().trim().max(120).nullable().default(null),
    principalCents: amountCentsSchema.default(0),
    installmentCents: amountCentsSchema.default(0),
    members: z.number().int().min(2).max(100).nullable().default(null),
    turnPosition: z.number().int().min(1).max(100).nullable().default(null),
    dueDate: z.iso.date().nullable().default(null),
    notes: z.string().trim().max(1000).nullable().default(null)
  })
  .superRefine((value, context) => {
    if (value.kind === "SAN") {
      // Un san sin cuota, sin miembros o con un turno fuera de la rueda no se
      // puede calcular. Mejor rechazarlo que devolver una cifra inventada.
      if (value.installmentCents <= 0) {
        context.addIssue({
          code: "custom",
          path: ["installmentCents"],
          message: "Indica la cuota."
        });
      }
      if (value.members === null) {
        context.addIssue({ code: "custom", path: ["members"], message: "Indica cuantos son." });
      }
      if (value.turnPosition === null) {
        context.addIssue({ code: "custom", path: ["turnPosition"], message: "Indica tu turno." });
      }
      if (
        value.members !== null &&
        value.turnPosition !== null &&
        value.turnPosition > value.members
      ) {
        context.addIssue({
          code: "custom",
          path: ["turnPosition"],
          message: "El turno no puede pasar del numero de miembros."
        });
      }
      return;
    }
    if (value.principalCents <= 0) {
      context.addIssue({ code: "custom", path: ["principalCents"], message: "Indica el monto." });
    }
  });

export const debtPaymentSchema = z.object({
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
export type RecurrenceFrequency = (typeof recurrenceFrequencies)[number];
export type CreateRecurringMovement = z.infer<typeof createRecurringMovementSchema>;
export type UpdateRecurringMovement = z.infer<typeof updateRecurringMovementSchema>;

export interface Movement extends CreateMovement {
  id: string;
  createdAt: string;
  /** Regla que lo genero, si no se escribio a mano. */
  recurringMovementId?: string | null;
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

export type DebtKind = (typeof debtKinds)[number];
export type CreateDebt = z.infer<typeof createDebtSchema>;
export type DebtPaymentInput = z.infer<typeof debtPaymentSchema>;

export interface Debt extends CreateDebt {
  id: string;
  status: "ACTIVE" | "SETTLED";
  /** Suma de los pagos o cobros ya registrados. */
  paidCents: number;
  createdAt: string;
}

export interface DebtPayment extends DebtPaymentInput {
  id: string;
  debtId: string;
  movementId: string | null;
  createdAt: string;
}

export interface RecurringMovement extends CreateRecurringMovement {
  id: string;
  /** Proxima fecha que falta por generar. */
  nextRunDate: string;
  active: boolean;
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

export const openingBalanceSchema = z.object({
  openingBalanceCents: z.number().int().min(-9_000_000_000_000_000).max(9_000_000_000_000_000)
});

export type OpeningBalanceInput = z.infer<typeof openingBalanceSchema>;

/** Totales de toda la vida del espacio, no de un mes. */
export interface BalanceTotals {
  openingCents: number;
  incomeCents: number;
  expenseCents: number;
  contributionCents: number;
}

export interface Balance extends BalanceTotals {
  /** Todo el dinero del espacio, este donde este. */
  totalCents: number;
  /** La parte ya comprometida con metas de ahorro. */
  earmarkedCents: number;
  /** Lo que queda sin comprometer. Puede ser negativo si se aparto de mas. */
  freeCents: number;
}

/**
 * Convierte los totales acumulados en el saldo real del espacio.
 *
 * Los aportes a metas no se restan del total: ese dinero sigue siendo del
 * usuario, solo que apartado. Restarlo diria que se gasto, que es justo lo que
 * la app no debe afirmar. Se separa como comprometido, y lo libre es la resta.
 */
export function calculateBalance(totals: BalanceTotals): Balance {
  const totalCents = totals.openingCents + totals.incomeCents - totals.expenseCents;
  return {
    ...totals,
    totalCents,
    earmarkedCents: totals.contributionCents,
    freeCents: totalCents - totals.contributionCents
  };
}

export interface DebtProgress {
  /** Lo que hay que poner en total. En un san, la cuota por todas las rondas. */
  totalCents: number;
  paidCents: number;
  remainingCents: number;
  /** Avance de 0 a 100. */
  percent: number;
  /** Solo san: lo que se cobra el dia del turno. */
  potCents: number | null;
  roundsPaid: number | null;
  roundsTotal: number | null;
  /** Solo san: si el turno de cobrar ya paso. */
  turnReached: boolean | null;
  /**
   * Solo san: puesto menos cobrado. Positivo mientras se esta prestando al
   * grupo; negativo despues de cobrar, cuando lo que queda es devolver.
   */
  netCents: number | null;
}

/**
 * Traduce una deuda a cuanto falta, y un san a en que punto de la rueda se esta.
 *
 * Un san no es una deuda ni un ahorro: cada miembro pone la misma cuota cada
 * ronda y por turnos se lleva todo lo recaudado. Quien cobra al final le presta
 * al grupo durante casi toda la rueda; quien cobra al principio termina
 * debiendo. Ese cambio de signo es lo unico que de verdad hay que mostrar, y es
 * justo lo que se pierde si se fuerza dentro del molde de "prestamo".
 */
export function calculateDebtProgress(
  debt: Pick<
    Debt,
    "kind" | "principalCents" | "installmentCents" | "members" | "turnPosition" | "paidCents"
  >
): DebtProgress {
  const paidCents = debt.paidCents;

  if (debt.kind !== "SAN") {
    const totalCents = debt.principalCents;
    const remainingCents = Math.max(0, totalCents - paidCents);
    return {
      totalCents,
      paidCents,
      remainingCents,
      percent: totalCents > 0 ? Math.min(100, Math.round((paidCents / totalCents) * 100)) : 0,
      potCents: null,
      roundsPaid: null,
      roundsTotal: null,
      turnReached: null,
      netCents: null
    };
  }

  const roundsTotal = debt.members ?? 0;
  const potCents = debt.installmentCents * roundsTotal;
  const totalCents = potCents;
  const roundsPaid = debt.installmentCents > 0 ? Math.floor(paidCents / debt.installmentCents) : 0;
  const turnReached = debt.turnPosition !== null && roundsPaid >= debt.turnPosition;

  return {
    totalCents,
    paidCents,
    remainingCents: Math.max(0, totalCents - paidCents),
    percent: totalCents > 0 ? Math.min(100, Math.round((paidCents / totalCents) * 100)) : 0,
    potCents,
    roundsPaid,
    roundsTotal,
    turnReached,
    netCents: paidCents - (turnReached ? potCents : 0)
  };
}

export interface DebtsOverview {
  /** Lo que falta pagar de las deudas activas. */
  owedByMeCents: number;
  /** Lo que falta cobrar de los prestamos activos. */
  owedToMeCents: number;
  /** Lo que falta poner en los sanes en curso. */
  sanPendingCents: number;
  activeCount: number;
  settledCount: number;
}

/**
 * Los tres numeros que responde esta pantalla de un vistazo: cuanto debo,
 * cuanto me deben y cuanto me falta poner en sanes.
 *
 * Lo saldado no suma en ninguno: ya no es un compromiso, y contarlo inflaria
 * las cifras justo despues de terminar de pagar algo, que es cuando uno espera
 * verlas bajar.
 */
export function summarizeDebts(
  debts: Array<
    Pick<
      Debt,
      | "kind"
      | "status"
      | "principalCents"
      | "installmentCents"
      | "members"
      | "turnPosition"
      | "paidCents"
    >
  >
): DebtsOverview {
  const overview: DebtsOverview = {
    owedByMeCents: 0,
    owedToMeCents: 0,
    sanPendingCents: 0,
    activeCount: 0,
    settledCount: 0
  };

  for (const debt of debts) {
    if (debt.status === "SETTLED") {
      overview.settledCount += 1;
      continue;
    }
    overview.activeCount += 1;

    const { remainingCents } = calculateDebtProgress(debt);
    if (debt.kind === "DEBT") overview.owedByMeCents += remainingCents;
    else if (debt.kind === "LOAN") overview.owedToMeCents += remainingCents;
    else overview.sanPendingCents += remainingCents;
  }

  return overview;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Calcula cuando toca la siguiente vez, contando siempre desde `startDate`.
 *
 * Contar desde el origen y no desde la ocurrencia anterior es lo que hace que
 * una regla mensual anclada en un dia 31 vuelva al 31 despues de pasar por
 * febrero: si se encadenara desde la fecha ya recortada, la serie se quedaria
 * en el 28 para siempre.
 */
export function nextRecurrenceDate(
  startDate: string,
  frequency: RecurrenceFrequency,
  current: string
): string {
  if (frequency === "WEEKLY" || frequency === "BIWEEKLY") {
    const [year, month, day] = current.split("-").map(Number);
    const moved = new Date(Date.UTC(year!, month! - 1, day!));
    moved.setUTCDate(moved.getUTCDate() + (frequency === "WEEKLY" ? 7 : 14));
    return moved.toISOString().slice(0, 10);
  }

  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [currentYear, currentMonth] = current.split("-").map(Number);
  const elapsed = (currentYear! - startYear!) * 12 + (currentMonth! - startMonth!);
  const index = startMonth! - 1 + elapsed + 1;
  const year = startYear! + Math.floor(index / 12);
  const month = (index % 12) + 1;
  return toIsoDate(year, month, Math.min(startDay!, daysInMonth(year, month)));
}

/** Punto a partir del cual una categoria deja de ir holgada y conviene avisar. */
export const BUDGET_NEAR_RATIO = 0.8;

export type BudgetAlertLevel = "OK" | "NEAR" | "OVER";

export interface BudgetCategoryAlert {
  category: string;
  limitCents: number;
  spentCents: number;
  /** Parte del limite ya consumida. Puede pasar de 1 si se excedio. */
  usedRatio: number;
  /** Lo que queda del limite. Negativo cuando ya se paso. */
  remainingCents: number;
  level: BudgetAlertLevel;
}

export interface BudgetAlerts {
  /** Solo categorias con limite definido, de la mas critica a la menos. */
  categories: BudgetCategoryAlert[];
  nearCount: number;
  overCount: number;
}

/**
 * Cruza los limites del mes con lo gastado y dice cuales conviene mirar.
 *
 * Un limite en cero es "sin limite definido", no "no puedes gastar nada": es
 * lo que guarda la pantalla de presupuesto cuando el campo se deja vacio, asi
 * que esas categorias quedan fuera en vez de aparecer siempre excedidas.
 */
export function calculateBudgetAlerts(
  limits: Array<Pick<BudgetLimit, "category" | "limitCents">>,
  expenseByCategory: Summary["expenseByCategory"]
): BudgetAlerts {
  const spentByCategory = new Map(
    expenseByCategory.map((item) => [item.category, item.amountCents])
  );

  const categories = limits
    .filter((limit) => limit.limitCents > 0)
    .map<BudgetCategoryAlert>((limit) => {
      const spentCents = spentByCategory.get(limit.category) ?? 0;
      const usedRatio = spentCents / limit.limitCents;
      return {
        category: limit.category,
        limitCents: limit.limitCents,
        spentCents,
        usedRatio,
        remainingCents: limit.limitCents - spentCents,
        level: usedRatio > 1 ? "OVER" : usedRatio >= BUDGET_NEAR_RATIO ? "NEAR" : "OK"
      };
    })
    .sort((left, right) => right.usedRatio - left.usedRatio);

  return {
    categories,
    nearCount: categories.filter((item) => item.level === "NEAR").length,
    overCount: categories.filter((item) => item.level === "OVER").length
  };
}

export type GoalPaceStatus = "COMPLETED" | "NO_DATE" | "OVERDUE" | "ON_TRACK" | "BEHIND";

export interface GoalPace {
  /** Lo que falta para el objetivo. Nunca negativo. */
  remainingCents: number;
  /** Meses utiles que quedan hasta la fecha objetivo. `null` sin fecha o vencida. */
  monthsLeft: number | null;
  /** Cuanto hay que apartar cada uno de esos meses. `null` si no aplica. */
  monthlyTargetCents: number | null;
  /** Fraccion ahorrada, de 0 a 1. */
  savedRatio: number;
  /** Fraccion que tocaria llevar a estas alturas del plazo, de 0 a 1. `null` sin fecha. */
  expectedRatio: number | null;
  status: GoalPaceStatus;
}

/** Distancia a la que una meta se considera atrasada, y no dentro del margen normal. */
const BEHIND_TOLERANCE = 0.05;

function toUtcDays(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Math.floor(Date.UTC(year!, month! - 1, day!) / 86_400_000);
}

/**
 * Traduce una meta a un plan mensual: cuanto falta, en cuantos meses, y si el
 * avance va acorde al tiempo transcurrido.
 *
 * Los meses se cuentan por calendario, no por bloques de 30 dias, porque es
 * como los cuenta quien aparta dinero: el mes objetivo suma solo si su dia
 * todavia no paso en el mes actual. Siempre queda al menos un mes, para no
 * dividir entre cero el ultimo dia.
 *
 * "Atrasada" compara lo ahorrado con lo que tocaria llevar segun el tiempo
 * consumido del plazo, contando desde que se creo la meta. Es la unica
 * referencia disponible sin pedirle al usuario un plan explicito.
 */
export function calculateGoalPace(
  goal: Pick<Goal, "targetCents" | "savedCents" | "targetDate" | "createdAt" | "status">,
  today: string
): GoalPace {
  const remainingCents = Math.max(0, goal.targetCents - goal.savedCents);
  const savedRatio = goal.targetCents > 0 ? Math.min(1, goal.savedCents / goal.targetCents) : 1;
  const base = { remainingCents, savedRatio };

  if (goal.status === "COMPLETED" || remainingCents === 0) {
    return {
      ...base,
      monthsLeft: null,
      monthlyTargetCents: null,
      expectedRatio: 1,
      status: "COMPLETED"
    };
  }

  if (!goal.targetDate) {
    return {
      ...base,
      monthsLeft: null,
      monthlyTargetCents: null,
      expectedRatio: null,
      status: "NO_DATE"
    };
  }

  const todayDays = toUtcDays(today);
  const targetDays = toUtcDays(goal.targetDate);

  if (targetDays < todayDays) {
    return {
      ...base,
      monthsLeft: null,
      monthlyTargetCents: null,
      expectedRatio: 1,
      status: "OVERDUE"
    };
  }

  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  const [targetYear, targetMonth, targetDay] = goal.targetDate.split("-").map(Number);
  const wholeMonths = (targetYear! - todayYear!) * 12 + (targetMonth! - todayMonth!);
  const monthsLeft = Math.max(1, wholeMonths + (targetDay! >= todayDay! ? 1 : 0));

  // El plazo corre desde que se creo la meta; su parte consumida es lo que
  // marca cuanto tendria que llevar ahorrado a dia de hoy.
  const startDays = toUtcDays(goal.createdAt.slice(0, 10));
  const totalDays = targetDays - startDays;
  const expectedRatio =
    totalDays > 0 ? Math.min(1, Math.max(0, (todayDays - startDays) / totalDays)) : 0;

  return {
    ...base,
    monthsLeft,
    monthlyTargetCents: Math.ceil(remainingCents / monthsLeft),
    expectedRatio,
    status: savedRatio < expectedRatio - BEHIND_TOLERANCE ? "BEHIND" : "ON_TRACK"
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
