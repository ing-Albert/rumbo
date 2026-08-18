import { formatDop, type Movement } from "@ahorra/domain";
import { Gem, Pencil, TrendingDown, TrendingUp } from "lucide-react";
import { MovementBadges } from "./MovementBadges";

const TYPE_ICONS = {
  INCOME: TrendingUp,
  EXPENSE: TrendingDown,
  CONTRIBUTION: Gem
} as const;

function shortDate(date: string): string {
  return new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "short" }).format(
    new Date(`${date}T12:00:00`)
  );
}

/**
 * Los movimientos en movil.
 *
 * Sustituye a la tabla, que con siete columnas medida 829px dentro de un
 * ancho de 302: habia que arrastrar de lado para llegar al monto, que es lo
 * primero que uno busca. Aqui cada movimiento ocupa una fila con lo esencial
 * a la vista y el resto en una linea de contexto debajo.
 */
export function MovementCardList({
  movements,
  onEdit
}: {
  movements: Movement[];
  onEdit: (movement: Movement) => void;
}) {
  return (
    <div className="movement-cards">
      {movements.map((movement) => {
        const Icon = TYPE_ICONS[movement.type];
        const income = movement.type === "INCOME";
        return (
          <article className="movement-card" key={movement.id}>
            <span className={`movement-icon ${movement.type.toLowerCase()}`}>
              <Icon size={16} />
            </span>

            <div className="movement-card-main">
              <strong>{movement.description}</strong>
              <span className="movement-card-meta">
                {movement.category} · {shortDate(movement.effectiveDate)}
                {movement.status === "SCHEDULED" && " · Programado"}
              </span>
            </div>

            <div className="movement-card-side">
              <strong className={income ? "amount-income" : ""}>
                {income ? "+" : "−"}
                {formatDop(movement.amountCents)}
              </strong>
              <div className="movement-card-tags">
                <MovementBadges movement={movement} compact />
                {movement.type !== "CONTRIBUTION" && (
                  <button
                    className="table-action"
                    onClick={() => onEdit(movement)}
                    title="Editar"
                    aria-label={`Editar ${movement.description}`}
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
