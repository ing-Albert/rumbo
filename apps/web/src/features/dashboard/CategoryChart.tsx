import { formatDop, type Summary } from "@ahorra/domain";

export function CategoryChart({ summary }: { summary: Summary }) {
  const max = summary.expenseByCategory[0]?.amountCents ?? 1;
  const top = summary.expenseByCategory.slice(0, 5);
  const rest = summary.expenseByCategory.slice(5);
  const restTotal = rest.reduce((total, item) => total + item.amountCents, 0);
  return (
    <section className="panel category-chart">
      <header>
        <div>
          <p className="eyebrow">Gastos</p>
          <h2>En que se fue el dinero</h2>
        </div>
      </header>
      {summary.expenseByCategory.length === 0 ? (
        <p className="muted">Registra un gasto para ver tus categorias.</p>
      ) : (
        <div className="category-list">
          {top.map((item) => (
            <div className="category-row" key={item.category}>
              <div>
                <span>{item.category}</span>
                <strong>{formatDop(item.amountCents)}</strong>
              </div>
              <div className="horizontal-track">
                <span style={{ width: `${(item.amountCents / max) * 100}%` }} />
              </div>
            </div>
          ))}
          {rest.length > 0 && (
            <div className="category-row category-row-rest">
              <div>
                <span>Otras ({rest.length})</span>
                <strong>{formatDop(restTotal)}</strong>
              </div>
              <div className="horizontal-track">
                <span style={{ width: `${(restTotal / max) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
