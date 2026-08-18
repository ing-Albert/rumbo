import { formatDop, summarizeDebts, type Debt } from "@ahorra/domain";
import { ArrowDownLeft, ArrowUpRight, Users } from "lucide-react";

/**
 * Las tres cifras que responde esta pantalla de un vistazo.
 *
 * "Cuanto debo" es la primera pregunta de quien entra aqui, y antes habia que
 * sumarla a ojo recorriendo tarjeta por tarjeta. Cada cifra lleva la flecha de
 * su direccion: el dinero sale, entra, o da vueltas dentro del san.
 */
export function DebtsOverviewStrip({ debts }: { debts: Debt[] }) {
  const overview = summarizeDebts(debts);
  if (overview.activeCount === 0) return null;

  const figures = [
    {
      key: "debt",
      label: "Debes",
      amount: overview.owedByMeCents,
      Icon: ArrowUpRight
    },
    {
      key: "loan",
      label: "Te deben",
      amount: overview.owedToMeCents,
      Icon: ArrowDownLeft
    },
    {
      key: "san",
      label: "Falta en sanes",
      amount: overview.sanPendingCents,
      Icon: Users
    }
  ].filter((figure) => figure.amount > 0);

  if (figures.length === 0) return null;

  return (
    <section className="debts-overview" aria-label="Resumen de compromisos">
      {figures.map(({ key, label, amount, Icon }) => (
        <div className={`debts-overview-figure ${key}`} key={key}>
          <span className="debts-overview-label">
            <Icon size={14} aria-hidden="true" /> {label}
          </span>
          <strong>{formatDop(amount)}</strong>
        </div>
      ))}
    </section>
  );
}
