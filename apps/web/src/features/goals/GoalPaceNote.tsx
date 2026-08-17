import { calculateGoalPace, formatDop, type Goal } from "@ahorra/domain";
import { AlertTriangle, CalendarX, TrendingUp } from "lucide-react";
import { today } from "../../lib/format";

/**
 * Traduce la fecha objetivo de una meta en la unica pregunta que importa:
 * cuanto hay que apartar cada mes para llegar.
 *
 * Sin fecha o ya cumplida no hay ritmo que calcular, y la tarjeta ya dice lo
 * que hace falta, asi que no se dibuja nada en vez de inventar un mensaje.
 */
export function GoalPaceNote({ goal }: { goal: Goal }) {
  const pace = calculateGoalPace(goal, today());

  if (pace.status === "COMPLETED" || pace.status === "NO_DATE") return null;

  if (pace.status === "OVERDUE") {
    return (
      <p className="goal-pace overdue">
        <CalendarX size={16} aria-hidden="true" />
        <span>
          La fecha ya paso y faltan <strong>{formatDop(pace.remainingCents)}</strong>. Ajusta la
          fecha o el monto.
        </span>
      </p>
    );
  }

  const behind = pace.status === "BEHIND";
  const meses = pace.monthsLeft === 1 ? "mes" : "meses";

  return (
    <p className={`goal-pace ${behind ? "behind" : "on-track"}`}>
      {behind ? (
        <AlertTriangle size={16} aria-hidden="true" />
      ) : (
        <TrendingUp size={16} aria-hidden="true" />
      )}
      <span>
        Aparta <strong>{formatDop(pace.monthlyTargetCents!)}</strong> al mes durante{" "}
        {pace.monthsLeft} {meses}
        {behind ? " para ponerte al dia." : " y llegas a tiempo."}
      </span>
    </p>
  );
}
