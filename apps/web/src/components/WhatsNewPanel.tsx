import { Sparkles } from "lucide-react";
import { navigate } from "../app/router";
import { LATEST_RELEASE } from "../features/whatsnew/releases";
import { useDialog } from "../hooks/useDialog";

/**
 * Aviso de novedades, los primeros dias tras publicar una version.
 *
 * Lista solo los titulos y manda al historial para el detalle: nadie lee ocho
 * parrafos en un cartel que le aparecio encima de lo que estaba haciendo.
 */
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
        <p className="muted">
          Version {LATEST_RELEASE.version} · {LATEST_RELEASE.title}
        </p>
        <ul className="whats-new-list">
          {LATEST_RELEASE.entries.map((entry) => (
            <li key={entry.title}>{entry.title}</li>
          ))}
        </ul>
        <div className="whats-new-actions">
          <button
            className="secondary"
            onClick={() => {
              onClose();
              navigate("/novedades");
            }}
          >
            Ver el detalle
          </button>
          <button className="primary" onClick={onClose}>
            Entendido
          </button>
        </div>
      </section>
    </div>
  );
}
