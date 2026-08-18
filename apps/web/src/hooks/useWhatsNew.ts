import { useEffect, useState } from "react";
import { LATEST_RELEASE } from "../features/whatsnew/releases";

const SHOW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const STORAGE_PREFIX = "rumbo-whats-new-dismissed-";

/**
 * Muestra el aviso de novedades a todo el mundo durante los primeros dias tras
 * publicar una version, hasta que la persona lo cierre.
 *
 * La fecha sale de `LATEST_RELEASE`, no de una constante aparte: asi es
 * imposible actualizar el texto y olvidar la fecha, que dejaria el aviso sin
 * aparecer. Lo descartado se recuerda por version, para que la proxima vuelva
 * a salir aunque ya se hubiera cerrado la anterior.
 */
export function useWhatsNew(user: { id: string } | null): {
  show: boolean;
  dismiss: () => void;
} {
  const [dismissed, setDismissed] = useState(true);
  const storageKey = `${STORAGE_PREFIX}${LATEST_RELEASE.version}-`;

  useEffect(() => {
    if (!user) return;
    setDismissed(localStorage.getItem(storageKey + user.id) === "1");
  }, [user, storageKey]);

  const releaseAt = new Date(`${LATEST_RELEASE.date}T00:00:00Z`).getTime();
  const withinReleaseWindow = Date.now() - releaseAt < SHOW_WINDOW_MS;

  function dismiss() {
    if (user) localStorage.setItem(storageKey + user.id, "1");
    setDismissed(true);
  }

  return { show: withinReleaseWindow && !dismissed, dismiss };
}
