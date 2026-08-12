import { formatDop, type Movement } from "@ahorra/domain";
import { Gem, TrendingDown, TrendingUp } from "lucide-react";

export function RecentMovements({
  movements,
  onEdit,
  onViewAll
}: {
  movements: Movement[];
  onEdit: (movement: Movement) => void;
  onViewAll: () => void;
}) {
  return (
    <section id="movements" className="panel movements-panel">
      <header>
        <div>
          <p className="eyebrow">Actividad reciente</p>
          <h2>Tus ultimos movimientos</h2>
        </div>
        <button className="text-button" onClick={onViewAll}>
          Ver todos
        </button>
      </header>
      <div className="movement-list">
        {movements.slice(0, 6).map((movement) => (
          <article key={movement.id} className="movement-row">
            <span className={`movement-icon ${movement.type.toLowerCase()}`}>
              {movement.type === "INCOME" ? (
                <TrendingUp size={16} />
              ) : movement.type === "EXPENSE" ? (
                <TrendingDown size={16} />
              ) : (
                <Gem size={16} />
              )}
            </span>
            <div>
              <strong>{movement.description}</strong>
              <span>
                {movement.category} ·{" "}
                {new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "short" }).format(
                  new Date(`${movement.effectiveDate}T12:00:00`)
                )}
              </span>
            </div>
            <div className="movement-actions">
              <strong className={movement.type === "INCOME" ? "amount-income" : ""}>
                {movement.type === "INCOME" ? "+" : "−"}
                {formatDop(movement.amountCents)}
              </strong>
              {movement.type !== "CONTRIBUTION" && (
                <button
                  aria-label={`Editar ${movement.description}`}
                  onClick={() => onEdit(movement)}
                >
                  Editar
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
