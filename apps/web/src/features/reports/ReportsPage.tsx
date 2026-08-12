import { formatDop, type Movement, type Summary } from "@ahorra/domain";
import { PageTitle } from "../../components/PageTitle";
import { CashFlowChart } from "../dashboard/CashFlowChart";
import { CategoryChart } from "../dashboard/CategoryChart";
import { monthLabel } from "../../lib/format";

export function ReportsPage({
  summary,
  movements,
  month
}: {
  summary: Summary;
  movements: Movement[];
  month: string;
}) {
  function exportCsv() {
    const rows = [
      ["fecha", "descripcion", "categoria", "tipo", "estado", "monto_DOP"],
      ...movements.map((movement) => [
        movement.effectiveDate,
        movement.description,
        movement.category,
        movement.type,
        movement.status,
        String(movement.amountCents / 100)
      ])
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const safeCell = /^[=+\-@]/.test(cell) ? `'${cell}` : cell;
            return `"${safeCell.replaceAll('"', '""')}"`;
          })
          .join(",")
      )
      .join("\n");
    const bom = "﻿";
    const url = URL.createObjectURL(new Blob([bom + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte_${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  const savingsRate =
    summary.incomeCents > 0
      ? Math.round((summary.contributionCents / summary.incomeCents) * 100)
      : null;
  return (
    <>
      <PageTitle
        eyebrow="Analisis"
        title="Reportes"
        description={`Resumen financiero de ${monthLabel(month)}.`}
        action={
          <button className="primary" onClick={exportCsv}>
            Exportar CSV
          </button>
        }
      />
      <div className="report-kpis">
        <div>
          <span>Ingresos</span>
          <strong>{formatDop(summary.incomeCents)}</strong>
        </div>
        <div>
          <span>Gastos</span>
          <strong>{formatDop(summary.expenseCents)}</strong>
        </div>
        <div>
          <span>Ahorro</span>
          <strong>{formatDop(summary.contributionCents)}</strong>
        </div>
        <div>
          <span>Tasa de ahorro</span>
          <strong>{savingsRate === null ? "No calculable" : `${savingsRate}%`}</strong>
        </div>
      </div>
      <div className="reports-grid">
        <CashFlowChart summary={summary} />
        <CategoryChart summary={summary} />
        <section className="panel report-detail">
          <header>
            <div>
              <p className="eyebrow">Detalle</p>
              <h2>Datos del reporte</h2>
            </div>
          </header>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripcion</th>
                  <th>Categoria</th>
                  <th className="number">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{movement.effectiveDate}</td>
                    <td>{movement.description}</td>
                    <td>{movement.category}</td>
                    <td className="number">
                      {movement.type === "INCOME" ? "+" : "-"}
                      {formatDop(movement.amountCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
