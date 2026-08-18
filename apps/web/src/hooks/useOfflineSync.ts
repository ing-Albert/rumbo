import { useCallback, useEffect, useState } from "react";
import { flushOutbox, pendingCount } from "../lib/offline/outbox";

/**
 * Sube lo que quedo pendiente en cuanto vuelve la conexion.
 *
 * Se engancha al evento `online` y a la vuelta a primer plano: en un telefono,
 * lo normal es que la app este cerrada justo cuando la senal regresa, asi que
 * esperar solo al evento dejaria los gastos ahi guardados sin subir.
 */
export function useOfflineSync(
  userId: string | undefined,
  accessToken: string | undefined,
  onSynced: () => void
) {
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(() => navigator.onLine);

  const refreshCount = useCallback(async () => {
    if (!userId) return setPending(0);
    setPending(await pendingCount(userId));
  }, [userId]);

  const sync = useCallback(async () => {
    if (!userId || !accessToken || !navigator.onLine) return;
    const result = await flushOutbox(userId, accessToken);
    await refreshCount();
    // Solo se recarga si de verdad subio algo, para no relanzar peticiones
    // cada vez que el sistema avisa de un cambio de red sin cambio real.
    if (result.sent > 0) onSynced();
  }, [userId, accessToken, onSynced, refreshCount]);

  useEffect(() => {
    void refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    if (!userId || !accessToken) return;

    function goOnline() {
      setOnline(true);
      void sync();
    }
    function goOffline() {
      setOnline(false);
    }
    function onVisible() {
      if (document.visibilityState === "visible") void sync();
    }

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    document.addEventListener("visibilitychange", onVisible);
    void sync();

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, accessToken, sync]);

  return { pending, online, sync, refreshCount };
}
