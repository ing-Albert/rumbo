import {
  calculateDebtProgress,
  formatDop,
  type CreateDebt,
  type Debt,
  type DebtKind
} from "@ahorra/domain";
import { HandCoins, Handshake, Plus, Trash2, Users } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { IllustratedEmptyState } from "../../components/IllustratedEmptyState";
import { MoneyInput } from "../../components/MoneyInput";
import { PageTitle } from "../../components/PageTitle";
import { apiFetch } from "../../lib/api";
import { today } from "../../lib/format";
import { DebtsOverviewStrip } from "./DebtsOverviewStrip";
import { SanProgress } from "./SanProgress";

const KIND_LABELS: Record<DebtKind, string> = {
  DEBT: "Debo",
  LOAN: "Me deben",
  SAN: "San"
};

const KIND_ICONS: Record<DebtKind, typeof HandCoins> = {
  DEBT: HandCoins,
  LOAN: Handshake,
  SAN: Users
};

const EMPTY = {
  kind: "DEBT" as DebtKind,
  name: "",
  counterparty: "",
  principal: "",
  installment: "",
  members: "10",
  turnPosition: "1",
  dueDate: ""
};

export function DebtsPage({
  accessToken,
  spaceId,
  debts,
  onSaved
}: {
  accessToken: string;
  spaceId: string;
  debts: Debt[];
  onSaved: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payment, setPayment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Debt | null>(null);

  const isSan = form.kind === "SAN";

  async function create(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const body: Partial<CreateDebt> & { spaceId: string } = {
      spaceId,
      kind: form.kind,
      name: form.name,
      counterparty: form.counterparty.trim() || null,
      principalCents: isSan ? 0 : Math.round(Number(form.principal || 0) * 100),
      installmentCents: isSan ? Math.round(Number(form.installment || 0) * 100) : 0,
      members: isSan ? Number(form.members) : null,
      turnPosition: isSan ? Number(form.turnPosition) : null,
      dueDate: form.dueDate || null,
      notes: null
    };
    const response = await apiFetch(accessToken, "/api/debts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setSaving(false);
    if (!response.ok) {
      setError("Revisa los datos. En un san hacen falta la cuota, cuantos son y tu turno.");
      return;
    }
    setCreating(false);
    setForm(EMPTY);
    onSaved();
  }

  async function pay(debt: Debt) {
    setSaving(true);
    const response = await apiFetch(accessToken, `/api/debts/${debt.id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCents: Math.round(Number(payment) * 100),
        effectiveDate: today()
      })
    });
    setSaving(false);
    if (response.ok) {
      setPayment("");
      setPayingId(null);
      onSaved();
    }
  }

  async function remove(debt: Debt) {
    const response = await apiFetch(accessToken, `/api/debts/${debt.id}`, { method: "DELETE" });
    if (response.ok) onSaved();
  }

  return (
    <>
      <PageTitle
        eyebrow="Compromisos"
        title="Deudas y sanes"
        description="Lo que debes, lo que te deben y en que punto va tu san."
        action={
          <button className="primary" onClick={() => setCreating(true)}>
            <Plus size={18} /> Nuevo compromiso
          </button>
        }
      />

      {creating && (
        <form className="panel inline-form" onSubmit={(event) => void create(event)}>
          <header>
            <div>
              <p className="eyebrow">Nuevo compromiso</p>
              <h2>Que quieres registrar?</h2>
            </div>
            <button type="button" className="close-button" onClick={() => setCreating(false)}>
              ×
            </button>
          </header>
          <div className="form-grid">
            <label>
              Tipo
              <select
                value={form.kind}
                onChange={(event) => setForm({ ...form, kind: event.target.value as DebtKind })}
              >
                <option value="DEBT">Debo dinero</option>
                <option value="LOAN">Me deben dinero</option>
                <option value="SAN">San (tanda)</option>
              </select>
            </label>
            <label>
              Nombre
              <input
                required
                maxLength={120}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder={isSan ? "Ej. San del trabajo" : "Ej. Prestamo del banco"}
              />
            </label>
            <label>
              {isSan ? "Organiza" : form.kind === "DEBT" ? "A quien" : "Quien"}{" "}
              <small>Opcional</small>
              <input
                maxLength={120}
                value={form.counterparty}
                onChange={(event) => setForm({ ...form, counterparty: event.target.value })}
                placeholder="Ej. Maria"
              />
            </label>
            {isSan ? (
              <>
                <label>
                  Cuota por ronda
                  <div className="compact-money">
                    <span>RD$</span>
                    <MoneyInput
                      required
                      value={form.installment}
                      onChange={(installment) => setForm({ ...form, installment })}
                    />
                  </div>
                </label>
                <label>
                  Cuantos son
                  <input
                    required
                    type="number"
                    min={2}
                    max={100}
                    value={form.members}
                    onChange={(event) => setForm({ ...form, members: event.target.value })}
                  />
                </label>
                <label>
                  Tu turno
                  <input
                    required
                    type="number"
                    min={1}
                    max={Number(form.members) || 100}
                    value={form.turnPosition}
                    onChange={(event) => setForm({ ...form, turnPosition: event.target.value })}
                  />
                </label>
              </>
            ) : (
              <label>
                Monto total
                <div className="compact-money">
                  <span>RD$</span>
                  <MoneyInput
                    required
                    value={form.principal}
                    onChange={(principal) => setForm({ ...form, principal })}
                  />
                </div>
              </label>
            )}
            <label>
              Fecha limite <small>Opcional</small>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
              />
            </label>
          </div>
          {isSan && (
            <p className="recurrence-hint">
              En un san todos ponen la misma cuota cada ronda y por turnos uno se lleva todo lo
              recaudado. Con la cuota, cuantos son y tu turno, Rumbo calcula cuanto cobras y cuando
              pasas de estar prestando a estar debiendo.
            </p>
          )}
          {error && <p role="alert">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={() => setCreating(false)}>
              Cancelar
            </button>
            <button className="primary" disabled={saving}>
              Crear
            </button>
          </div>
        </form>
      )}

      <DebtsOverviewStrip debts={debts} />

      {debts.length === 0 ? (
        <IllustratedEmptyState
          eyebrow="Sin compromisos"
          title="No tienes deudas ni sanes registrados"
          description="Anota lo que debes, lo que te deben o el san en el que estas para verlo junto al resto de tu plan."
          action={
            <button className="primary" onClick={() => setCreating(true)}>
              <Plus size={18} /> Registrar el primero
            </button>
          }
        />
      ) : (
        <div className="debts-grid">
          {debts.map((debt) => {
            const progress = calculateDebtProgress(debt);
            const Icon = KIND_ICONS[debt.kind];
            return (
              <article
                className={`panel debt-card ${debt.kind.toLowerCase()}${
                  debt.status === "SETTLED" ? " settled" : ""
                }`}
                key={debt.id}
              >
                <div className="debt-card-top">
                  <span className={`debt-kind ${debt.kind.toLowerCase()}`}>
                    <Icon size={13} aria-hidden="true" />
                    {debt.status === "SETTLED" ? "Saldado" : KIND_LABELS[debt.kind]}
                  </span>
                  <button
                    className="table-action danger"
                    title="Eliminar"
                    aria-label={`Eliminar ${debt.name}`}
                    onClick={() => setPendingDelete(debt)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h2>{debt.name}</h2>
                {debt.counterparty && <p className="debt-counterparty">{debt.counterparty}</p>}

                {debt.kind === "SAN" ? (
                  <SanProgress debt={debt} progress={progress} />
                ) : (
                  <>
                    {/*
                      Lo que falta manda: es lo que la persona vino a saber. Lo
                      ya pagado y el total quedan como contexto debajo, no
                      compitiendo con la cifra en la misma linea.
                    */}
                    <p className="debt-figure">
                      <span className="debt-figure-label">
                        {progress.remainingCents === 0
                          ? debt.kind === "LOAN"
                            ? "Te lo devolvieron todo"
                            : "Lo pagaste todo"
                          : debt.kind === "LOAN"
                            ? "Te falta cobrar"
                            : "Te falta pagar"}
                      </span>
                      {/*
                        Ya saldado, lo que falta es cero y anunciarlo en grande
                        no dice nada. La cifra que importa entonces es la que se
                        termino de mover.
                      */}
                      <strong>
                        {formatDop(
                          progress.remainingCents === 0
                            ? progress.totalCents
                            : progress.remainingCents
                        )}
                      </strong>
                    </p>
                    <div className="debt-bar">
                      <span style={{ width: `${progress.percent}%` }} />
                    </div>
                    <p className="debt-progress-note">
                      {formatDop(progress.paidCents)} de {formatDop(progress.totalCents)} ·{" "}
                      {progress.percent}%
                    </p>
                  </>
                )}

                {debt.status !== "SETTLED" &&
                  (payingId === debt.id ? (
                    <div className="contribution-form">
                      <div className="compact-money">
                        <span>RD$</span>
                        <MoneyInput
                          autoFocus
                          value={payment}
                          onChange={setPayment}
                          placeholder="0"
                        />
                      </div>
                      <button
                        className="primary"
                        disabled={saving || Number(payment) <= 0}
                        onClick={() => void pay(debt)}
                      >
                        Guardar
                      </button>
                      <button className="secondary" onClick={() => setPayingId(null)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    /*
                      Secundario y del ancho de su texto: en esta pantalla lo
                      que se viene a hacer es entender como se esta, no pagar.
                      Un boton lleno y a todo lo ancho se comia la cifra, que es
                      lo unico que de verdad tenia que destacar.
                    */
                    <button
                      className="secondary debt-action"
                      onClick={() => {
                        setPayingId(debt.id);
                        setPayment(debt.kind === "SAN" ? String(debt.installmentCents / 100) : "");
                      }}
                    >
                      <Plus size={15} aria-hidden="true" />
                      {debt.kind === "LOAN"
                        ? "Registrar cobro"
                        : debt.kind === "SAN"
                          ? "Poner la cuota"
                          : "Registrar pago"}
                    </button>
                  ))}
              </article>
            );
          })}
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar compromiso"
          description={`¿Eliminar "${pendingDelete.name}"? Los movimientos que ya registraste se quedan como estan.`}
          confirmLabel="Eliminar"
          danger
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            void remove(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}
    </>
  );
}
