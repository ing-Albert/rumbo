import { formatDop, type Movement, type MovementStatus, type MovementType } from "@ahorra/domain";
import { type FormEvent, useState } from "react";
import { expenseCategories, incomeCategories } from "../../lib/categories";
import { today } from "../../lib/format";
import { apiFetch } from "../../lib/api";

export function MovementDialog({
  accessToken,
  initialType,
  movement,
  expenseOptions,
  spaceId,
  availableCents,
  onClose,
  onSaved
}: {
  accessToken: string;
  initialType: MovementType;
  movement?: Movement;
  expenseOptions: string[];
  spaceId: string;
  availableCents: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<MovementType>(initialType);
  const [status, setStatus] = useState<MovementStatus>(movement?.status ?? "REGISTERED");
  const [amount, setAmount] = useState(movement ? String(movement.amountCents / 100) : "");
  const [category, setCategory] = useState(
    movement?.category ?? (initialType === "INCOME" ? incomeCategories[0]! : expenseCategories[0]!)
  );
  const [description, setDescription] = useState(movement?.description ?? "");
  const [date, setDate] = useState(movement?.effectiveDate ?? today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const amountCents = Math.round(Number(amount || 0) * 100);
  const previousImpact =
    movement?.status === "REGISTERED"
      ? movement.type === "INCOME"
        ? movement.amountCents
        : -movement.amountCents
      : 0;
  const nextImpact = status === "REGISTERED" ? (type === "INCOME" ? amountCents : -amountCents) : 0;
  const impact = availableCents - previousImpact + nextImpact;
  const categories = type === "INCOME" ? incomeCategories : expenseOptions;

  function changeType(next: MovementType) {
    setType(next);
    setCategory(next === "INCOME" ? incomeCategories[0]! : expenseOptions[0]!);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Introduce un monto mayor que cero.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const response = await apiFetch(
        accessToken,
        movement ? `/api/movements/${movement.id}` : "/api/movements",
        {
          method: movement ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spaceId,
            type,
            status,
            amountCents,
            effectiveDate: date,
            description: description.trim() || category,
            category
          })
        }
      );
      if (!response.ok) throw new Error("No pudimos guardar el movimiento.");
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos guardar el movimiento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="movement-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <header>
          <div>
            <p className="eyebrow">{movement ? "Editar movimiento" : "Nuevo movimiento"}</p>
            <h2 id="dialog-title">
              {movement
                ? `Editar ${type === "INCOME" ? "ingreso" : "gasto"}`
                : type === "INCOME"
                  ? "Registrar ingreso"
                  : "Registrar gasto"}
            </h2>
          </div>
          <button className="close-button" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="type-tabs">
            <button
              type="button"
              className={type === "EXPENSE" ? "active" : ""}
              onClick={() => changeType("EXPENSE")}
            >
              Gasto
            </button>
            <button
              type="button"
              className={type === "INCOME" ? "active" : ""}
              onClick={() => changeType("INCOME")}
            >
              Ingreso
            </button>
          </div>
          <label>
            Monto <span>*</span>
            <div className="money-input">
              <span>RD$</span>
              <input
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
              />
            </div>
          </label>
          <div className="form-row">
            <label>
              Categoria <span>*</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Fecha <span>*</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
          </div>
          <label>
            Descripcion <small>Opcional</small>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={
                type === "INCOME" ? "Ej. sueldo de agosto" : "Ej. compra del supermercado"
              }
            />
          </label>
          <fieldset>
            <legend>Estado</legend>
            <label>
              <input
                type="radio"
                checked={status === "REGISTERED"}
                onChange={() => setStatus("REGISTERED")}
              />{" "}
              Registrado
            </label>
            <label>
              <input
                type="radio"
                checked={status === "SCHEDULED"}
                onChange={() => setStatus("SCHEDULED")}
              />{" "}
              Programado
            </label>
          </fieldset>
          {amountCents > 0 && status === "REGISTERED" && (
            <div className="impact-card">
              <span>Disponible despues de guardar</span>
              <strong>{formatDop(impact)}</strong>
            </div>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="primary" disabled={saving}>
              {saving
                ? "Guardando..."
                : movement
                  ? "Guardar cambios"
                  : `Guardar ${type === "INCOME" ? "ingreso" : "gasto"}`}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
