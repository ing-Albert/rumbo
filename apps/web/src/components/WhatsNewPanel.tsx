import { Sparkles } from "lucide-react";
import { useDialog } from "../hooks/useDialog";

const UPDATES = [
  "Iconos nuevos en toda la app para reconocer todo de un vistazo.",
  "Tus metas ahora muestran el progreso en un anillo visual.",
  "El gráfico de flujo compara tu mes actual con el anterior.",
  "Los montos se formatean con comas mientras escribís.",
  "Diálogos más accesibles: ahora se cierran con la tecla Esc.",
  "Retoques de color, tipografía y espaciado en toda la app."
];

export function WhatsNewPanel({ onClose }: { onClose: () => void }) {
  const dialogRef = useDialog<HTMLElement>(onClose);

  return (
    <div
      className="dialog-backdrop confirm-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="whats-new-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
      >
        <span className="whats-new-icon" aria-hidden="true">
          <Sparkles size={22} />
        </span>
        <h2 id="whats-new-title">Novedades en Rumbo</h2>
        <p className="muted">Mejoramos varias cosas recientemente:</p>
        <ul className="whats-new-list">
          {UPDATES.map((update) => (
            <li key={update}>{update}</li>
          ))}
        </ul>
        <button className="primary full-button" onClick={onClose}>
          Entendido
        </button>
      </section>
    </div>
  );
}
