import { describe, expect, it } from "vitest";
import { millisecondsUntil } from "./notifications";

const HOUR = 60 * 60 * 1000;

/** Construye una hora local, para no depender de la zona de quien corre el test. */
const at = (hours: number, minutes = 0) => new Date(2026, 7, 17, hours, minutes, 0, 0);

describe("millisecondsUntil", () => {
  it("counts the hours left until later today", () => {
    expect(millisecondsUntil("20:00", at(14))).toBe(6 * HOUR);
  });

  it("jumps to tomorrow when the time already passed", () => {
    expect(millisecondsUntil("08:00", at(14))).toBe(18 * HOUR);
  });

  it("waits a full day rather than firing twice at the same minute", () => {
    // Justo a la hora se programa para manana: si devolviera cero, el aviso se
    // repetiria sin parar durante ese minuto.
    expect(millisecondsUntil("14:00", at(14))).toBe(24 * HOUR);
  });

  it("handles minutes, not just whole hours", () => {
    expect(millisecondsUntil("14:30", at(14))).toBe(30 * 60 * 1000);
  });

  it("crosses midnight without going negative", () => {
    expect(millisecondsUntil("00:30", at(23, 45))).toBe(45 * 60 * 1000);
  });
});
