import {
  formatDop,
  recurrenceFrequencies,
  type ExpenseCategory,
  type Goal,
  type MovementType,
  type RecurrenceFrequency,
  type RecurringMovement
} from "@ahorra/domain";
import {
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { OptionCards, type OptionCard } from "../../components/OptionCards";
import { type FormEvent, useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { MoneyInput } from "../../components/MoneyInput";
import { apiFetch } from "../../lib/api";
import { expenseCategories } from "../../lib/categories";
import { today } from "../../lib/format";

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  WEEKLY: "Cada semana",
  BIWEEKLY: "Cada dos semanas",
  MONTHLY: "Cada mes"
};

/** El gasto va primero por ser lo que mas se repite. */
const TYPE_OPTIONS: Array<OptionCard<MovementType>> = [
  {
    value: "EXPENSE",
    label: "Gasto",
    hint: "Alquiler, servicios",
    Icon: TrendingDown,
    tone: "expense"
  },
  { value: "INCOME", label: "Ingreso", hint: "Sueldo, renta", Icon: TrendingUp, tone: "income" },
  {
    value: "CONTRIBUTION",
    label: "Aporte a una meta",
    hint: "Apartar para ahorrar",
    Icon: Target,
    tone: "contribution"
  }
];

const EMPTY = {
  type: "EXPENSE" as MovementType,
  goalId: "",
  frequency: "MONTHLY" as RecurrenceFrequency,
  amount: "",
  description: "",
  category: "",
  startDate: "",
  endDate: ""
};

/**
 * Reglas de movimientos que se repiten solos.
 *
 * Vive dentro de Movimientos y no en su propia ruta: es la misma idea que un
 * movimiento, solo que declarada una vez. Sumar una septima entrada al menu
 * habria costado mas de lo que aporta.
 */
export function RecurrencesPanel({
  accessToken,
  spaceId,
  recurrences,
  customCategories,
  goals,
  onSaved
}: {
  accessToken: string;
  spaceId: string;
  recurrences: RecurringMovement[];
  customCategories: ExpenseCategory[];
  goals: Goal[];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringMovement | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<RecurringMovement | null>(null);

  const categories = [...expenseCategories, ...customCategories.map((item) => item.name)];
  // Una meta ya cumplida no deberia seguir recibiendo aportes automaticos.
  const openGoals = goals.filter((item) => item.status !== "COMPLETED");
  const isContribution = form.type === "CONTRIBUTION";

  function startCreate() {
    setEditing(null);
    setForm({ ...EMPTY, category: categories[0] ?? "", startDate: today() });
    setError("");
    setOpen(true);
  }

  function startEdit(rule: RecurringMovement) {
    setEditing(rule);
    setForm({
      type: rule.type,
      goalId: rule.goalId ?? "",
      frequency: rule.frequency,
      amount: String(rule.amountCents / 100),
      description: rule.description,
      category: rule.category,
      startDate: rule.startDate,
      endDate: rule.endDate ?? ""
    });
    setError("");
    setOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      type: form.type,
      goalId: isContribution ? form.goalId : null,
      frequency: form.frequency,
      amountCents: Math.round(Number(form.amount) * 100),
      description: form.description,
      category: form.category,
      startDate: form.startDate,
      endDate: form.endDate || null
    };
    const response = await apiFetch(
      accessToken,
      editing ? `/api/recurrences/${editing.id}` : "/api/recurrences",
      {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { ...body, active: editing.active } : { ...body, spaceId })
      }
    );
    setSaving(false);
    if (!response.ok) {
      setError("No pudimos guardar la recurrencia. Revisa los datos.");
      return;
    }
    setOpen(false);
    setEditing(null);
    onSaved();
  }

  async function toggleActive(rule: RecurringMovement) {
    const response = await apiFetch(accessToken, `/api/recurrences/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: rule.type,
        goalId: rule.goalId,
        frequency: rule.frequency,
        amountCents: rule.amountCents,
        description: rule.description,
        category: rule.category,
        startDate: rule.startDate,
        endDate: rule.endDate,
        active: !rule.active
      })
    });
    if (response.ok) onSaved();
  }

  async function remove(rule: RecurringMovement) {
    const response = await apiFetch(accessToken, `/api/recurrences/${rule.id}`, {
      method: "DELETE"
    });
    if (response.ok) onSaved();
  }

  return (
    <section className="panel module-panel recurrences-panel">
      <header>
        <div>
          <p className="eyebrow">Se registran solos</p>
          <h2>Movimientos recurrentes</h2>
        </div>
        <button className="secondary" onClick={startCreate}>
          <Plus size={16} /> Nueva recurrencia
        </button>
      </header>

      {recurrences.length === 0 && !open ? (
        <p className="recurrences-empty">
          El alquiler, el sueldo o una suscripcion no hace falta anotarlos cada mes. Declara la
          regla una vez y Rumbo los registra el dia que toca.
        </p>
      ) : (
        <div className="recurrence-list">
          {recurrences.map((rule) => (
            <article className={`recurrence-row ${rule.active ? "" : "paused"}`} key={rule.id}>
              <span className={`movement-icon ${rule.type.toLowerCase()}`}>
                {rule.type === "CONTRIBUTION" ? <Target size={16} /> : <Repeat size={16} />}
              </span>
              <div>
                <strong>{rule.description}</strong>
                <span>
                  {FREQUENCY_LABELS[rule.frequency]} · {rule.category} ·{" "}
                  {rule.active ? `proxima el ${formatDay(rule.nextRunDate)}` : "en pausa"}
                </span>
              </div>
              <div className="recurrence-actions">
                <strong className={rule.type === "INCOME" ? "amount-income" : ""}>
                  {rule.type === "INCOME" ? "+" : "−"}
                  {formatDop(rule.amountCents)}
                </strong>
                <button
                  className="table-action"
                  title={rule.active ? "Pausar" : "Reanudar"}
                  aria-label={`${rule.active ? "Pausar" : "Reanudar"} ${rule.description}`}
                  onClick={() => void toggleActive(rule)}
                >
                  {rule.active ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  className="table-action"
                  title="Editar"
                  aria-label={`Editar ${rule.description}`}
                  onClick={() => startEdit(rule)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="table-action danger"
                  title="Eliminar"
                  aria-label={`Eliminar ${rule.description}`}
                  onClick={() => setPendingDelete(rule)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <form className="recurrence-form" onSubmit={(event) => void submit(event)}>
          <OptionCards
            name="recurrence-type"
            legend="Que se repite"
            value={form.type}
            options={TYPE_OPTIONS.map((option) =>
              option.value === "CONTRIBUTION"
                ? { ...option, disabled: openGoals.length === 0 }
                : option
            )}
            onChange={(type) => {
              // Al pasar a aporte se elige la primera meta abierta, para que el
              // formulario nunca quede en un estado invalido.
              const goalId =
                type === "CONTRIBUTION" ? ((form.goalId || openGoals[0]?.id) ?? "") : "";
              const chosen = openGoals.find((item) => item.id === goalId);
              setForm({
                ...form,
                type,
                goalId,
                description: form.description || (chosen ? `Aporte a ${chosen.name}` : "")
              });
            }}
          />

          <div className="form-grid">
            <label className="form-grid-wide">
              <span className="field-label">Cada cuanto</span>
              {/* Tres opciones caben a la vista; en un desplegable habria que
                  abrirlo solo para saber cuales son. */}
              <div className="chip-row">
                {recurrenceFrequencies.map((frequency) => (
                  <button
                    key={frequency}
                    type="button"
                    className={`period-chip${form.frequency === frequency ? " active" : ""}`}
                    aria-pressed={form.frequency === frequency}
                    onClick={() => setForm({ ...form, frequency })}
                  >
                    {FREQUENCY_LABELS[frequency]}
                  </button>
                ))}
              </div>
            </label>
            <label>
              Descripcion
              <input
                required
                maxLength={160}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Ej. Alquiler"
              />
            </label>
            <label>
              Monto
              <div className="compact-money">
                <span>RD$</span>
                <MoneyInput
                  required
                  value={form.amount}
                  onChange={(amount) => setForm({ ...form, amount })}
                />
              </div>
            </label>
            <label>
              {isContribution ? "Meta" : "Categoria"}
              {isContribution ? (
                <select
                  value={form.goalId}
                  onChange={(event) => {
                    const goalId = event.target.value;
                    const chosen = openGoals.find((item) => item.id === goalId);
                    setForm({
                      ...form,
                      goalId,
                      // Se propone solo si el campo sigue vacio: nunca pisa lo
                      // que la persona haya escrito.
                      description: form.description || (chosen ? `Aporte a ${chosen.name}` : "")
                    });
                  }}
                >
                  {openGoals.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              )}
            </label>
            <label>
              Primera vez
              <input
                required
                type="date"
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              />
            </label>
            <label>
              <span className="field-label">
                Hasta <small>Opcional</small>
              </span>
              <input
                type="date"
                min={form.startDate}
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              />
            </label>
          </div>
          {/* Solo lo mensual tiene el problema del dia 31; en lo semanal el
              aviso seria ruido sobre algo que no puede pasar. */}
          {form.frequency === "MONTHLY" && (
            <p className="recurrence-hint">
              El dia de la primera vez marca el resto de la serie. Si eliges un 31, los meses cortos
              usan su ultimo dia y luego vuelve al 31.
            </p>
          )}
          {error && <p role="alert">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button className="primary" disabled={saving}>
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear recurrencia"}
            </button>
          </div>
        </form>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar recurrencia"
          description={`¿Eliminar "${pendingDelete.description}"? Los movimientos que ya se registraron se quedan como estan.`}
          confirmLabel="Eliminar"
          danger
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            void remove(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}
    </section>
  );
}

function formatDay(date: string): string {
  return new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "short" }).format(
    new Date(`${date}T12:00:00`)
  );
}
