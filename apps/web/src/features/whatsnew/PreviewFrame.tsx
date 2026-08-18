import { useEffect, useRef, useState, type ReactNode } from "react";

/** Ancho al que se dibuja la muestra antes de encogerla para que quepa. */
const REFERENCE_WIDTH = 760;

/**
 * Encoge una vista previa para que quepa sin deformarla.
 *
 * Los componentes se dibujan siempre a un ancho de referencia y luego se
 * escalan visualmente. Dejarlos adaptarse al hueco daria una imagen enganosa:
 * se apretarian y se solaparian de un modo que no ocurre en la app, donde
 * ocupan la pantalla entera. El escalado no reordena nada, solo lo hace mas
 * pequeno, asi que lo que se ve es la proporcion real.
 */
export function PreviewFrame({ children }: { children: ReactNode }) {
  const clip = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const clipElement = clip.current;
    const innerElement = inner.current;
    if (!clipElement || !innerElement) return;

    function measure() {
      // Se mide el hueco interior, ya sin el relleno del marco: medir el marco
      // entero daria de mas y la muestra se saldria por el lado derecho.
      const available = clipElement!.clientWidth;
      if (available === 0) return;
      const next = Math.min(1, available / REFERENCE_WIDTH);
      setScale(next);
      // La altura hay que fijarla a mano: `transform` no la cambia, y sin esto
      // quedaria un hueco en blanco debajo de cada muestra encogida.
      setHeight(innerElement!.scrollHeight * next);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(clipElement);
    observer.observe(innerElement);
    // Las fuentes cambian la altura al terminar de cargar, y con ellas el
    // recorte: sin esto la ultima fila de una muestra puede quedar cortada.
    void document.fonts?.ready.then(measure);
    measure();
    return () => observer.disconnect();
  }, []);

  return (
    <div className="release-preview" inert aria-hidden="true">
      <div className="release-preview-clip" ref={clip} style={{ height }}>
        <div
          ref={inner}
          className="release-preview-scale"
          style={{ width: REFERENCE_WIDTH, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
