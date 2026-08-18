import { Bell, BellOff } from "lucide-react";
import { useState } from "react";
import {
  notificationsSupported,
  permission,
  requestPermission,
  showReminder,
  type ReminderSettings
} from "../../lib/notifications";

/**
 * Recordatorio diario para anotar los gastos.
 *
 * El boton de prueba no es un adorno: una notificacion que se programa para
 * dentro de doce horas es imposible de comprobar de otra forma, y sin poder
 * comprobarla nadie la deja activada.
 */
export function ReminderCard({
  settings,
  onChange,
  initialPermission
}: {
  settings: ReminderSettings;
  onChange: (next: ReminderSettings) => void;
  /**
   * Permiso de partida. Solo lo pasa la pantalla de Novedades, para mostrar la
   * tarjeta como se ve cuando funciona; si el navegador que mira las novedades
   * tiene los avisos bloqueados, la vista previa ensenaria un error en vez de
   * la funcion.
   */
  initialPermission?: NotificationPermission;
}) {
  const [state, setState] = useState(initialPermission ?? permission());

  if (!notificationsSupported()) {
    return (
      <section className="panel settings-card">
        <p className="eyebrow">Recordatorios</p>
        <h2>
          <BellOff size={20} /> No disponibles aqui
        </h2>
        <p className="settings-hint">
          Este navegador no permite notificaciones. En la app de Android si funcionan.
        </p>
      </section>
    );
  }

  async function enable() {
    const result = await requestPermission();
    setState(result);
    if (result === "granted") onChange({ ...settings, enabled: true });
  }

  return (
    <section className="panel settings-card">
      <header>
        <div>
          <p className="eyebrow">Recordatorios</p>
          <h2>Aviso diario</h2>
        </div>
      </header>

      {state === "denied" ? (
        <p className="settings-hint">
          Bloqueaste las notificaciones para Rumbo. Para reactivarlas hay que permitirlas desde los
          ajustes del navegador o del telefono.
        </p>
      ) : (
        <>
          <label className="reminder-toggle">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => {
                if (event.target.checked && state !== "granted") void enable();
                else onChange({ ...settings, enabled: event.target.checked });
              }}
            />
            <span>Recordarme anotar mis gastos</span>
          </label>

          {settings.enabled && (
            <>
              <label className="reminder-time">
                A que hora
                <input
                  type="time"
                  value={settings.time}
                  onChange={(event) => onChange({ ...settings, time: event.target.value })}
                />
              </label>
              <button
                type="button"
                className="secondary"
                onClick={() => showReminder(0)}
                disabled={state !== "granted"}
              >
                <Bell size={16} /> Probar ahora
              </button>
            </>
          )}

          <p className="settings-hint">
            El aviso lo lanza este aparato, no un servidor, asi que solo suena mientras Rumbo sigue
            abierta. Para que avise con la app cerrada haria falta configurar notificaciones push.
          </p>
        </>
      )}
    </section>
  );
}
