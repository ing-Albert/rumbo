import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_REMINDER,
  millisecondsUntil,
  readReminder,
  showReminder,
  writeReminder,
  type ReminderSettings
} from "../lib/notifications";

/**
 * Programa el recordatorio diario mientras la app este abierta.
 *
 * El temporizador se vuelve a armar despues de cada aviso, en vez de usar un
 * intervalo fijo: asi el cambio de horario o un aparato dormido no van
 * corriendo la hora poco a poco.
 */
export function useReminder(userId: string | undefined, pendingCount: number) {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDER);
  const timer = useRef<number | undefined>(undefined);
  // En una referencia y no en las dependencias: el numero de pendientes cambia
  // a menudo, y no es motivo para reprogramar la hora del aviso.
  const pending = useRef(pendingCount);
  pending.current = pendingCount;

  useEffect(() => {
    if (userId) setSettings(readReminder(userId));
  }, [userId]);

  const save = useCallback(
    (next: ReminderSettings) => {
      setSettings(next);
      if (userId) writeReminder(userId, next);
    },
    [userId]
  );

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!settings.enabled) return;

    function schedule() {
      timer.current = window.setTimeout(() => {
        showReminder(pending.current);
        schedule();
      }, millisecondsUntil(settings.time));
    }
    schedule();

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [settings.enabled, settings.time]);

  return { settings, save };
}
