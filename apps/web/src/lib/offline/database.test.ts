import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import {
  clearOfflineUserData,
  pendingOperationCount,
  RumboOfflineDatabase
} from "./database";

const databases: RumboOfflineDatabase[] = [];

afterEach(async () => {
  for (const database of databases.splice(0)) {
    database.close();
    await database.delete();
  }
});

describe("offline database", () => {
  it("isolates and clears local data by user", async () => {
    const database = new RumboOfflineDatabase(`rumbo-test-${crypto.randomUUID()}`);
    databases.push(database);

    await database.outbox.bulkAdd([
      {
        id: "operation-a",
        userId: "user-a",
        deviceId: "device-a",
        entityType: "MOVEMENT",
        entityId: "movement-a",
        operation: "CREATE",
        payload: {},
        baseVersion: null,
        status: "PENDING",
        attempts: 0,
        createdAt: "2026-08-10T12:00:00.000Z",
        lastError: null
      },
      {
        id: "operation-b",
        userId: "user-b",
        deviceId: "device-b",
        entityType: "MOVEMENT",
        entityId: "movement-b",
        operation: "CREATE",
        payload: {},
        baseVersion: null,
        status: "PENDING",
        attempts: 0,
        createdAt: "2026-08-10T12:00:00.000Z",
        lastError: null
      }
    ]);

    expect(await pendingOperationCount("user-a", database)).toBe(1);
    await clearOfflineUserData("user-a", database);
    expect(await pendingOperationCount("user-a", database)).toBe(0);
    expect(await pendingOperationCount("user-b", database)).toBe(1);
  });
});
