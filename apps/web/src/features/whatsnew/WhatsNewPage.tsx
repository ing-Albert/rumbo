import { MapPin, Sparkles } from "lucide-react";
import { useState } from "react";
import { PageTitle } from "../../components/PageTitle";
import { PreviewFrame } from "./PreviewFrame";
import { RELEASES } from "./releases";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-DO", { dateStyle: "long" }).format(
    new Date(`${date}T12:00:00`)
  );
}

/**
 * Historial de novedades.
 *
 * La version mas reciente viene abierta y las anteriores plegadas: lo que casi
 * siempre se busca aqui es "que cambio ahora", no la historia entera.
 */
export function WhatsNewPage() {
  const [openVersion, setOpenVersion] = useState(RELEASES[0]?.version ?? "");

  return (
    <>
      <PageTitle
        eyebrow="Historial"
        title="Novedades"
        description="Lo que se agrego o cambio en cada version de Rumbo."
      />

      <div className="release-list">
        {RELEASES.map((release) => {
          const open = openVersion === release.version;
          return (
            <section className="panel release" key={release.version}>
              <button
                className="release-header"
                aria-expanded={open}
                onClick={() => setOpenVersion(open ? "" : release.version)}
              >
                <span className="release-badge" aria-hidden="true">
                  <Sparkles size={16} />
                </span>
                <span className="release-heading">
                  <span className="release-meta">
                    Version {release.version} · {formatDate(release.date)}
                  </span>
                  <strong>{release.title}</strong>
                  <span className="release-summary">{release.summary}</span>
                </span>
                <span className="release-toggle">{open ? "Ocultar" : "Ver detalle"}</span>
              </button>

              {open && (
                <div className="release-entries">
                  {release.entries.map((entry) => (
                    <article className="release-entry" key={entry.title}>
                      {entry.Preview && (
                        <PreviewFrame>
                          <entry.Preview />
                        </PreviewFrame>
                      )}
                      <div>
                        <h3>{entry.title}</h3>
                        <p>{entry.description}</p>
                        {entry.where && (
                          <p className="release-where">
                            <MapPin size={14} aria-hidden="true" /> {entry.where}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
