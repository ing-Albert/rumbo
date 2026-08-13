import { IllustratedEmptyState } from "../../components/IllustratedEmptyState";

export function EmptyState({
  onIncome,
  onExpense
}: {
  onIncome: () => void;
  onExpense: () => void;
}) {
  return (
    <IllustratedEmptyState
      eyebrow="Comienza con lo esencial"
      title="Todavia no podemos calcular tu disponible"
      description="Registra tu sueldo o primer ingreso y luego anade tus gastos. Veras como cambia el dinero que te queda."
      action={
        <>
          <button className="primary" onClick={onIncome}>
            Registrar ingreso
          </button>
          <button className="secondary" onClick={onExpense}>
            Registrar gasto
          </button>
        </>
      }
    />
  );
}
