/* ====================================================
   Run score — derived from the game state, so the
   reducer doesn't need to track anything extra.
   ==================================================== */

import type { GameState } from "./types";
import { FLOOR_MAPS } from "./data";

/* Bump (here and in food-api/src/scores.ts) whenever the formula changes,
   so old and new runs don't share a leaderboard */
export const SCORE_VERSION = 1;

export interface ScoreBreakdown {
  kills: number;
  bosses: number;
  puzzles: number;
  perfects: number;  // perfect QTEs
  lockdowns: number; // final boss lockdowns cracked
  floor: number; // 1-based, deepest reached
  won: boolean;
  total: number;
}

export function computeScore(state: GameState): ScoreBreakdown {
  const p = state.player;
  const dead = state.enemies.filter((e) => !e.alive);
  const solved = state.puzzles.filter((pz) => pz.solved);
  const won = state.mode === "WIN";

  const killPts = dead.reduce((sum, e) => sum + (e.isBoss ? 500 : 50) * (e.floor + 1), 0);
  const puzzlePts = solved.reduce((sum, pz) => sum + 150 * (pz.floor + 1), 0);
  const floorPts = (p?.floor ?? 0) * 1000;
  const levelPts = (p?.level ?? 1) * 100;
  const qtePts = state.runStats.perfects * 30 + state.runStats.lockdownsCracked * 500;
  const winPts = won ? 5000 + Math.max(0, 3000 - state.turnCount) : 0;

  return {
    kills: dead.filter((e) => !e.isBoss).length,
    bosses: dead.filter((e) => e.isBoss).length,
    puzzles: solved.length,
    perfects: state.runStats.perfects,
    lockdowns: state.runStats.lockdownsCracked,
    floor: won ? FLOOR_MAPS.length : (p?.floor ?? 0) + 1,
    won,
    total: killPts + puzzlePts + floorPts + levelPts + qtePts + winPts,
  };
}
