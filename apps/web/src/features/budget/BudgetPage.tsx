import { formatDop, type BudgetLimit, type ExpenseCategory, type Summary } from "@ahorra/domain";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { MoneyInput } from "../../components/MoneyInput";
import { PageTitle } from "../../components/PageTitle";
import { Stat } from "../../components/Stat";
import { apiFetch } from "../../lib/api";
import { expenseCategories } from "../../lib/categories";
import { CategoryIcon } from "../../lib/categoryIcons";
import { monthLabel } from "../../lib/format";

export function BudgetPage({
  accessToken,
  spaceId,
  month,
  summary,
  limits,
  customCategories,
  onSaved
}: {
  accessToken: string;
  spaceId: string;
  month: string;
  summary: Summary;
  limits: BudgetLimit[];
  customCategories: ExpenseCategory[];
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ExpenseCategory | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const customCategoryNames = customCategories.map((c) => c.name);
  const categories = [
    ...new Set([
      ...expenseCategories,
      ...customCategoryNames,
      ...summary.expenseByCategory.map((item) => item.category)
    ])
  ];

  useEffect(() => {
    setValues(
      Object.fromEntries(
        limits.map((limit) => [
          limit.category,
          limit.limitCents > 0 ? String(limit.limitCents / 100) : ""
        ])
      )
    );
  }, [limits]);

  const totalLimit = categories.reduce(
    (total, category) => total + Math.round(Number(values[category] || 0) * 100),
    0
  );

  async function saveBudget() {
    setSaving(true);
    setMessage("");
    try {
      await Promise.all(
        categories.map(async (category) => {
          const response = await apiFetch(accessToken, "/api/budget", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              spaceId,
              month,
              category,
              limitCents: Math.max(0, Math.round(Number(values[category] || 0) * 100))
            })
          });
          if (!response.ok) throw new Error();
        })
      );
      setMessage("Presupuesto guardado correctamente.");
      onSaved();
    } catch {
      setMessage("No pudimos guardar el presupuesto.");
    } finally {
      setSaving(false);
    }
  }

  async function createCategory(event: FormEvent) {
    event.preventDefault();
    setCategoryError("");
    const response = await apiFetch(accessToken, "/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId, name: categoryName })
    });
    if (!response.ok) {
      const body = (await response
        .json()
        .catch(() => ({ message: "No pudimos crear la categoria." }))) as { message?: string };
      setCategoryError(body.message ?? "No pudimos crear la categoria.");
      return;
    }
    setCategoryName("");
    setAddingCategory(false);
    setMessage("Categoria agregada correctamente.");
    onSaved();
  }

  function startEdit(cat: ExpenseCategory) {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditError("");
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingCategory) return;
    setEditError("");
    const response = await apiFetch(accessToken, `/api/categories/${editingCategory.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName })
    });
    if (!response.ok) {
      const body = (await response
        .json()
        .catch(() => ({ message: "No pudimos editar la categoria." }))) as { message?: string };
      setEditError(body.message ?? "No pudimos editar la categoria.");
      return;
    }
    setEditingCategory(null);
    setMessage("Categoria actualizada correctamente.");
    onSaved();
  }

  async function deleteCategory(cat: ExpenseCategory) {
    setDeletingId(cat.id);
    const response = await apiFetch(accessToken, `/api/categories/${cat.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!response.ok) {
      setMessage("No pudimos eliminar la categoria.");
      return;
    }
    setMessage(`Categoria "${cat.name}" eliminada.`);
    onSaved();
  }

  return (
    <>
      <PageTitle
        eyebrow="Plan del periodo"
        title="Presupuesto"
        description={`Define cuanto quieres gastar durante ${monthLabel(month)}.`}
        action={
          <div className="button-row">
            <button className="secondary" onClick={() => setAddingCategory(true)}>
              <Plus size={16} /> Nueva categoria
            </button>
            <button className="primary" onClick={() => void saveBudget()} disabled={saving}>
              {saving ? "Guardando..." : "Guardar presupuesto"}
            </button>
          </div>
        }
      />
      {addingCategory && (
        <form className="category-creator" onSubmit={(event) => void createCategory(event)}>
          <label>
            Nombre de la categoria
            <input
              autoFocus
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Ej. Mascotas"
              minLength={2}
              maxLength={80}
              required
            />
          </label>
          <div>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setAddingCategory(false);
                setCategoryError("");
              }}
            >
              Cancelar
            </button>
            <button className="primary">Agregar categoria</button>
          </div>
          {categoryError && <p role="alert">{categoryError}</p>}
        </form>
      )}
      <div className="summary-strip">
        <Stat label="Ingresos" value={summary.incomeCents} tone="income" />
        <Stat label="Presupuestado" value={totalLimit} tone="savings" />
        <Stat label="Gastado" value={summary.expenseCents} tone="expense" />
        <Stat label="Disponible" value={summary.availableAfterSavingsCents} tone="income" />
      </div>
      <p className="budget-formula">
        Disponible = ingresos - gastos - ahorro separado. El presupuesto por categoria sirve como
        limite, no como saldo.
      </p>
      {message && (
        <p className="save-message" role="status">
          {message}
        </p>
      )}
      <section className="panel module-panel budget-editor">
        <header>
          <div>
            <p className="eyebrow">Categorias</p>
            <h2>Limites del mes</h2>
          </div>
          <span>Plan por categoria</span>
        </header>
        {categories.map((category) => {
          const spent =
            summary.expenseByCategory.find((item) => item.category === category)?.amountCents ?? 0;
          const limit = Math.round(Number(values[category] || 0) * 100);
          const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
          const remaining = limit - spent;
          const customCat = !expenseCategories.includes(category)
            ? customCategories.find((c) => c.name === category)
            : undefined;
          return (
            <div className="budget-row" key={category}>
              <div className="budget-category">
                <div className="budget-category-header">
                  {editingCategory && customCat && editingCategory.id === customCat.id ? (
                    <form onSubmit={(event) => void saveEdit(event)} className="inline-edit-form">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        minLength={2}
                        maxLength={80}
                        required
                        className="inline-edit-input"
                      />
                      <button className="primary inline-edit-actions">Guardar</button>
                      <button
                        type="button"
                        className="secondary inline-edit-actions"
                        onClick={() => setEditingCategory(null)}
                      >
                        Cancelar
                      </button>
                      {editError && (
                        <span className="danger-text inline-edit-error">{editError}</span>
                      )}
                    </form>
                  ) : (
                    <>
                      <span className="budget-category-icon" aria-hidden="true">
                        <CategoryIcon category={category} />
                      </span>
                      <strong>{category}</strong>
                      {customCat && (
                        <div className="category-actions">
                          <button
                            className="table-action"
                            onClick={() => startEdit(customCat)}
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="table-action danger"
                            onClick={() => setPendingDelete(customCat)}
                            disabled={deletingId === customCat.id}
                            title="Eliminar"
                          >
                            {deletingId === customCat.id ? "..." : <Trash2 size={16} />}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <span>{spent > 0 ? `${formatDop(spent)} gastados` : "Sin gastos registrados"}</span>
              </div>
              <div className="budget-usage">
                {limit > 0 ? (
                  <>
                    <div className="budget-progress">
                      <span
                        style={{ width: `${Math.min(percent, 100)}%` }}
                        className={percent > 100 ? "over" : ""}
                      />
                    </div>
                    <div className="budget-status">
                      <span>
                        {formatDop(spent)} de {formatDop(limit)}
                      </span>
                      <strong className={remaining < 0 ? "danger-text" : ""}>
                        {remaining >= 0
                          ? `${formatDop(remaining)} disponibles`
                          : `Excedido por ${formatDop(Math.abs(remaining))}`}
                      </strong>
                    </div>
                  </>
                ) : (
                  <span className="no-limit-message">
                    Define un limite para comparar este gasto.
                  </span>
                )}
              </div>
              <label className="limit-field">
                <span>Limite mensual</span>
                <div className="compact-money">
                  <span>RD$</span>
                  <MoneyInput
                    value={values[category] ?? ""}
                    onChange={(raw) => setValues((current) => ({ ...current, [category]: raw }))}
                    placeholder="Ej. 10000"
                  />
                </div>
              </label>
            </div>
          );
        })}
      </section>
      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar categoria"
          description={`¿Eliminar la categoria "${pendingDelete.name}"? Esta accion no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            void deleteCategory(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}
    </>
  );
}
