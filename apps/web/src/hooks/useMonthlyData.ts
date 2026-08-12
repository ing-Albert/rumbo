import { startTransition, useEffect, useState } from "react";
import type { Movement, Summary } from "@ahorra/domain";
import { apiFetch } from "../lib/api";
import { readJson } from "../lib/format";

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
      apiFetch(accessToken, `/api/summary?spaceId=${encodeURIComponent(spaceId)}&month=${month}`, {
        signal: controller.signal
      }).then((response) => readJson<Summary>(response)),
      apiFetch(
        accessToken,
        `/api/movements?spaceId=${encodeURIComponent(spaceId)}&month=${month}`,
        { signal: controller.signal }
      ).then((response) => readJson<Movement[]>(response))
    ])
      .then(([nextSummary, nextMovements]) => {
        startTransition(() => {
          setSummary(nextSummary);
          setMovements(nextMovements);
        });
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(reason instanceof Error ? reason.message : "Ocurrio un error inesperado.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [accessToken, spaceId, month, refreshKey]);

  return { summary, movements, loading, error };
}
