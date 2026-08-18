import { useEffect, useState } from "react";
import type { BudgetLimit, Debt, ExpenseCategory, Goal, RecurringMovement } from "@ahorra/domain";
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
  const [recurrences, setRecurrences] = useState<RecurringMovement[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setBudgetLimits([]);
    setGoals([]);
    setCustomCategories([]);
    setRecurrences([]);
    setDebts([]);
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
      }).then((response) => readJson<ExpenseCategory[]>(response)),
      apiFetch(accessToken, `/api/recurrences?spaceId=${encodeURIComponent(spaceId)}`, {
        signal: controller.signal
      }).then((response) => readJson<RecurringMovement[]>(response)),
      apiFetch(accessToken, `/api/debts?spaceId=${encodeURIComponent(spaceId)}`, {
        signal: controller.signal
      }).then((response) => readJson<Debt[]>(response))
    ])
      .then(([limits, nextGoals, nextCategories, nextRecurrences, nextDebts]) => {
        setBudgetLimits(limits);
        setGoals(nextGoals);
        setCustomCategories(nextCategories);
        setRecurrences(nextRecurrences);
        setDebts(nextDebts);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError"))
          setError("No pudimos cargar todos los modulos.");
      });
    return () => controller.abort();
  }, [accessToken, spaceId, month, refreshKey]);

  return { budgetLimits, goals, customCategories, recurrences, debts, error };
}
