/* ====================================================
   Cosmetics: unlocked by hidden website flags.
   They change the look, never the power.
   Badges show next to your name on the leaderboard;
   the server re-checks them against the submitted flags.
   ==================================================== */

import { HIDDEN_FLAGS } from "./flags";

/* "all" = every hidden flag */
type Requirement = string | "all" | null;

export interface Theme { id: string; name: string; requires: Requirement }
export interface Icon { id: string; char: string; requires: Requirement }
export interface DeathText { id: string; text: string; requires: Requirement }
export interface Badge { id: string; title: string; requires: Requirement }

export const THEMES: Theme[] = [
  { id: "matrix", name: "Matrix Green", requires: null },
  { id: "amber", name: "Amber CRT", requires: "source" },
  { id: "ice", name: "Ice Blue", requires: "robots" },
  { id: "vapor", name: "Vaporwave", requires: "zerowidth" },
  { id: "chan", name: "ISW-Chan Pink", requires: "all" },
];

export const ICONS: Icon[] = [
  { id: "at", char: "@", requires: null },
  { id: "lambda", char: "λ", requires: "console" },
  { id: "smile", char: "☻", requires: "header" },
  { id: "psi", char: "Ψ", requires: "all" },
];

export const DEATH_TEXTS: DeathText[] = [
  { id: "default", text: "RUN TERMINATED", requires: null },
  { id: "404", text: "404: RUNNER NOT FOUND", requires: "lost" },
  { id: "segfault", text: "SEGMENTATION FAULT (CORE DUMPED)", requires: "console" },
];

/* 7 titles: one per flag, one for all of them. Keep in sync with food-api/src/scores.ts */
export const BADGES: Badge[] = [
  { id: "source", title: "◆ Source Reader", requires: "source" },
  { id: "console", title: "◆ Console Cowboy", requires: "console" },
  { id: "robots", title: "◆ Robot Whisperer", requires: "robots" },
  { id: "header", title: "◆ Header Hunter", requires: "header" },
  { id: "zerowidth", title: "◆ Invisible Ink", requires: "zerowidth" },
  { id: "lost", title: "◆ Basement Dweller", requires: "lost" },
  { id: "all", title: "★ ISW-Chan's Favourite", requires: "all" },
];

export function isUnlocked(requires: Requirement, found: Record<string, string>): boolean {
  if (requires === null) return true;
  if (requires === "all") return HIDDEN_FLAGS.every((f) => found[f.id]);
  return !!found[requires];
}

export interface CosmeticChoice {
  theme: string;
  icon: string;
  death: string;
  badge: string | null;
}

export const DEFAULT_COSMETICS: CosmeticChoice = { theme: "matrix", icon: "at", death: "default", badge: null };

export function badgeTitle(id: string | null | undefined): string | null {
  return BADGES.find((b) => b.id === id)?.title ?? null;
}
