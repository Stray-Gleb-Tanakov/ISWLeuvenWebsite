/* ====================================================
   Combat balance simulator: plays fights with the real
   reducer and a "decent player" who lands some QTEs and
   misses others. Used by balance.test.ts to keep fights
   from becoming trivial (or impossible) after tuning.
   ==================================================== */

import { createInitialState, gameReducer } from "./engine";
import { createRandomEnemy, FLOOR_MAPS, parseFloor } from "./data";
import type { ClassName, Enemy, GameState, QteResult } from "./types";

export const COMBAT_CLASSES: ClassName[] = ["Netrunner", "Cyborg", "Ghost", "Sysadmin", "Script Kiddie"];

/* Roughly where a player is on each floor: level and the gear lying around */
export function expectedLevel(floor: number): number {
  return 1 + Math.round(floor * 1.6);
}

function roll(table: [QteResult, number][]): QteResult {
  let r = Math.random();
  for (const [res, p] of table) { if ((r -= p) < 0) return res; }
  return table[table.length - 1][0];
}

/* A decent but not perfect player */
const SPECIAL_SKILL: [QteResult, number][] = [["perfect", 0.25], ["good", 0.5], ["miss", 0.25]];
const BRACE_SKILL: [QteResult, number][] = [["perfect", 0.15], ["good", 0.45], ["miss", 0.4]];

function playerOnFloor(cls: ClassName, floor: number): GameState {
  let s = gameReducer(createInitialState(), { type: "SELECT_CLASS", className: cls });
  const p = { ...s.player!, stats: { ...s.player!.stats }, floor, inventory: [] };
  for (let l = 1; l < expectedLevel(floor); l++) {
    p.stats.maxHp += 12; p.stats.maxMp += 8; p.stats.atk += 2; p.stats.def += 1; p.stats.spd += 1; p.stats.int += 1;
  }
  // weapon + armor pickups, and a shop upgrade every other floor
  p.stats.atk += 4 + Math.floor(floor / 2) * 2;
  p.stats.def += (floor >= 1 ? 3 : 0) + Math.floor(floor / 2) * 2;
  p.stats.hp = p.stats.maxHp; p.stats.mp = p.stats.maxMp;
  p.level = expectedLevel(floor);
  p.xp = 0; p.xpToNext = 1e9; // no level-up heals mid-fight
  s = { ...s, player: p, enemies: [] };
  return s;
}

export interface FightResult { won: boolean; hpLost: number; rounds: number }

export function simulateFight(cls: ClassName, floor: number, enemy: Enemy): FightResult {
  let s = playerOnFloor(cls, floor);
  const maxHp = s.player!.stats.maxHp;
  s = { ...s, mode: "COMBAT", currentEnemy: enemy, enemies: [enemy] };
  let rounds = 0;
  for (let guard = 0; guard < 400 && (s.mode === "COMBAT" || s.mode === "QTE" || s.mode === "LOCKDOWN"); guard++) {
    if (s.mode === "LOCKDOWN") {
      // a decent player cracks most lockdown ciphers in time
      s = Math.random() < 0.7
        ? gameReducer(gameReducer(s, { type: "PUZZLE_SET", value: s.currentPuzzle!.plainText }), { type: "PUZZLE_SUBMIT" })
        : gameReducer(s, { type: "LOCKDOWN_TIMEOUT" });
      continue;
    }
    if (s.mode === "QTE") {
      const q = s.qte!;
      const result = q.context === "brace" ? roll(BRACE_SKILL) : q.context === "grab" ? roll([["perfect", 0.6], ["miss", 0.4]]) : roll(SPECIAL_SKILL);
      const text = q.kind === "shell" && result !== "miss" ? q.answers![0] : undefined;
      s = gameReducer(s, { type: "QTE_RESOLVE", result, accuracy: result === "perfect" ? 1 : result === "good" ? 0.7 : 0.2, text });
      continue;
    }
    rounds++;
    const p = s.player!;
    const special = p.skills[0];
    const useSpecial = special.currentCooldown === 0 && p.stats.mp >= special.mpCost && rounds % 2 === 1;
    s = gameReducer(s, { type: useSpecial ? "SPECIAL" : "ATTACK" });
  }
  const hp = Math.max(0, s.player!.stats.hp);
  return { won: s.mode !== "GAME_OVER", hpLost: (maxHp - hp) / maxHp, rounds };
}

export interface FloorStats { floor: number; cls: ClassName; winRate: number; avgHpLost: number; avgRounds: number }

/* Average over many fights against that floor's regular enemies */
export function simulateFloor(cls: ClassName, floor: number, fights = 150): FloorStats {
  let wins = 0, lost = 0, rounds = 0;
  for (let i = 0; i < fights; i++) {
    // regular enemies only (re-roll leeches: they fight for credits, not HP)
    let enemy = createRandomEnemy(floor, 2, 1, `sim${i}`);
    while (enemy.behavior === "leech") enemy = createRandomEnemy(floor, 2, 1, `sim${i}`);
    const r = simulateFight(cls, floor, enemy);
    if (r.won) wins++;
    lost += r.hpLost; rounds += r.rounds;
  }
  return { floor, cls, winRate: wins / fights, avgHpLost: lost / fights, avgRounds: rounds / fights };
}

/* The mini-boss of a floor (floors 3-5) or the final boss (floor 6) */
export function simulateBoss(cls: ClassName, floor: number, fights = 100): FloorStats {
  const boss = parseFloor(floor).enemies.find((e) => e.isBoss)!;
  let wins = 0, lost = 0, rounds = 0;
  for (let i = 0; i < fights; i++) {
    const r = simulateFight(cls, floor, { ...boss, stats: { ...boss.stats }, statusEffects: [] });
    if (r.won) wins++;
    lost += r.hpLost; rounds += r.rounds;
  }
  return { floor, cls, winRate: wins / fights, avgHpLost: lost / fights, avgRounds: rounds / fights };
}

export const FLOORS = FLOOR_MAPS.length;
