import { formatDop, type Summary } from "@ahorra/domain";
import { navigate } from "../../app/router";

export function CashFlowChart({
  summary,
  previousSummary
}: {
  summary: Summary;
  previousSummary?: Summary | null;
}) {
  const values = [summary.incomeCents, summary.expenseCents, summary.contributionCents];
  const previousValues = previousSummary
    ? [previousSummary.incomeCents, previousSummary.expenseCents, previousSummary.contributionCents]
    : null;
  const max = Math.max(...values, ...(previousValues ?? []), 1);
  const labels = ["Ingresos", "Gastos", "Ahorro"];

  return (
    <section className="panel cash-chart">
      <header>
        <div>
          <p className="eyebrow">Flujo del periodo</p>
          <h2>Lo que entra, sale y apartas</h2>
        </div>
        <button className="text-button" onClick={() => navigate("/reportes")}>
          Ver reporte
        </button>
      </header>
      {previousValues && (
        <p className="cash-chart-legend muted">
          <span className="legend-swatch" aria-hidden="true" /> Mes anterior como referencia
        </p>
      )}
      <div
        className="bars"
        role="img"
        aria-label={`Ingresos ${formatDop(values[0]!)}, gastos ${formatDop(values[1]!)}, ahorro ${formatDop(values[2]!)}`}
      >
        {values.map((value, index) => (
          <div className="bar-item" key={index}>
            <strong>{formatDop(value)}</strong>
            <div className="bar-track">
              {previousValues && (
                <div
                  className="bar-reference"
                  style={{ bottom: `${Math.min((previousValues[index]! / max) * 100, 100)}%` }}
                  title={`Mes anterior: ${formatDop(previousValues[index]!)}`}
                />
              )}
              <div
                className={`bar-fill bar-${index}`}
                style={{ height: `${Math.max((value / max) * 100, value ? 8 : 0)}%` }}
              />
            </div>
            <span>{labels[index]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
