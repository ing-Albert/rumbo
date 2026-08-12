import { useEffect, useState } from "react";
import type { BudgetLimit, ExpenseCategory, Goal } from "@ahorra/domain";
import { apiFetch } from "../lib/api";
import { readJson } from "../lib/format";

export function useModuleData(
  accessToken: string | undefined,
  spaceId: string,
  month: string,
  refreshKey: number,
  userId: string | undefined
) {
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [customCategories, setCustomCategories] = useState<ExpenseCategory[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setBudgetLimits([]);
    setGoals([]);
    setCustomCategories([]);
  }, [userId]);

  useEffect(() => {
    if (!accessToken || !spaceId) return;
    const controller = new AbortController();
    Promise.all([
      apiFetch(accessToken, `/api/budget?spaceId=${encodeURIComponent(spaceId)}&month=${month}`, {
        signal: controller.signal
      }).then((response) => readJson<BudgetLimit[]>(response)),
      apiFetch(accessToken, `/api/goals?spaceId=${encodeURIComponent(spaceId)}`, {
        signal: controller.signal
      }).then((response) => readJson<Goal[]>(response)),
      apiFetch(accessToken, `/api/categories?spaceId=${encodeURIComponent(spaceId)}`, {
        signal: controller.signal
      }).then((response) => readJson<ExpenseCategory[]>(response))
    ])
      .then(([limits, nextGoals, nextCategories]) => {
        setBudgetLimits(limits);
        setGoals(nextGoals);
        setCustomCategories(nextCategories);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError"))
          setError("No pudimos cargar todos los modulos.");
      });
    return () => controller.abort();
  }, [accessToken, spaceId, month, refreshKey]);

  return { budgetLimits, goals, customCategories, error };
}
