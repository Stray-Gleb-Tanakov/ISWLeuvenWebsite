import { describe, it, expect, vi, afterEach } from "vitest";
import { createInitialState, gameReducer } from "./engine";
import { FLOOR_MAPS } from "./data";
import { shuffleFloor, isWinnable, floorRng } from "./placement";
import { createQte, windowFactor, gaugeResult, braceResult } from "./qte";
import { SHOP_STOCK, shopPrice } from "./merchant";
import type { ClassName, Enemy, GameState } from "./types";

afterEach(() => vi.restoreAllMocks());

const glyphs = (rows: string[], set: string) => [...rows.join("")].filter((c) => set.includes(c)).sort().join("");

describe("seeded placement", () => {
  it("hand-made maps are winnable", () => {
    FLOOR_MAPS.forEach((rows) => expect(isWinnable(rows)).toBe(true));
  });

  it("every shuffled floor stays winnable and keeps the fixed layout", () => {
    let fallbacks = 0;
    for (let seed = 1; seed <= 300; seed++) {
      FLOOR_MAPS.forEach((rows, f) => {
        const out = shuffleFloor(rows, floorRng(seed * 7919, f));
        expect(isWinnable(out), `seed ${seed} floor ${f}`).toBe(true);
        expect(glyphs(out, "EWAX+TK?")).toBe(glyphs(rows, "EWAX+TK?"));
        // walls, doors, stairs, start, NPCs, merchants, bosses never move
        const fixed = (r: string[]) => r.map((row) => row.replace(/[EWAX+TK?]/g, "."));
        expect(fixed(out)).toEqual(fixed(rows.map((r) => r.padEnd(out[0].length, "#"))));
        if (out === rows) fallbacks++;
      });
    }
    expect(fallbacks).toBeLessThan(30); // the fallback should be rare
  });

  it("same seed gives the same layout", () => {
    expect(shuffleFloor(FLOOR_MAPS[2], floorRng(42, 2))).toEqual(shuffleFloor(FLOOR_MAPS[2], floorRng(42, 2)));
  });
});

describe("QTE timing", () => {
  it("random window range is tight on floor 1 and wider deeper", () => {
    const range = (floor: number) => [windowFactor(floor, () => 0), windowFactor(floor, () => 0.9999)];
    const [lo0, hi0] = range(0), [lo5, hi5] = range(5);
    expect(hi0 - lo0).toBeLessThan(0.11);
    expect(hi5 - lo5).toBeGreaterThan(0.7);
  });

  it("grades gauge and brace presses", () => {
    const gauge = createQte("gauge", 0, () => 0.5);
    const mid = (gauge.zone!.perfect[0] + gauge.zone!.perfect[1]) / 2;
    expect(gaugeResult(gauge, mid)).toBe("perfect");
    expect(gaugeResult(gauge, gauge.zone!.good[0] + 0.001)).toBe("good");
    expect(gaugeResult(gauge, 0.01)).toBe("miss");
    const brace = createQte("brace", 0);
    expect(braceResult(brace, -50)).toBe("miss"); // too early
    expect(braceResult(brace, 10)).toBe("perfect");
    expect(braceResult(brace, brace.windowMs - 1)).toBe("good");
    expect(braceResult(brace, null)).toBe("miss");
  });
});

/* ----- combat ----- */

function startedRun(cls: ClassName = "Cyborg"): GameState {
  return gameReducer(createInitialState(), { type: "SELECT_CLASS", className: cls });
}

function inCombat(state: GameState, enemy: Partial<Enemy> & { hp: number }): GameState {
  const e: Enemy = {
    id: "e-test", name: "Test Drone", symbol: "E", xpReward: 10, alive: true, x: 2, y: 1, floor: 0, ac: 10,
    statusEffects: [], ...enemy,
    stats: { maxHp: enemy.stats?.maxHp ?? enemy.hp, hp: enemy.hp, maxMp: 0, mp: 0, atk: 10, def: 0, spd: 1, int: 0 },
  };
  return { ...state, mode: "COMBAT", currentEnemy: e, enemies: [...state.enemies, e] };
}

describe("combat flow", () => {
  /* Math.random: the queued values first, then 0.99 (d20 = 20, no Brace prompt) */
  function randomQueue(...values: number[]) {
    vi.spyOn(Math, "random").mockImplementation(() => values.shift() ?? 0.99);
  }

  it("most enemy attacks resolve straight away, without a Brace prompt", () => {
    const start = inCombat(startedRun(), { hp: 999 });
    randomQueue();
    const s = gameReducer(start, { type: "ATTACK" });
    expect(s.mode).toBe("COMBAT");
    expect(s.player!.stats.hp).toBeLessThan(200);
  });

  it("about 30% of attacks can be braced", () => {
    let braced = 0;
    for (let i = 0; i < 400; i++) {
      if (gameReducer(inCombat(startedRun(), { hp: 999 }), { type: "ATTACK" }).mode === "QTE") braced++;
    }
    expect(braced).toBeGreaterThan(80);
    expect(braced).toBeLessThan(160);
  });

  it("a perfect brace dodges even a crit, a good one halves it", () => {
    let s = inCombat(startedRun(), { hp: 999 });
    randomQueue(0.99, 0.1); // player d20 = 20, then the Brace roll succeeds
    s = gameReducer(s, { type: "ATTACK" });
    expect(s.mode).toBe("QTE");
    expect(s.qte?.kind).toBe("brace");
    const hp = s.player!.stats.hp;
    const dodged = gameReducer(s, { type: "QTE_RESOLVE", result: "perfect", accuracy: 1 });
    expect(dodged.mode).toBe("COMBAT");
    expect(dodged.player!.stats.hp).toBe(hp);
    expect(dodged.runStats.perfects).toBe(1);
    const halved = gameReducer(s, { type: "QTE_RESOLVE", result: "good", accuracy: 1 });
    const full = gameReducer(s, { type: "QTE_RESOLVE", result: "miss", accuracy: 0 });
    expect(hp - halved.player!.stats.hp).toBe(Math.ceil((hp - full.player!.stats.hp) / 2));
  });

  it("class specials open their own QTE and scale with the result", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const kinds = { Netrunner: "hack", Cyborg: "gauge", Ghost: "combo" } as const;
    for (const cls of Object.keys(kinds) as ClassName[]) {
      const s = gameReducer(inCombat(startedRun(cls), { hp: 999 }), { type: "SPECIAL" });
      expect(s.mode).toBe("QTE");
      expect(s.qte?.kind).toBe(kinds[cls]);
      const perfect = gameReducer(s, { type: "QTE_RESOLVE", result: "perfect", accuracy: 1 });
      const miss = gameReducer(s, { type: "QTE_RESOLVE", result: "miss", accuracy: 0 });
      expect(perfect.currentEnemy!.stats.hp).toBeLessThan(miss.currentEnemy!.stats.hp);
      expect(["QTE", "COMBAT"]).toContain(perfect.mode); // enemy answers, braced or not
    }
  });

  it("the Ghost combo is 7-8 arrows with a long memorise phase", () => {
    for (let i = 0; i < 50; i++) {
      const qte = createQte("combo", i % 6);
      expect(qte.prompt.length).toBeGreaterThanOrEqual(7);
      expect(qte.prompt.length).toBeLessThanOrEqual(8);
      expect(qte.memorizeMs).toBeGreaterThanOrEqual(4000);
    }
  });

  it("a missed Overclock backfires: no damage to the enemy, damage to you", () => {
    const start = inCombat(startedRun("Cyborg"), { hp: 999 });
    const s = gameReducer(start, { type: "SPECIAL" });
    vi.spyOn(Math, "random").mockReturnValue(0.99); // no Brace prompt afterwards, enemy d20 = 20
    const missed = gameReducer(s, { type: "QTE_RESOLVE", result: "miss", accuracy: 0 });
    expect(missed.currentEnemy!.stats.hp).toBe(999);
    expect(missed.log.some((l) => l.includes("OVERCLOCK BACKFIRE") && l.includes("30 damage"))).toBe(true);
    expect(missed.player!.stats.hp).toBeLessThan(200 - 30 + 1); // backfire, plus the enemy's own hit
  });

  it("key 1 uses the special instead of wasting MP", () => {
    const s = gameReducer(inCombat(startedRun("Netrunner"), { hp: 999 }), { type: "SKILL", skillIndex: 0 });
    expect(s.qte?.kind).toBe("hack");
  });

  it("kills drop 20-60 credits", () => {
    for (let i = 0; i < 50; i++) {
      const s = gameReducer(inCombat(startedRun("Cyborg"), { hp: 1 }), { type: "SPECIAL" });
      const done = gameReducer(s, { type: "QTE_RESOLVE", result: "good", accuracy: 1 });
      expect(done.mode).toBe("EXPLORE");
      expect(done.player!.credits).toBeGreaterThanOrEqual(20);
      expect(done.player!.credits).toBeLessThanOrEqual(60);
    }
  });
});

describe("final boss lockdown", () => {
  const boss = { id: "boss-5", name: "NEXUS — Rogue AI", isBoss: true, hp: 165, stats: { maxHp: 320 } } as Partial<Enemy> & { hp: number };

  it("triggers at 50% and 20%, cracking it stuns and exposes the boss", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    let s = gameReducer(inCombat(startedRun("Cyborg"), boss), { type: "SPECIAL" });
    s = gameReducer(s, { type: "QTE_RESOLVE", result: "good", accuracy: 1 });
    expect(s.mode).toBe("LOCKDOWN");
    expect(s.lockdownMs).toBe(30000);

    s = gameReducer(s, { type: "PUZZLE_SET", value: "nope" });
    s = gameReducer(s, { type: "PUZZLE_SUBMIT" });
    expect(s.mode).toBe("LOCKDOWN"); // wrong answers can retry

    s = gameReducer(s, { type: "PUZZLE_SET", value: s.currentPuzzle!.plainText });
    s = gameReducer(s, { type: "PUZZLE_SUBMIT" });
    expect(s.mode).toBe("COMBAT");
    expect(s.runStats.lockdownsCracked).toBe(1);

    const before = s.currentEnemy!.stats.hp;
    s = gameReducer(s, { type: "ATTACK" });
    expect(s.mode).not.toBe("QTE"); // stunned: no enemy attack
    expect(s.log.some((l) => l.includes("EXPOSED! Double damage"))).toBe(true);
    expect(s.currentEnemy!.stats.hp).toBeLessThan(before);
  });

  it("timing out heals the boss", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    let s = gameReducer(inCombat(startedRun("Cyborg"), boss), { type: "SPECIAL" });
    s = gameReducer(s, { type: "QTE_RESOLVE", result: "good", accuracy: 1 });
    const hp = s.currentEnemy!.stats.hp;
    s = gameReducer(s, { type: "LOCKDOWN_TIMEOUT" });
    expect(s.mode).toBe("COMBAT");
    expect(s.currentEnemy!.stats.hp).toBe(hp + 64);
  });

  it("mini-bosses never lock down", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const mini = { ...boss, id: "miniboss-2" };
    let s = gameReducer(inCombat(startedRun("Cyborg"), mini), { type: "SPECIAL" });
    s = gameReducer(s, { type: "QTE_RESOLVE", result: "good", accuracy: 1 });
    expect(s.mode).not.toBe("LOCKDOWN");
  });
});

describe("flag uplink", () => {
  it("is on every floor, opens on bump, records results and disconnects", () => {
    FLOOR_MAPS.forEach((rows) => expect(rows.join("")).toContain("U"));
    const s = startedRun();
    const u = s.uplinks.find((x) => x.floor === 0)!;
    let t = gameReducer({ ...s, player: { ...s.player!, x: u.x, y: u.y - 1 }, enemies: [] }, { type: "MOVE", dx: 0, dy: 1 });
    expect(t.mode).toBe("UPLINK");
    t = gameReducer(t, { type: "PUZZLE_SET", value: "isw{c0ns0l3_c0wb0y}" });
    expect(t.puzzleInput).toBe("ISW{C0NS0L3_C0WB0Y}");
    t = gameReducer(t, { type: "UPLINK_RESULT", input: t.puzzleInput, title: "Console Cowboy", flagsFound: 1 });
    expect(t.flagsFound).toBe(1);
    expect(t.log.some((l) => l.includes("FLAG ACCEPTED: Console Cowboy"))).toBe(true);
    t = gameReducer(t, { type: "UPLINK_RESULT", input: "ISW{NOPE}", title: null, flagsFound: 1 });
    expect(t.log.some((l) => l.includes("UPLINK REJECTED"))).toBe(true);
    expect(gameReducer(t, { type: "PUZZLE_QUIT" }).mode).toBe("EXPLORE");
  });
});

describe("merchant", () => {
  function atShop(credits: number): GameState {
    const s = startedRun();
    const m = s.merchants.find((x) => x.floor === 0)!;
    const placed = { ...s, player: { ...s.player!, x: m.x - 1, y: m.y, credits }, enemies: [] };
    return gameReducer(placed, { type: "MOVE", dx: 1, dy: 0 });
  }

  it("opens on bump, refuses when broke, sells when paid", () => {
    let s = atShop(0);
    expect(s.mode).toBe("SHOP");
    expect(s.shopLine).not.toBe("");
    s = gameReducer(s, { type: "SHOP_BUY", index: 0 });
    expect(s.player!.inventory).toHaveLength(2);

    s = atShop(1000);
    const price = shopPrice(SHOP_STOCK[4], 0, s.merchants[0]);
    const atk = s.player!.stats.atk;
    s = gameReducer(s, { type: "SHOP_BUY", index: 4 });
    expect(s.player!.credits).toBe(1000 - price);
    expect(s.player!.stats.atk).toBe(atk + 2);
  });

  it("haggling once: win = 20% off, loss = locked", () => {
    let s = gameReducer(atShop(1000), { type: "SHOP_HAGGLE" });
    const answer = s.haggle!.answer;
    s = gameReducer(s, { type: "PUZZLE_SET", value: answer });
    s = gameReducer(s, { type: "PUZZLE_SUBMIT" });
    expect(s.merchants[0].haggle).toBe("won");
    expect(shopPrice(SHOP_STOCK[0], 0, s.merchants[0])).toBe(28);

    let t = gameReducer(atShop(1000), { type: "SHOP_HAGGLE" });
    t = gameReducer(t, { type: "PUZZLE_SET", value: "WRONG" });
    t = gameReducer(t, { type: "PUZZLE_SUBMIT" });
    expect(t.merchants[0].haggle).toBe("lost");
    expect(gameReducer(t, { type: "SHOP_HAGGLE" }).haggle).toBeNull();
  });

  it("shopkeepers get annoyed when you keep browsing", () => {
    let s = atShop(0);
    for (let i = 0; i < 3; i++) {
      s = gameReducer(s, { type: "SHOP_LEAVE" });
      s = gameReducer({ ...s, player: { ...s.player! } }, { type: "MOVE", dx: 1, dy: 0 });
    }
    expect(s.mode).toBe("SHOP");
    expect(s.merchants[0].visits).toBe(4);
  });
});
