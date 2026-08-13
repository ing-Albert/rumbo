import { formatDop } from "@ahorra/domain";

export function BalanceBridge({
  beforeSavingsCents,
  contributionCents,
  afterSavingsCents
}: {
  beforeSavingsCents: number;
  contributionCents: number;
  afterSavingsCents: number;
}) {
  const total = Math.max(beforeSavingsCents, 1);
  const afterPercent = Math.max(0, Math.min((afterSavingsCents / total) * 100, 100));
  const savingsPercent = Math.max(
    0,
    Math.min((contributionCents / total) * 100, 100 - afterPercent)
  );

  return (
    <div className="balance-bridge">
      <div
        className="balance-bridge-bar"
        role="img"
        aria-label="Distribucion del disponible antes de ahorro"
      >
        <span className="balance-bridge-after" style={{ width: `${afterPercent}%` }} />
        <span className="balance-bridge-savings" style={{ width: `${savingsPercent}%` }} />
      </div>
      <div className="balance-bridge-labels">
        <span>
          Antes de ahorro: <strong>{formatDop(beforeSavingsCents)}</strong>
        </span>
        <span>
          Ahorro separado: <strong>{formatDop(contributionCents)}</strong>
        </span>
      </div>
    </div>
  );
}
