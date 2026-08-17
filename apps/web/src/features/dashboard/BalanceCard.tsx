import { formatDop, type Balance } from "@ahorra/domain";
import { Landmark, Lock, Wallet } from "lucide-react";

/**
 * Cuanto dinero hay en el espacio, contando toda su historia.
 *
 * Es deliberadamente distinto del "disponible" del mes que encabeza el panel:
 * ese responde "que paso este periodo" y este "cuanto tengo". Confundirlos es
 * lo que hacia que el sobrante de enero se evaporara al llegar febrero.
 */
export function BalanceCard({ balance }: { balance: Balance }) {
  const negative = balance.totalCents < 0;

  return (
    <section className="panel balance-card" aria-labelledby="balance-title">
      <header>
        <div>
          <p className="eyebrow">Acumulado</p>
          <h2 id="balance-title">Saldo del espacio</h2>
        </div>
      </header>
      <div className="balance-total">
        <span className="balance-icon" aria-hidden="true">
          <Landmark size={20} />
        </span>
        <strong className={negative ? "danger-text" : ""}>{formatDop(balance.totalCents)}</strong>
      </div>
      <div className="balance-split">
        <div>
          <span>
            <Lock size={14} aria-hidden="true" /> Apartado en metas
          </span>
          <strong>{formatDop(balance.earmarkedCents)}</strong>
        </div>
        <div>
          <span>
            <Wallet size={14} aria-hidden="true" /> Libre
          </span>
          <strong className={balance.freeCents < 0 ? "danger-text" : ""}>
            {formatDop(balance.freeCents)}
          </strong>
        </div>
      </div>
      {balance.openingCents !== 0 && (
        <p className="balance-note">
          Incluye {formatDop(balance.openingCents)} de saldo inicial. Se ajusta en Configuracion.
        </p>
      )}
    </section>
  );
}
