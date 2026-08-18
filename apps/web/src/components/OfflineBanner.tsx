import { CloudOff, RefreshCw, WifiOff } from "lucide-react";

/**
 * Estado de lo registrado sin conexion.
 *
 * Se muestra solo cuando hay algo que decir: sin conexion, o con movimientos
 * esperando a subir. Un indicador permanente de "todo bien" es ruido, y ademas
 * ensena a ignorarlo justo cuando importa.
 */
export function OfflineBanner({
  online,
  pending,
  onSync
}: {
  online: boolean;
  pending: number;
  onSync: () => void;
}) {
  if (online && pending === 0) return null;

  return (
    <section className={`offline-banner ${online ? "pending" : "offline"}`} role="status">
      <div>
        <span aria-hidden="true">{online ? <CloudOff size={18} /> : <WifiOff size={18} />}</span>
        <div>
          <strong>
            {online
              ? `${pending} ${pending === 1 ? "movimiento sin subir" : "movimientos sin subir"}`
              : "Estas sin conexion"}
          </strong>
          <p>
            {online
              ? "Se subiran solos, o puedes intentarlo ahora."
              : pending > 0
                ? `Lo que registres se guarda en el telefono. Hay ${pending} esperando a subir.`
                : "Puedes seguir registrando gastos: se subiran cuando vuelva la señal."}
          </p>
        </div>
      </div>
      {online && pending > 0 && (
        <div className="button-row">
          <button className="secondary" onClick={onSync}>
            <RefreshCw size={16} /> Subir ahora
          </button>
        </div>
      )}
    </section>
  );
}
