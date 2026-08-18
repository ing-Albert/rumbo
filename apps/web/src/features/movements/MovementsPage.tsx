import { formatDop, type Movement, type MovementType } from "@ahorra/domain";
import { Pencil, SlidersHorizontal, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { IllustratedEmptyState } from "../../components/IllustratedEmptyState";
import { PageTitle } from "../../components/PageTitle";
import { StatusPill } from "../../components/StatusPill";
import { today } from "../../lib/format";
import { MovementBadges } from "./MovementBadges";
import { MovementCardList } from "./MovementCardList";

export function MovementsPage({
  movements,
  onAdd,
  onEdit,
  minDate,
  recurrencesSlot
}: {
  movements: Movement[];
  onAdd: (type: MovementType) => void;
  onEdit: (movement: Movement) => void;
  minDate?: string;
  /** Panel de recurrencias. Se recibe montado para no arrastrar hasta aqui
      el token ni el espacio, que esta pagina no necesita para nada mas. */
  recurrencesSlot?: ReactNode;
}) {
  const pageSize = 15;
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [period, setPeriod] = useState("ALL");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  function getDateBounds(): { from: string; to: string } | null {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (period === "TODAY") {
      const t = fmt(now);
      return { from: t, to: t };
    }
    if (period === "WEEK") {
      const dow = now.getDay();
      const mon = new Date(now);
      mon.setDate(now.getDate() - ((dow + 6) % 7));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { from: fmt(mon), to: fmt(sun) };
    }
    if (period === "MONTH") {
      const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from, to: fmt(last) };
    }
    if (period === "YEAR") {
      return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
    }
    if (period === "RANGE" && rangeFrom && rangeTo) {
      return { from: rangeFrom, to: rangeTo };
    }
    return null;
  }

  const activeFilterCount =
    (type === "ALL" ? 0 : 1) + (status === "ALL" ? 0 : 1) + (period === "ALL" ? 0 : 1);

  const bounds = getDateBounds();
  const filtered = movements.filter(
    (movement) =>
      (type === "ALL" || movement.type === type) &&
      (status === "ALL" || movement.status === status) &&
      `${movement.description} ${movement.category}`.toLowerCase().includes(query.toLowerCase()) &&
      (!bounds || (movement.effectiveDate >= bounds.from && movement.effectiveDate <= bounds.to))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const firstResult = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResult = Math.min(currentPage * pageSize, filtered.length);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => setPage(1), [query, type, status, period, rangeFrom, rangeTo]);
  useEffect(() => setPage((value) => Math.min(value, totalPages)), [totalPages]);

  const periodLabels: Record<string, string> = {
    ALL: "Todos",
    TODAY: "Hoy",
    WEEK: "Esta semana",
    MONTH: "Este mes",
    YEAR: "Este año",
    RANGE: "Rango"
  };

  return (
    <>
      <PageTitle
        eyebrow="Control del periodo"
        title="Movimientos"
        description="Consulta, filtra y corrige todo lo que registraste."
        action={
          <div className="button-row">
            <button className="secondary" onClick={() => onAdd("INCOME")}>
              <TrendingUp size={16} /> Ingreso
            </button>
            <button className="primary" onClick={() => onAdd("EXPENSE")}>
              <TrendingDown size={16} /> Gasto
            </button>
          </div>
        }
      />
      {movements.length === 0 ? (
        <IllustratedEmptyState
          eyebrow="Aun no hay movimientos"
          title="Registra tu primer movimiento"
          description="Anade un ingreso o un gasto para empezar a ver tu actividad aqui."
          action={
            <>
              <button className="primary" onClick={() => onAdd("INCOME")}>
                Registrar ingreso
              </button>
              <button className="secondary" onClick={() => onAdd("EXPENSE")}>
                Registrar gasto
              </button>
            </>
          }
        />
      ) : (
        <section className={`panel module-panel${filtersOpen ? " filters-open" : ""}`}>
          <div className="filters-row">
            <label>
              Buscar
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Descripcion o categoria"
              />
            </label>
            {/*
              En el telefono los filtros ocupaban 348px de una pantalla de 812:
              casi la mitad del alto antes de ver un solo movimiento. Se pliegan
              detras de este boton, que lleva la cuenta de los que estan puestos
              para que plegarlos no esconda el estado.
            */}
            <button
              type="button"
              className="filters-toggle"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              Filtros
              {activeFilterCount > 0 && <span className="filters-count">{activeFilterCount}</span>}
            </button>
            <label className="filters-advanced-field">
              Tipo
              <select value={type} onChange={(event) => setType(event.target.value)}>
                <option value="ALL">Todos</option>
                <option value="INCOME">Ingresos</option>
                <option value="EXPENSE">Gastos</option>
                <option value="CONTRIBUTION">Aportes</option>
              </select>
            </label>
            <label className="filters-advanced-field">
              Estado
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="ALL">Todos</option>
                <option value="REGISTERED">Registrados</option>
                <option value="SCHEDULED">Programados</option>
              </select>
            </label>
            <span className="result-count">{filtered.length} resultados</span>
          </div>
          <div className="period-filter-row">
            {["ALL", "TODAY", "WEEK", "MONTH", "YEAR", "RANGE"].map((p) => (
              <button
                key={p}
                className={`period-chip${period === p ? " active" : ""}`}
                onClick={() => {
                  setPeriod(p);
                  if (p !== "RANGE") {
                    setRangeFrom("");
                    setRangeTo("");
                  }
                }}
              >
                {periodLabels[p]}
              </button>
            ))}
            {period === "RANGE" && (
              <div className="period-range-inputs">
                <label>
                  Desde
                  <input
                    type="date"
                    value={rangeFrom}
                    min={minDate}
                    max={today()}
                    onChange={(e) => setRangeFrom(e.target.value)}
                  />
                </label>
                <label>
                  Hasta
                  <input
                    type="date"
                    value={rangeTo}
                    min={rangeFrom || minDate}
                    max={today()}
                    onChange={(e) => setRangeTo(e.target.value)}
                  />
                </label>
              </div>
            )}
          </div>
          {filtered.length === 0 ? (
            <div className="module-empty">
              <h2>No hay movimientos con estos filtros</h2>
              <button
                className="text-button"
                onClick={() => {
                  setQuery("");
                  setType("ALL");
                  setStatus("ALL");
                  setPeriod("ALL");
                }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <MovementCardList movements={paginated} onEdit={onEdit} />
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Descripcion</th>
                      <th>Categoria</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th className="number">Monto</th>
                      <th>
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((movement) => (
                      <tr key={movement.id}>
                        <td>{movement.effectiveDate.split("-").reverse().join("/")}</td>
                        <td>
                          <strong>{movement.description}</strong>
                          <MovementBadges movement={movement} />
                        </td>
                        <td>{movement.category}</td>
                        <td>
                          {movement.type === "INCOME"
                            ? "Ingreso"
                            : movement.type === "EXPENSE"
                              ? "Gasto"
                              : "Aporte"}
                        </td>
                        <td>
                          <StatusPill
                            tone={movement.status === "REGISTERED" ? "registered" : "scheduled"}
                            label={movement.status === "REGISTERED" ? "Registrado" : "Programado"}
                          />
                        </td>
                        <td
                          className={`number ${movement.type === "INCOME" ? "amount-income" : ""}`}
                        >
                          {movement.type === "INCOME" ? "+" : "-"}
                          {formatDop(movement.amountCents)}
                        </td>
                        <td>
                          {movement.type !== "CONTRIBUTION" && (
                            <button
                              className="table-action"
                              onClick={() => onEdit(movement)}
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <footer className="pagination">
                <p>
                  Mostrando{" "}
                  <strong>
                    {firstResult}-{lastResult}
                  </strong>{" "}
                  de <strong>{filtered.length}</strong>
                </p>
                <div>
                  <button
                    className="secondary"
                    disabled={currentPage === 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    Anterior
                  </button>
                  <span>
                    Pagina <strong>{currentPage}</strong> de {totalPages}
                  </span>
                  <button
                    className="secondary"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  >
                    Siguiente
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      )}
      {recurrencesSlot}
    </>
  );
}
