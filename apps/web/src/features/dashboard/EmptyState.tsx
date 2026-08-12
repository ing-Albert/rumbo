export function EmptyState({
  onIncome,
  onExpense
}: {
  onIncome: () => void;
  onExpense: () => void;
}) {
  return (
    <section className="empty-state">
      <div className="empty-illustration" aria-hidden="true">
        <span>RD$</span>
        <i />
      </div>
      <div>
        <p className="eyebrow">Comienza con lo esencial</p>
        <h2>Todavia no podemos calcular tu disponible</h2>
        <p>
          Registra tu sueldo o primer ingreso y luego anade tus gastos. Veras como cambia el dinero
          que te queda.
        </p>
        <div className="button-row">
          <button className="primary" onClick={onIncome}>
            Registrar ingreso
          </button>
          <button className="secondary" onClick={onExpense}>
            Registrar gasto
          </button>
        </div>
      </div>
    </section>
  );
}
