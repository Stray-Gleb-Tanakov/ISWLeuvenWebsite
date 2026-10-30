/* ====================================================
   Perks — pick 1 of 3 on every level-up.
   Effects are applied where they matter (engine, qte,
   merchant); this file only describes them.
   ==================================================== */

import type { PerkId, Player } from "./types";

export interface Perk {
  id: PerkId;
  name: string;
  description: string;
}

export const PERKS: Record<PerkId, Perk> = {
  glass_cannon: { id: "glass_cannon", name: "Glass Cannon", description: "+50% damage. -30% max HP." },
  paranoia: {
    id: "paranoia", name: "Paranoia",
    description: "Brace on 60% of attacks, but the window is shorter and perfects are nearly impossible. A perfect brace counter-attacks. You'll start seeing things.",
  },
  vampiric: { id: "vampiric", name: "Vampiric Code", description: "Heal 10% of all damage you deal. The mainframe bleeds red." },
  overcharge: { id: "overcharge", name: "Overcharge", description: "A perfect special refunds its MP." },
  black_market: { id: "black_market", name: "Black Market Contact", description: "30% off at every merchant." },
  credit_miner: { id: "credit_miner", name: "Credit Miner", description: "+50% credits from kills and terminals." },
  steady_hands: { id: "steady_hands", name: "Steady Hands", description: "+25% time on every quick-time event." },
  lucky_dice: { id: "lucky_dice", name: "Loaded Dice", description: "Your attacks crit on a 19 or 20." },
};

export const PERK_IDS = Object.keys(PERKS) as PerkId[];

export function hasPerk(player: Player | null | undefined, id: PerkId): boolean {
  return !!player?.perks.includes(id);
}

/* 3 random perks the player doesn't have yet */
export function rollPerkChoices(player: Player, rng: () => number = Math.random): PerkId[] {
  const pool = PERK_IDS.filter((id) => !player.perks.includes(id));
  const out: PerkId[] = [];
  while (out.length < 3 && pool.length > 0) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}

/* One-time effects when a perk is picked */
export function applyPerk(player: Player, id: PerkId): Player {
  const p = { ...player, stats: { ...player.stats }, perks: [...player.perks, id] };
  if (id === "glass_cannon") {
    p.stats.maxHp = Math.max(1, Math.floor(p.stats.maxHp * 0.7));
    p.stats.hp = Math.min(p.stats.hp, p.stats.maxHp);
  }
  return p;
}

/* Fake warnings the Paranoia perk flashes on screen. Nothing behind them is real. */
export const PARANOIA_WARNINGS = [
  "⚠ INTRUSION DETECTED",
  "⚠ THEY CAN SEE YOU",
  "ISW-Chan is watching.",
  "ISW-Chan is watching. ISW-Chan is watching. ISW-Chan is watching.",
  "⚠ HP CRITICAL",
  "⚠ HOSTILE PROCESS BEHIND YOU",
  "she knows which room you're in",
  "⚠ SESSION HIJACKED",
  "did you hear that?",
  "ISW-Chan: found you :)",
  "⚠ CAMERA 03 ACTIVE",
  "don't turn around",
  "ISW-Chan has read your logs.",
  "⚠ MEMORY LEAK IN /home/you",
];
