import { useEffect, useState } from "react";
import type { Summary } from "@ahorra/domain";
import { apiFetch } from "../lib/api";
import { readJson } from "../lib/format";

function previousMonth(month: string): string {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(year!, value! - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Fetches the prior month's summary so charts can show a light reference. */
export function usePreviousMonthSummary(
  accessToken: string | undefined,
  spaceId: string,
  month: string
): Summary | null {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    setSummary(null);
    if (!accessToken || !spaceId) return;
    const controller = new AbortController();
    apiFetch(
      accessToken,
      `/api/summary?spaceId=${encodeURIComponent(spaceId)}&month=${previousMonth(month)}`,
      { signal: controller.signal }
    )
      .then((response) => readJson<Summary>(response))
      .then((result) => setSummary(result))
      .catch(() => {});
    return () => controller.abort();
  }, [accessToken, spaceId, month]);

  return summary;
}
