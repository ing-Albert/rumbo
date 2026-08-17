import { formatDop, type Balance } from "@ahorra/domain";
import { Landmark } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { MoneyInput } from "../../components/MoneyInput";
import { apiFetch } from "../../lib/api";

/**
 * Saldo con el que arranca a contar el espacio.
 *
 * Casi nadie empieza a usar la app el dia que abre su primera cuenta: ya tiene
 * dinero antes del primer movimiento registrado. Sin este punto de partida el
 * saldo acumulado siempre iria corto, y nadie confia en una cifra que sabe
 * equivocada.
 */
export function OpeningBalanceCard({
  accessToken,
  spaceId,
  spaceName,
  balance,
  onSaved
}: {
  accessToken: string;
  spaceId: string;
  spaceName: string;
  balance: Balance;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(balance.openingCents === 0 ? "" : String(balance.openingCents / 100));
  }, [balance.openingCents, spaceId]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await apiFetch(accessToken, `/api/spaces/${spaceId}/opening-balance`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openingBalanceCents: Math.round(Number(value || 0) * 100) })
    });
    setSaving(false);
    if (!response.ok) {
      setError("No pudimos guardar el saldo inicial.");
      return;
    }
    setEditing(false);
    onSaved();
  }

  return (
    <section className="panel settings-card">
      <header>
        <div>
          <p className="eyebrow">Punto de partida</p>
          <h2>Saldo inicial de {spaceName}</h2>
        </div>
        {!editing && (
          <button className="secondary" onClick={() => setEditing(true)}>
            <Landmark size={16} /> Ajustar
          </button>
        )}
      </header>
      {editing ? (
        <form onSubmit={(event) => void save(event)} className="opening-balance-form">
          <label>
            Dinero que ya tenias antes del primer movimiento
            <div className="compact-money">
              <span>RD$</span>
              <MoneyInput autoFocus value={value} onChange={setValue} placeholder="0" />
            </div>
          </label>
          {error && <p role="alert">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={() => setEditing(false)}>
              Cancelar
            </button>
            <button className="primary" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="settings-value">{formatDop(balance.openingCents)}</p>
          <p className="settings-hint">
            El saldo del espacio suma esta cantidad a todo lo que registres. Dejalo en cero si
            prefieres contar solo desde el primer movimiento.
          </p>
        </>
      )}
    </section>
  );
}
