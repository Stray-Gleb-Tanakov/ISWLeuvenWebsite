/* Guards the combat balance: regular fights must cost something, bosses must be beatable
   but not free. Numbers come from simulating a "decent player" with the real reducer
   (see balance.ts). Bounds are loose on purpose: the fights are random. */
import { describe, it, expect } from "vitest";
import { simulateFloor, simulateBoss, COMBAT_CLASSES } from "./balance";

describe("combat balance", () => {
  it("regular fights take a few rounds and cost real HP, for every class", () => {
    for (const cls of COMBAT_CLASSES) {
      const deep = simulateFloor(cls, 3, 40);
      expect(deep.avgRounds, cls).toBeGreaterThanOrEqual(3);
      expect(deep.avgHpLost, cls).toBeGreaterThan(0.1);  // not a free win
      expect(deep.avgHpLost, cls).toBeLessThan(0.55);    // but not a coin flip either
      expect(deep.winRate, cls).toBeGreaterThan(0.85);
    }
  }, 120000);

  it("bosses are dangerous but beatable", () => {
    const mini = COMBAT_CLASSES.map((cls) => simulateBoss(cls, 4, 30).winRate);
    const final = COMBAT_CLASSES.map((cls) => simulateBoss(cls, 5, 30).winRate);
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(avg(mini)).toBeLessThan(0.97);
    expect(avg(mini)).toBeGreaterThan(0.5);
    expect(avg(final)).toBeLessThan(0.95);
    expect(Math.min(...final)).toBeGreaterThan(0.2); // no class is hopeless
  }, 120000);
});
