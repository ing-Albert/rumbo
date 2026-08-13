import { formatDop, type Movement, type Summary } from "@ahorra/domain";
import { Sparkline } from "../../components/Sparkline";

function dailyCumulativeSeries(movements: Movement[]): number[] {
  const dailyNet = new Map<string, number>();
  for (const movement of movements) {
    if (movement.status !== "REGISTERED") continue;
    const sign = movement.type === "INCOME" ? 1 : -1;
    dailyNet.set(
      movement.effectiveDate,
      (dailyNet.get(movement.effectiveDate) ?? 0) + sign * movement.amountCents
    );
  }
  const days = [...dailyNet.keys()].sort();
  let cumulative = 0;
  return days.map((day) => (cumulative += dailyNet.get(day)!));
}

export function Projection({ summary, movements }: { summary: Summary; movements: Movement[] }) {
  const changed = summary.projectedAvailableCents !== summary.availableAfterSavingsCents;
  const series = dailyCumulativeSeries(movements);

  return (
    <section className="panel projection-panel">
      <p className="eyebrow">Mirada al cierre</p>
      <h2>{formatDop(summary.projectedAvailableCents)}</h2>
      <p>
        {changed
          ? "Disponible proyectado al incluir movimientos programados."
          : "Agrega movimientos programados para anticipar como cerrara el periodo."}
      </p>
      {series.length >= 2 ? (
        <div className="projection-sparkline">
          <Sparkline values={series} />
        </div>
      ) : (
        <div className="projection-line">
          <span />
          <i />
        </div>
      )}
      <small>Registrado ahora</small>
      <small>Proyeccion</small>
    </section>
  );
}
