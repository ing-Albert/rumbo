/**
 * Recordatorios locales.
 *
 * Los avisa el propio aparato con la API de Notification, sin servidor de por
 * medio. Las notificaciones push necesitarian cuentas de Firebase (Android) y
 * APNs (iOS), que solo puede crear el dueno del proyecto; esto cubre el caso
 * util —acordarse de anotar los gastos del dia— sin depender de nadie.
 *
 * La contrapartida honesta: solo suenan mientras la pestana o la app siguen
 * abiertas. Un recordatorio diario de verdad, con la app cerrada, si necesita
 * push.
 */

const STORAGE_KEY = "rumbo-reminder";

export interface ReminderSettings {
  enabled: boolean;
  /** Hora local en formato HH:MM. */
  time: string;
}

export const DEFAULT_REMINDER: ReminderSettings = { enabled: false, time: "20:00" };

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permission(): NotificationPermission {
  return notificationsSupported() ? Notification.permission : "denied";
}

export function readReminder(userId: string): ReminderSettings {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${userId}`);
    return raw
      ? { ...DEFAULT_REMINDER, ...(JSON.parse(raw) as ReminderSettings) }
      : DEFAULT_REMINDER;
  } catch {
    return DEFAULT_REMINDER;
  }
}

export function writeReminder(userId: string, settings: ReminderSettings): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}-${userId}`, JSON.stringify(settings));
  } catch {
    // Sin almacenamiento el recordatorio no sobrevive a la recarga, pero la app
    // sigue funcionando: no vale la pena romper nada por esto.
  }
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

/** Milisegundos que faltan para la proxima vez que sean las `time` de hoy o de manana. */
export function millisecondsUntil(time: string, from = new Date()): number {
  const [hours, minutes] = time.split(":").map(Number);
  const target = new Date(from);
  target.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  if (target.getTime() <= from.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime() - from.getTime();
}

export function showReminder(pendingCount: number): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  new Notification("Rumbo", {
    body:
      pendingCount > 0
        ? `Tienes ${pendingCount} ${pendingCount === 1 ? "movimiento" : "movimientos"} sin subir. Abre la app para sincronizar.`
        : "Un minuto para anotar lo que gastaste hoy.",
    icon: "/apple-touch-icon.png",
    tag: "rumbo-daily-reminder"
  });
}
