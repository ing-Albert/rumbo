import { CheckCircle2, CircleDot, Clock, PauseCircle } from "lucide-react";

export type StatusPillTone = "registered" | "scheduled" | "active" | "paused" | "completed";

const ICONS: Record<StatusPillTone, typeof CheckCircle2> = {
  registered: CheckCircle2,
  scheduled: Clock,
  active: CircleDot,
  paused: PauseCircle,
  completed: CheckCircle2
};

export function StatusPill({ tone, label }: { tone: StatusPillTone; label: string }) {
  const Icon = ICONS[tone];
  return (
    <span className={`status-pill ${tone}`}>
      <Icon size={12} aria-hidden="true" />
      {label}
    </span>
  );
}
