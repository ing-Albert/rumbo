import { formatDop, type Summary } from "@ahorra/domain";

export function Projection({ summary }: { summary: Summary }) {
  const changed = summary.projectedAvailableCents !== summary.availableAfterSavingsCents;
  return (
    <section className="panel projection-panel">
      <p className="eyebrow">Mirada al cierre</p>
      <h2>{formatDop(summary.projectedAvailableCents)}</h2>
      <p>
        {changed
          ? "Disponible proyectado al incluir movimientos programados."
          : "Agrega movimientos programados para anticipar como cerrara el periodo."}
      </p>
      <div className="projection-line">
        <span />
        <i />
      </div>
      <small>Registrado ahora</small>
      <small>Proyeccion</small>
    </section>
  );
}
