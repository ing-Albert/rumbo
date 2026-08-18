import { formatDop, type Debt, type DebtProgress } from "@ahorra/domain";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

/**
 * El estado de un san contado como lo cuenta quien esta dentro.
 *
 * Lo unico que de verdad importa es en que lado de la rueda se esta: antes del
 * turno se le presta al grupo, despues se le devuelve. Una barra de progreso
 * sola no dice eso, y es la diferencia entre "voy bien" y "aun me toca poner".
 */
export function SanProgress({ debt, progress }: { debt: Debt; progress: DebtProgress }) {
  const roundsLeft = (progress.roundsTotal ?? 0) - (progress.roundsPaid ?? 0);
  const lending = !progress.turnReached;

  return (
    <div className="san-progress">
      <p className="debt-amounts">
        Ronda <strong>{Math.min(progress.roundsPaid ?? 0, progress.roundsTotal ?? 0)}</strong> de{" "}
        {progress.roundsTotal} · cobras {formatDop(progress.potCents ?? 0)} en la{" "}
        {debt.turnPosition}
      </p>

      <div
        className="san-wheel"
        role="img"
        aria-label={`Turno ${debt.turnPosition} de ${debt.members}`}
      >
        {Array.from({ length: progress.roundsTotal ?? 0 }, (_, index) => {
          const round = index + 1;
          const paid = round <= (progress.roundsPaid ?? 0);
          const mine = round === debt.turnPosition;
          return (
            <span
              key={round}
              className={`san-round ${paid ? "paid" : ""} ${mine ? "mine" : ""}`}
              title={mine ? "Tu turno de cobrar" : `Ronda ${round}`}
            />
          );
        })}
      </div>

      <p className={`san-net ${lending ? "lending" : "owing"}`}>
        {lending ? (
          <ArrowUpRight size={16} aria-hidden="true" />
        ) : (
          <ArrowDownLeft size={16} aria-hidden="true" />
        )}
        <span>
          {lending ? (
            <>
              Has puesto <strong>{formatDop(progress.netCents ?? 0)}</strong> y todavia no cobras.
            </>
          ) : (
            <>
              Ya cobraste. Te falta devolver{" "}
              <strong>{formatDop(Math.abs(progress.netCents ?? 0))}</strong>.
            </>
          )}
        </span>
      </p>

      {roundsLeft > 0 && (
        <p className="debt-remaining">
          Quedan {roundsLeft} {roundsLeft === 1 ? "cuota" : "cuotas"} de{" "}
          {formatDop(debt.installmentCents)}
        </p>
      )}
    </div>
  );
}
