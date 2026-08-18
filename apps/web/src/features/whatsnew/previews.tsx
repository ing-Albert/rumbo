import {
  calculateDebtProgress,
  calculateSummary,
  type Balance,
  type BudgetLimit,
  type Debt,
  type Goal,
  type Movement,
  type RecurringMovement
} from "@ahorra/domain";
import { OfflineBanner } from "../../components/OfflineBanner";
import { DebtKindPicker } from "../debts/DebtKindPicker";
import { DebtsPage } from "../debts/DebtsPage";
import { MovementCardList } from "../movements/MovementCardList";
import { ReceiptField } from "../../components/ReceiptField";
import { BalanceCard } from "../dashboard/BalanceCard";
import { BudgetAlertBanner } from "../budget/BudgetAlertBanner";
import { SanProgress } from "../debts/SanProgress";
import { GoalPaceNote } from "../goals/GoalPaceNote";
import { RecurrencesPanel } from "../movements/RecurrencesPanel";
import { ReminderCard } from "../settings/ReminderCard";
import { today } from "../../lib/format";

/**
 * Vistas previas de cada novedad.
 *
 * Monta los componentes reales de la app con datos de ejemplo, en vez de
 * dibujos que los imiten. Asi lo que se ve aqui es exactamente lo que se ve en
 * la app, y sigue siendolo cuando la interfaz cambie: no hay una captura que
 * envejezca ni un dibujo que haya que rehacer.
 */

const noop = () => undefined;

/** Fecha a `months` meses vista, para que los ejemplos no venzan con el tiempo. */
function monthsFromToday(months: number): string {
  const [year, month, day] = today().split("-").map(Number);
  const target = new Date(Date.UTC(year!, month! - 1 + months, day!));
  return target.toISOString().slice(0, 10);
}

const SPACE = "espacio-ejemplo";

const goal: Goal = {
  id: "meta-ejemplo",
  spaceId: SPACE,
  name: "Fondo de emergencia",
  targetCents: 100_000_00,
  savedCents: 30_000_00,
  targetDate: monthsFromToday(7),
  priority: "MEDIUM",
  status: "ACTIVE",
  createdAt: `${monthsFromToday(-1)}T12:00:00.000Z`
};

const limits: BudgetLimit[] = [
  { id: "l1", spaceId: SPACE, month: "2026-08", category: "Transporte", limitCents: 5_000_00 },
  { id: "l2", spaceId: SPACE, month: "2026-08", category: "Alimentacion", limitCents: 10_000_00 }
];

const expense = (id: string, category: string, amountCents: number): Movement => ({
  id,
  spaceId: SPACE,
  type: "EXPENSE",
  status: "REGISTERED",
  amountCents,
  effectiveDate: today(),
  description: category,
  category,
  createdAt: `${today()}T12:00:00.000Z`
});

const budgetSummary = calculateSummary([
  expense("m1", "Transporte", 6_200_00),
  expense("m2", "Alimentacion", 8_500_00)
]);

const balance: Balance = {
  openingCents: 15_000_00,
  incomeCents: 132_400_00,
  expenseCents: 88_900_00,
  contributionCents: 30_000_00,
  totalCents: 58_500_00,
  earmarkedCents: 30_000_00,
  freeCents: 28_500_00
};

const recurrences: RecurringMovement[] = [
  {
    id: "r1",
    spaceId: SPACE,
    type: "EXPENSE",
    frequency: "MONTHLY",
    amountCents: 25_000_00,
    description: "Alquiler",
    category: "Vivienda",
    startDate: monthsFromToday(-3),
    endDate: null,
    nextRunDate: monthsFromToday(1),
    active: true,
    createdAt: `${monthsFromToday(-3)}T12:00:00.000Z`
  },
  {
    id: "r2",
    spaceId: SPACE,
    type: "INCOME",
    frequency: "MONTHLY",
    amountCents: 65_000_00,
    description: "Sueldo",
    category: "Salario",
    startDate: monthsFromToday(-3),
    endDate: null,
    nextRunDate: monthsFromToday(1),
    active: true,
    createdAt: `${monthsFromToday(-3)}T12:00:00.000Z`
  },
  {
    id: "r3",
    spaceId: SPACE,
    type: "EXPENSE",
    frequency: "MONTHLY",
    amountCents: 750_00,
    description: "Streaming",
    category: "Otros gastos",
    startDate: monthsFromToday(-3),
    endDate: null,
    nextRunDate: monthsFromToday(1),
    active: false,
    createdAt: `${monthsFromToday(-3)}T12:00:00.000Z`
  }
];

const san: Debt = {
  id: "san-ejemplo",
  spaceId: SPACE,
  kind: "SAN",
  status: "ACTIVE",
  name: "San del trabajo",
  counterparty: "Maria",
  principalCents: 0,
  installmentCents: 5_000_00,
  members: 10,
  turnPosition: 7,
  dueDate: null,
  notes: null,
  paidCents: 20_000_00,
  createdAt: `${monthsFromToday(-4)}T12:00:00.000Z`
};

export function RecurrencePreview() {
  return (
    <RecurrencesPanel
      accessToken=""
      spaceId={SPACE}
      recurrences={recurrences}
      customCategories={[]}
      onSaved={noop}
    />
  );
}

export function BudgetAlertPreview() {
  return <BudgetAlertBanner limits={limits} summary={budgetSummary} />;
}

export function GoalPacePreview() {
  return (
    <div className="panel goal-card preview-goal">
      <h2>{goal.name}</h2>
      <div className="goal-meta">
        <span>Faltan RD$70,000</span>
        <span>Fecha objetivo</span>
      </div>
      <GoalPaceNote goal={goal} />
    </div>
  );
}

export function BalancePreview() {
  return <BalanceCard balance={balance} />;
}

export function SanPreview() {
  return (
    <article className="panel debt-card">
      <div className="debt-card-top">
        <div>
          <h2>{san.name}</h2>
          <p className="debt-counterparty">{san.counterparty}</p>
        </div>
      </div>
      <SanProgress debt={san} progress={calculateDebtProgress(san)} />
    </article>
  );
}

export function ReceiptPreview() {
  return (
    <div className="panel">
      <ReceiptField userId="" value={null} onChange={noop} />
    </div>
  );
}

export function OfflinePreview() {
  return <OfflineBanner online pending={2} onSync={noop} />;
}

const sampleDebts: Debt[] = [
  {
    id: "deuda-ejemplo",
    spaceId: SPACE,
    kind: "DEBT",
    status: "ACTIVE",
    name: "Tarjeta de credito",
    counterparty: "Banco Popular",
    principalCents: 45_000_00,
    installmentCents: 0,
    members: null,
    turnPosition: null,
    dueDate: null,
    notes: null,
    paidCents: 32_000_00,
    createdAt: `${monthsFromToday(-5)}T12:00:00.000Z`
  },
  {
    id: "prestamo-ejemplo",
    spaceId: SPACE,
    kind: "LOAN",
    status: "ACTIVE",
    name: "Prestamo a Juan",
    counterparty: "Juan",
    principalCents: 15_000_00,
    installmentCents: 0,
    members: null,
    turnPosition: null,
    dueDate: null,
    notes: null,
    paidCents: 5_000_00,
    createdAt: `${monthsFromToday(-2)}T12:00:00.000Z`
  }
];

const sampleMovements: Movement[] = [
  {
    id: "mov-1",
    spaceId: SPACE,
    type: "EXPENSE",
    status: "REGISTERED",
    amountCents: 1_250_00,
    effectiveDate: today(),
    description: "Compra en el supermercado",
    category: "Alimentacion",
    createdAt: `${today()}T12:00:00.000Z`,
    receiptPath: "ejemplo/recibo.jpg"
  },
  {
    id: "mov-2",
    spaceId: SPACE,
    type: "INCOME",
    status: "REGISTERED",
    amountCents: 65_000_00,
    effectiveDate: today(),
    description: "Sueldo de este mes",
    category: "Salario",
    createdAt: `${today()}T12:00:00.000Z`,
    recurringMovementId: "r1"
  },
  {
    id: "mov-3",
    spaceId: SPACE,
    type: "EXPENSE",
    status: "SCHEDULED",
    amountCents: 25_000_00,
    effectiveDate: today(),
    description: "Alquiler",
    category: "Vivienda",
    createdAt: `${today()}T12:00:00.000Z`
  }
];

export function DebtsModulePreview() {
  return <DebtsPage accessToken="" spaceId={SPACE} debts={sampleDebts} onSaved={noop} />;
}

export function DebtKindPickerPreview() {
  return (
    <div className="panel">
      <DebtKindPicker value="DEBT" onChange={noop} />
    </div>
  );
}

export function MovementsMobilePreview() {
  return (
    <div className="panel">
      {/* La lista de movil se dibuja siempre aqui: la vista previa la ensena
          fuera de su ancho, y ocultarla dejaria el hueco vacio. */}
      <div className="movement-cards preview-forced">
        <MovementCardList movements={sampleMovements} onEdit={noop} />
      </div>
    </div>
  );
}

export function ReminderPreview() {
  return (
    <ReminderCard
      settings={{ enabled: true, time: "20:00" }}
      onChange={noop}
      initialPermission="granted"
    />
  );
}
