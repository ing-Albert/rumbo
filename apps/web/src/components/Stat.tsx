import { formatDop } from "@ahorra/domain";

export function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`stat ${tone}`}>
      <span>{label}</span>
      <strong>{formatDop(value)}</strong>
    </div>
  );
}
