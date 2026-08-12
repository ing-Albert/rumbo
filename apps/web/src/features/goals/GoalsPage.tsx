import { formatDop, type Goal, type GoalContribution } from "@ahorra/domain";
import { Pencil } from "lucide-react";
import { type FormEvent, useState } from "react";
import { PageTitle } from "../../components/PageTitle";
import { apiFetch } from "../../lib/api";
import { today } from "../../lib/format";

export function GoalsPage({
  accessToken,
  spaceId,
  goals,
  onSaved
}: {
  accessToken: string;
  spaceId: string;
  goals: Goal[];
  onSaved: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [contributingTo, setContributingTo] = useState<string | null>(null);
  const [viewingContributions, setViewingContributions] = useState<string | null>(null);
  const [contributions, setContributions] = useState<Record<string, GoalContribution[]>>({});
  const [editingContribution, setEditingContribution] = useState<GoalContribution | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [initial, setInitial] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [contribution, setContribution] = useState("");
  const [editedAmount, setEditedAmount] = useState("");
  const [editedDate, setEditedDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function createGoal(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await apiFetch(accessToken, "/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spaceId,
        name,
        targetCents: Math.round(Number(target) * 100),
        initialAmountCents: Math.round(Number(initial || 0) * 100),
        targetDate: targetDate || null,
        priority: "MEDIUM"
      })
    });
    setSaving(false);
    if (response.ok) {
      setCreating(false);
      setName("");
      setTarget("");
      setInitial("");
      setTargetDate("");
      onSaved();
    }
  }

  async function addContribution(goalId: string) {
    setSaving(true);
    const response = await apiFetch(accessToken, `/api/goals/${goalId}/contributions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCents: Math.round(Number(contribution) * 100),
        effectiveDate: today()
      })
    });
    setSaving(false);
    if (response.ok) {
      setContribution("");
      setContributingTo(null);
      onSaved();
      if (viewingContributions === goalId) await loadContributions(goalId);
    }
  }

  async function loadContributions(goalId: string) {
    const response = await apiFetch(accessToken, `/api/goals/${goalId}/contributions`);
    if (!response.ok) return;
    const items = (await response.json()) as GoalContribution[];
    setContributions((current) => ({ ...current, [goalId]: items }));
  }

  async function toggleContributions(goalId: string) {
    if (viewingContributions === goalId) {
      setViewingContributions(null);
      setEditingContribution(null);
      return;
    }
    setViewingContributions(goalId);
    await loadContributions(goalId);
  }

  function beginContributionEdit(item: GoalContribution) {
    setEditingContribution(item);
    setEditedAmount(String(item.amountCents / 100));
    setEditedDate(item.effectiveDate);
  }

  async function saveContribution(goalId: string) {
    if (!editingContribution || Number(editedAmount) <= 0) return;
    setSaving(true);
    const response = await apiFetch(
      accessToken,
      `/api/goals/${goalId}/contributions/${editingContribution.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: Math.round(Number(editedAmount) * 100),
          effectiveDate: editedDate
        })
      }
    );
    setSaving(false);
    if (response.ok) {
      setEditingContribution(null);
      await loadContributions(goalId);
      onSaved();
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="Objetivos"
        title="Metas de ahorro"
        description="Convierte lo que quieres lograr en un avance visible."
        action={
          <button className="primary" onClick={() => setCreating(true)}>
            + Nueva meta
          </button>
        }
      />
      {creating && (
        <form className="panel inline-form" onSubmit={(event) => void createGoal(event)}>
          <header>
            <div>
              <p className="eyebrow">Nueva meta</p>
              <h2>Que quieres alcanzar?</h2>
            </div>
            <button type="button" className="close-button" onClick={() => setCreating(false)}>
              ×
            </button>
          </header>
          <div className="form-grid">
            <label>
              Nombre
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Fondo de emergencia"
              />
            </label>
            <label>
              Monto objetivo
              <div className="compact-money">
                <span>RD$</span>
                <input
                  required
                  inputMode="decimal"
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                />
              </div>
            </label>
            <label>
              Ya tengo ahorrado <small>Opcional</small>
              <div className="compact-money">
                <span>RD$</span>
                <input
                  inputMode="decimal"
                  value={initial}
                  onChange={(event) => setInitial(event.target.value)}
                />
              </div>
            </label>
            <label>
              Fecha objetivo <small>Opcional</small>
              <input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
              />
            </label>
          </div>
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={() => setCreating(false)}>
              Cancelar
            </button>
            <button className="primary" disabled={saving}>
              Crear meta
            </button>
          </div>
        </form>
      )}
      {goals.length === 0 ? (
        <div className="module-empty large">
          <h2>Aun no tienes metas</h2>
          <p>Define una cantidad y una fecha para calcular tu avance.</p>
          <button className="primary" onClick={() => setCreating(true)}>
            Crear primera meta
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map((goal) => {
            const progress = Math.round((goal.savedCents / goal.targetCents) * 100);
            const goalContributions = contributions[goal.id] ?? [];
            return (
              <article className="panel goal-card" key={goal.id}>
                <div className="goal-top">
                  <span className={`status-pill ${goal.status.toLowerCase()}`}>
                    {goal.status === "COMPLETED"
                      ? "Completada"
                      : goal.status === "PAUSED"
                        ? "Pausada"
                        : "Activa"}
                  </span>
                  <span>{progress}%</span>
                </div>
                <h2>{goal.name}</h2>
                <p>
                  <strong>{formatDop(goal.savedCents)}</strong> de {formatDop(goal.targetCents)}
                </p>
                <div className="goal-progress">
                  <span style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <div className="goal-meta">
                  <span>Faltan {formatDop(Math.max(0, goal.targetCents - goal.savedCents))}</span>
                  <span>
                    {goal.targetDate
                      ? new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(
                          new Date(`${goal.targetDate}T12:00:00`)
                        )
                      : "Sin fecha"}
                  </span>
                </div>
                {contributingTo === goal.id ? (
                  <div className="contribution-form">
                    <div className="compact-money">
                      <span>RD$</span>
                      <input
                        autoFocus
                        inputMode="decimal"
                        value={contribution}
                        onChange={(event) => setContribution(event.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <button
                      className="primary"
                      disabled={saving || Number(contribution) <= 0}
                      onClick={() => void addContribution(goal.id)}
                    >
                      Guardar
                    </button>
                    <button className="secondary" onClick={() => setContributingTo(null)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="goal-actions">
                    {goal.status !== "COMPLETED" && (
                      <button className="primary" onClick={() => setContributingTo(goal.id)}>
                        Registrar aporte
                      </button>
                    )}
                    <button className="secondary" onClick={() => void toggleContributions(goal.id)}>
                      {viewingContributions === goal.id
                        ? "Ocultar aportes"
                        : "Ver y editar aportes"}
                    </button>
                  </div>
                )}
                {viewingContributions === goal.id && (
                  <div className="contribution-history">
                    <h3>Historial de aportes</h3>
                    {goalContributions.length === 0 ? (
                      <p>No hay aportes registrados.</p>
                    ) : (
                      goalContributions.map((item) => (
                        <div className="contribution-row" key={item.id}>
                          {editingContribution?.id === item.id ? (
                            <>
                              <div className="compact-money">
                                <span>RD$</span>
                                <input
                                  aria-label="Monto del aporte"
                                  autoFocus
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={editedAmount}
                                  onChange={(event) => setEditedAmount(event.target.value)}
                                />
                              </div>
                              <input
                                aria-label="Fecha del aporte"
                                type="date"
                                value={editedDate}
                                onChange={(event) => setEditedDate(event.target.value)}
                              />
                              <button
                                className="primary"
                                disabled={saving}
                                onClick={() => void saveContribution(goal.id)}
                              >
                                Guardar cambios
                              </button>
                              <button
                                className="secondary"
                                onClick={() => setEditingContribution(null)}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <div>
                                <strong>{formatDop(item.amountCents)}</strong>
                                <span>
                                  {new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(
                                    new Date(`${item.effectiveDate}T12:00:00`)
                                  )}{" "}
                                  · {item.movementId ? "Aporte registrado" : "Saldo inicial"}
                                </span>
                              </div>
                              <button
                                className="table-action"
                                onClick={() => beginContributionEdit(item)}
                                title="Editar"
                              >
                                <Pencil size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
