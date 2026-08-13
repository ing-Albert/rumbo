import { useEffect, useState } from "react";

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const STORAGE_PREFIX = "rumbo-whats-new-dismissed-";

/**
 * Shows the "what's new" panel to accounts created in the last 2 days,
 * until they explicitly dismiss it (persisted per-user in localStorage).
 */
export function useWhatsNew(user: { id: string; created_at?: string } | null): {
  show: boolean;
  dismiss: () => void;
} {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!user) return;
    setDismissed(localStorage.getItem(STORAGE_PREFIX + user.id) === "1");
  }, [user]);

  const isNewAccount =
    !!user?.created_at && Date.now() - new Date(user.created_at).getTime() < TWO_DAYS_MS;

  function dismiss() {
    if (user) localStorage.setItem(STORAGE_PREFIX + user.id, "1");
    setDismissed(true);
  }

  return { show: isNewAccount && !dismissed, dismiss };
}
