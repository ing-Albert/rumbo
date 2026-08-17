import { useEffect, useState } from "react";
import type { Balance } from "@ahorra/domain";
import { apiFetch } from "../lib/api";
import { readJson } from "../lib/format";

const EMPTY: Balance = {
  openingCents: 0,
  incomeCents: 0,
  expenseCents: 0,
  contributionCents: 0,
  totalCents: 0,
  earmarkedCents: 0,
  freeCents: 0
};

/**
 * Saldo acumulado del espacio, de toda su historia.
 *
 * No depende del mes elegido a proposito: el saldo responde "cuanto tengo",
 * que no cambia por mirar un periodo u otro. El resto del panel si es mensual.
 */
export function useBalance(
  accessToken: string | undefined,
  spaceId: string,
  refreshKey: number,
  userId: string | undefined
) {
  const [balance, setBalance] = useState<Balance>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => setBalance(EMPTY), [userId]);

  useEffect(() => {
    if (!accessToken || !spaceId) return;
    const controller = new AbortController();
    setLoading(true);
    apiFetch(accessToken, `/api/balance?spaceId=${encodeURIComponent(spaceId)}`, {
      signal: controller.signal
    })
      .then((response) => readJson<Balance>(response))
      .then((next) => {
        setBalance(next);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setLoading(false);
      });
    return () => controller.abort();
  }, [accessToken, spaceId, refreshKey]);

  return { balance, loading };
}
