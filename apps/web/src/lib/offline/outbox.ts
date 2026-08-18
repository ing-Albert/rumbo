import type { CreateMovement, Movement } from "@ahorra/domain";
import { apiFetch } from "../api";
import { offlineDatabase, type LocalMovement, type RumboOfflineDatabase } from "./database";

/**
 * Cola de lo registrado sin conexion.
 *
 * Solo cubre la creacion de movimientos, que es lo unico que de verdad se hace
 * con el telefono en la mano y sin senal: anotar un gasto en el momento. Editar
 * o borrar sin conexion abriria la puerta a conflictos (dos dispositivos
 * tocando la misma fila) y eso pide una estrategia de resolucion que no vale la
 * pena antes de que exista el problema.
 */

/** Marca de un id local, para distinguirlo del que asigna el servidor. */
const LOCAL_PREFIX = "local:";

export function isPendingMovement(movement: Movement): boolean {
  return movement.id.startsWith(LOCAL_PREFIX);
}

function toMovement(local: LocalMovement): Movement {
  return {
    id: local.id,
    spaceId: local.spaceId,
    type: local.type as Movement["type"],
    status: local.status as Movement["status"],
    amountCents: local.amountCents,
    effectiveDate: local.effectiveDate,
    description: local.description,
    category: local.category,
    createdAt: local.updatedAt,
    recurringMovementId: null,
    receiptPath: null
  };
}

/**
 * Guarda un movimiento para subirlo cuando vuelva la conexion y lo devuelve ya
 * formado, para que la pantalla lo muestre en el acto.
 */
export async function queueMovement(
  userId: string,
  input: CreateMovement,
  database: RumboOfflineDatabase = offlineDatabase
): Promise<Movement> {
  const id = `${LOCAL_PREFIX}${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const local: LocalMovement = {
    id,
    userId,
    spaceId: input.spaceId,
    categoryId: null,
    category: input.category,
    type: input.type,
    status: input.status,
    amountCents: input.amountCents,
    effectiveDate: input.effectiveDate,
    description: input.description,
    notes: null,
    version: 0,
    updatedAt: now,
    deletedAt: null,
    syncStatus: "PENDING"
  };

  await database.transaction("rw", database.movements, database.outbox, async () => {
    await database.movements.put(local);
    await database.outbox.put({
      id,
      userId,
      deviceId: "web",
      entityType: "MOVEMENT",
      entityId: id,
      operation: "CREATE",
      // Sin la foto: subirla necesita red igual, y guardarla aqui solo serviria
      // para inflar IndexedDB con una imagen que se puede volver a tomar.
      payload: { ...input, receiptPath: null },
      baseVersion: null,
      status: "PENDING",
      attempts: 0,
      createdAt: now,
      lastError: null
    });
  });

  return toMovement(local);
}

/**
 * Lo que espera para subirse, listo para mezclar con lo que vino del servidor.
 *
 * Si IndexedDB no esta disponible (navegacion privada, un WebView viejo, o
 * simplemente denegado) se devuelve la lista vacia en vez de propagar el fallo.
 * Guardar para despues es una mejora; que su ausencia dejara la pantalla en
 * blanco seria mucho peor que no tenerla.
 */
export async function pendingMovements(
  userId: string,
  spaceId: string,
  month?: string,
  database: RumboOfflineDatabase = offlineDatabase
): Promise<Movement[]> {
  try {
    const rows = await database.movements
      .where("[userId+spaceId]")
      .equals([userId, spaceId])
      .filter((row) => row.syncStatus === "PENDING")
      .toArray();

    return rows
      .filter((row) => !month || row.effectiveDate.startsWith(month))
      .map(toMovement)
      .sort((left, right) => right.effectiveDate.localeCompare(left.effectiveDate));
  } catch {
    return [];
  }
}

export async function pendingCount(
  userId: string,
  database: RumboOfflineDatabase = offlineDatabase
): Promise<number> {
  try {
    return await database.outbox.where("[userId+status]").equals([userId, "PENDING"]).count();
  } catch {
    return 0;
  }
}

export interface FlushResult {
  sent: number;
  failed: number;
}

/**
 * Intenta subir todo lo pendiente.
 *
 * Un rechazo del servidor (4xx) no se reintenta: el dato es invalido y
 * repetirlo daria el mismo resultado para siempre, asi que la entrada se marca
 * FAILED y deja de estorbar a las demas. Un fallo de red si se conserva
 * intacto, porque ahi el problema es el momento, no el contenido.
 */
export async function flushOutbox(
  userId: string,
  accessToken: string,
  database: RumboOfflineDatabase = offlineDatabase
): Promise<FlushResult> {
  const entries = await database.outbox
    .where("[userId+status]")
    .equals([userId, "PENDING"])
    .sortBy("createdAt");

  let sent = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      const response = await apiFetch(accessToken, "/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.payload)
      });

      if (response.ok) {
        await database.transaction("rw", database.movements, database.outbox, async () => {
          await database.outbox.delete(entry.id);
          await database.movements.delete(entry.entityId);
        });
        sent += 1;
        continue;
      }

      if (response.status >= 400 && response.status < 500) {
        await database.outbox.update(entry.id, {
          status: "FAILED",
          attempts: entry.attempts + 1,
          lastError: `El servidor rechazo el movimiento (${response.status}).`
        });
        failed += 1;
        continue;
      }

      // 5xx: el servidor esta mal ahora mismo, no el dato. Se deja pendiente.
      await database.outbox.update(entry.id, { attempts: entry.attempts + 1 });
      break;
    } catch {
      // Sigue sin haber red. Se corta el recorrido para no repetir el intento
      // con cada una de las entradas que quedan.
      await database.outbox.update(entry.id, { attempts: entry.attempts + 1 });
      break;
    }
  }

  return { sent, failed };
}
