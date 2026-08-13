import { AlertTriangle } from "lucide-react";
import { useDialog } from "../hooks/useDialog";

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  onConfirm,
  onCancel
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useDialog<HTMLElement>(onCancel);

  return (
    <div
      className="dialog-backdrop confirm-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        {danger && (
          <span className="confirm-dialog-icon" aria-hidden="true">
            <AlertTriangle size={20} />
          </span>
        )}
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{description}</p>
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "primary confirm-danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
