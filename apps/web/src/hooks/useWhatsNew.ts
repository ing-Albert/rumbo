import { useEffect, useState } from "react";

const SHOW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const RELEASE_AT_MS = new Date("2026-08-12T00:00:00Z").getTime();
const STORAGE_PREFIX = "rumbo-whats-new-dismissed-";

/**
 * Shows the "what's new" panel to every signed-in user for a fixed window
 * after this update's release date, until they explicitly dismiss it
 * (persisted per-user in localStorage).
 */
export function useWhatsNew(user: { id: string } | null): {
  show: boolean;
  dismiss: () => void;
} {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!user) return;
    setDismissed(localStorage.getItem(STORAGE_PREFIX + user.id) === "1");
  }, [user]);

  const withinReleaseWindow = Date.now() - RELEASE_AT_MS < SHOW_WINDOW_MS;

  function dismiss() {
    if (user) localStorage.setItem(STORAGE_PREFIX + user.id, "1");
    setDismissed(true);
  }

  return { show: withinReleaseWindow && !dismissed, dismiss };
}
