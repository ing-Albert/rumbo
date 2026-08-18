import type { Movement } from "@ahorra/domain";
import { CloudOff, Paperclip, Repeat } from "lucide-react";
import { isPendingMovement } from "../../lib/offline/outbox";

/**
 * Las marcas de un movimiento: sin subir, con recibo, generado por una regla.
 *
 * En movil van sin texto. Tres pastillas con palabra no caben junto a una
 * descripcion en 375px, y lo que se necesita ahi es notar que el movimiento
 * tiene algo distinto, no leer que es; el titulo lo dice al tocarlo.
 */
export function MovementBadges({
  movement,
  compact = false
}: {
  movement: Movement;
  compact?: boolean;
}) {
  const badges = [
    isPendingMovement(movement) && {
      key: "pending",
      Icon: CloudOff,
      label: "Sin subir",
      title: "Aun no se ha subido",
      className: "pending"
    },
    movement.receiptPath && {
      key: "receipt",
      Icon: Paperclip,
      label: "Recibo",
      title: "Tiene foto del recibo",
      className: ""
    },
    movement.recurringMovementId && {
      key: "recurring",
      Icon: Repeat,
      label: "Recurrente",
      title: "Generado por una recurrencia",
      className: ""
    }
  ].filter(Boolean) as Array<{
    key: string;
    Icon: typeof CloudOff;
    label: string;
    title: string;
    className: string;
  }>;

  if (badges.length === 0) return null;

  return (
    <>
      {badges.map(({ key, Icon, label, title, className }) => (
        <span
          key={key}
          className={`recurrence-badge ${className}${compact ? " icon-only" : ""}`}
          title={title}
          aria-label={compact ? label : undefined}
        >
          <Icon size={12} aria-hidden="true" />
          {!compact && label}
        </span>
      ))}
    </>
  );
}
