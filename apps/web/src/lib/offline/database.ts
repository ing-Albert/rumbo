import Dexie, { type EntityTable } from "dexie";

export type LocalSyncStatus = "SYNCED" | "PENDING" | "CONFLICT" | "FAILED";
export type OutboxOperation = "CREATE" | "UPDATE" | "DELETE";

export interface LocalMovement {
  id: string;
  userId: string;
  spaceId: string;
  categoryId: string | null;
  /** Nombre de la categoria. Sin conexion no hay forma de resolver su id, y
      es lo que la pantalla necesita para pintar la fila. */
  category: string;
  type: "INCOME" | "EXPENSE" | "CONTRIBUTION";
  status: "REGISTERED" | "SCHEDULED" | "VOIDED";
  amountCents: number;
  effectiveDate: string;
  description: string;
  notes: string | null;
  version: number;
  updatedAt: string;
  deletedAt: string | null;
  syncStatus: LocalSyncStatus;
}

export interface OutboxEntry {
  id: string;
  userId: string;
  deviceId: string;
  entityType: "MOVEMENT" | "CATEGORY" | "BUDGET" | "GOAL" | "CONTRIBUTION";
  entityId: string;
  operation: OutboxOperation;
  payload: unknown;
  baseVersion: number | null;
  status: "PENDING" | "PROCESSING" | "FAILED" | "CONFLICT";
  attempts: number;
  createdAt: string;
  lastError: string | null;
}

export interface SyncMetadata {
  id: string;
  userId: string;
  key: string;
  value: string;
}

export class RumboOfflineDatabase extends Dexie {
  movements!: EntityTable<LocalMovement, "id">;
  outbox!: EntityTable<OutboxEntry, "id">;
  metadata!: EntityTable<SyncMetadata, "id">;

  constructor(name = "rumbo-offline") {
    super(name);
    this.version(1).stores({
      movements: "id, userId, spaceId, [userId+spaceId], [userId+syncStatus], updatedAt",
      outbox: "id, userId, [userId+status], [userId+createdAt], entityId",
      metadata: "id, userId, [userId+key]"
    });
  }
}

export const offlineDatabase = new RumboOfflineDatabase();

export async function clearOfflineUserData(
  userId: string,
  database = offlineDatabase
): Promise<void> {
  await database.transaction(
    "rw",
    database.movements,
    database.outbox,
    database.metadata,
    async () => {
      await database.movements.where("userId").equals(userId).delete();
      await database.outbox.where("userId").equals(userId).delete();
      await database.metadata.where("userId").equals(userId).delete();
    }
  );
}

export async function pendingOperationCount(
  userId: string,
  database = offlineDatabase
): Promise<number> {
  return database.outbox.where("[userId+status]").equals([userId, "PENDING"]).count();
}
