import "fake-indexeddb/auto";
import type { CreateMovement } from "@ahorra/domain";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RumboOfflineDatabase } from "./database";
import {
  flushOutbox,
  isPendingMovement,
  pendingCount,
  pendingMovements,
  queueMovement
} from "./outbox";

const USER = "user-1";
const SPACE = "11111111-1111-4111-8111-111111111111";

const movement = (overrides: Partial<CreateMovement> = {}): CreateMovement => ({
  spaceId: SPACE,
  type: "EXPENSE",
  status: "REGISTERED",
  amountCents: 1_500_00,
  effectiveDate: "2026-08-17",
  description: "Compra en el colmado",
  category: "Alimentacion",
  ...overrides
});

let database: RumboOfflineDatabase;

beforeEach(async () => {
  database = new RumboOfflineDatabase(`test-${crypto.randomUUID()}`);
  await database.open();
});

afterEach(async () => {
  await database.delete();
  vi.restoreAllMocks();
});

describe("queueMovement", () => {
  it("returns the movement straight away, so the screen can show it", async () => {
    const queued = await queueMovement(USER, movement(), database);

    expect(queued.amountCents).toBe(1_500_00);
    expect(queued.category).toBe("Alimentacion");
    expect(isPendingMovement(queued)).toBe(true);
  });

  it("keeps it listed for its space and month until it is uploaded", async () => {
    await queueMovement(USER, movement(), database);

    expect(await pendingMovements(USER, SPACE, "2026-08", database)).toHaveLength(1);
    expect(await pendingMovements(USER, SPACE, "2026-09", database)).toHaveLength(0);
    expect(await pendingCount(USER, database)).toBe(1);
  });

  it("does not leak one user's queue into another's", async () => {
    await queueMovement(USER, movement(), database);

    expect(await pendingMovements("someone-else", SPACE, undefined, database)).toHaveLength(0);
  });

  it("never carries the receipt photo into the queue", async () => {
    await queueMovement(USER, movement({ receiptPath: "user-1/foto.jpg" }), database);
    const [entry] = await database.outbox.toArray();

    expect((entry!.payload as { receiptPath: unknown }).receiptPath).toBeNull();
  });
});

describe("flushOutbox", () => {
  it("uploads what was queued and stops showing it as pending", async () => {
    await queueMovement(USER, movement(), database);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 201 }));

    const result = await flushOutbox(USER, "token", database);

    expect(result.sent).toBe(1);
    expect(await pendingCount(USER, database)).toBe(0);
    expect(await pendingMovements(USER, SPACE, undefined, database)).toHaveLength(0);
  });

  it("keeps everything queued when there is still no network", async () => {
    await queueMovement(USER, movement(), database);
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await flushOutbox(USER, "token", database);

    expect(result.sent).toBe(0);
    expect(await pendingCount(USER, database)).toBe(1);
  });

  it("stops retrying data the server rejects, instead of blocking the queue", async () => {
    await queueMovement(USER, movement(), database);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 400 }));

    const result = await flushOutbox(USER, "token", database);

    expect(result.failed).toBe(1);
    // Deja de contar como pendiente: reintentarlo daria 400 para siempre.
    expect(await pendingCount(USER, database)).toBe(0);
    expect((await database.outbox.toArray())[0]!.status).toBe("FAILED");
  });

  it("leaves a server outage queued, because the data is fine", async () => {
    await queueMovement(USER, movement(), database);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 503 }));

    await flushOutbox(USER, "token", database);

    expect(await pendingCount(USER, database)).toBe(1);
  });

  it("uploads in the order the movements were registered", async () => {
    await queueMovement(USER, movement({ description: "Primero" }), database);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await queueMovement(USER, movement({ description: "Segundo" }), database);

    const bodies: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) => {
      bodies.push(JSON.parse(String(init?.body)).description);
      return Promise.resolve(new Response(null, { status: 201 }));
    });

    await flushOutbox(USER, "token", database);

    expect(bodies).toEqual(["Primero", "Segundo"]);
  });
});
