import { startTransition, useEffect, useState } from "react";
import { calculateSummary, type Movement, type Summary } from "@ahorra/domain";
import { apiFetch } from "../lib/api";
import { readJson } from "../lib/format";
import { pendingMovements } from "../lib/offline/outbox";

const emptySummary: Summary = {
  incomeCents: 0,
  expenseCents: 0,
  contributionCents: 0,
  availableBeforeSavingsCents: 0,
  availableAfterSavingsCents: 0,
  projectedAvailableCents: 0,
  expenseByCategory: []
};

export function useMonthlyData(
  accessToken: string | undefined,
  spaceId: string,
  month: string,
  refreshKey: number,
  userId: string | undefined
) {
  const [summary, setSummary] = useState(emptySummary);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSummary(emptySummary);
    setMovements([]);
  }, [userId]);

  useEffect(() => {
    if (!accessToken || !spaceId) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");

    Promise.all([
      apiFetch(
        accessToken,
        `/api/movements?spaceId=${encodeURIComponent(spaceId)}&month=${month}`,
        { signal: controller.signal }
      ).then((response) => readJson<Movement[]>(response)),
      userId ? pendingMovements(userId, spaceId, month) : Promise.resolve<Movement[]>([])
    ])
      .then(([serverMovements, queued]) => {
        // Lo pendiente se mezcla con lo del servidor y el resumen se recalcula
        // aqui en vez de pedirlo: el servidor no sabe nada de lo que aun no ha
        // recibido, y ver un gasto en la lista que no descuenta del disponible
        // haria dudar de todas las cifras.
        const all = [...queued, ...serverMovements];
        startTransition(() => {
          setMovements(all);
          setSummary(calculateSummary(all));
        });
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        // Sin servidor, al menos se muestra lo que hay guardado en el aparato.
        if (userId) {
          void pendingMovements(userId, spaceId, month).then((queued) => {
            startTransition(() => {
              setMovements(queued);
              setSummary(calculateSummary(queued));
            });
          });
        }
        setError(reason instanceof Error ? reason.message : "Ocurrio un error inesperado.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [accessToken, spaceId, month, refreshKey, userId]);

  return { summary, movements, loading, error };
}
