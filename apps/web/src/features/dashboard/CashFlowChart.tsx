import { formatDop, type Summary } from "@ahorra/domain";
import { navigate } from "../../app/router";

export function CashFlowChart({ summary }: { summary: Summary }) {
  const values = [summary.incomeCents, summary.expenseCents, summary.contributionCents];
  const max = Math.max(...values, 1);
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
      <div
        className="bars"
        role="img"
        aria-label={`Ingresos ${formatDop(values[0]!)}, gastos ${formatDop(values[1]!)}, ahorro ${formatDop(values[2]!)}`}
      >
        {values.map((value, index) => (
          <div className="bar-item" key={index}>
            <strong>{formatDop(value)}</strong>
            <div className="bar-track">
              <div
                className={`bar-fill bar-${index}`}
                style={{ height: `${Math.max((value / max) * 100, value ? 8 : 0)}%` }}
              />
            </div>
            <span>{["Ingresos", "Gastos", "Ahorro"][index]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
