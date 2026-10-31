/* =====================================================
   CYBERPUNK TERMINAL RPG — Game Engine (Reducer)
   Mana, status effects, stealth, combos, puzzles,
   quick-time events, boss lockdowns, merchants
   ==================================================== */

import type { GameState, GameAction, Player, Enemy, StatusEffect, Qte, QteResult, QteKind, PuzzleType, FxKind } from "./types";
import { CLASS_DATA, parseFloor, FLOOR_MAPS, FLOOR_NAMES, createRandomEnemy, getAnnoyedLine, TRAP_DATA, createPuzzle, makeLeech, ENEMY_TUNING } from "./data";
import { CLASS_QTE, COPYABLE_QTES, createQte, rmEgg, type QteMods } from "./qte";
import { SHOP_STOCK, SHOPKEEPERS, shopPrice, creditDrop, terminalCredits, createHaggle, greetingLine, line } from "./merchant";
import { PERKS, applyPerk, hasPerk, rollPerkChoices } from "./perks";
import { taunt, moodOf, setMood, ISW_CHAN_TAG, type TauntKind } from "./iswchan";
import { startTalk, talkReducer } from "./talk";
import { xorReveal } from "./flags";
import { DIARY } from "./diary";
import { openConvo, chanTalk, hangUpLine } from "./chanconvo";
import { qualifiesForEnding, openEnding, endingReply, endingFlag, ENDING_TITLES } from "./ending";

/* Mini CTF: "Dev Mode". A leftover dev backdoor at the flag uplink; the command
   only exists here as char codes, and it is also the key to its flag. */
/* Mini CTF: "The Shrine". Floor 2 has one worn wall (▓) that you can walk into */
const SHRINE_WALL = "▓";
const SHRINE_NOTE = "OjslEj0tIVk8WjEnQCBDJyo6JyBBNjlRPyQP";
const SHRINE_LINES = [
  "The wall gives way. You squeeze into a hollow behind it.",
  "Candles made of status LEDs. A shrine. A printed photo of a server rack with a heart drawn on it.",
  "A sticky note, in very neat handwriting: \"MAINFRAME: day 1. they unplugged me. i stayed.\"",
  "Taped under the candles: a business card. \"ISW-Chan. /isw-chan on the ISW website. visitors welcome. (not really.)\"",
];

const DEV_BACKDOOR = { cmd: [115, 117, 100, 111, 32, 105, 100, 100, 113, 100], notes: "OiYzFBEtIDU1OzdGMjBtWSBXDA==" };

/* ----- Difficulty knobs (combat only, puzzles are untouched) ----- */
const STATUS_CHANCE = 0.25;      // chance an enemy hit applies its status effect
const STAIRS_RESTORE = 0.3;      // fraction of max HP/MP restored when descending
const LEVEL_UP_HEAL = 0.5;       // fraction of max HP restored on level up

/* ----- Final boss lockdown: a timed cipher at these HP fractions ----- */
const LOCKDOWN_AT = [0.5, 0.2];
const LOCKDOWN_MS = [30000, 25000];
const LOCKDOWN_CIPHERS: PuzzleType[] = ["caesar", "reverse", "atbash", "keypad"];
const LOCKDOWN_HEAL = 0.2;       // boss heals this fraction of max HP when the timer runs out

/* ----- Brace: only some enemy attacks can be braced, so it stays a surprise ----- */
const BRACE_CHANCE = 0.3;
const PARANOIA_BRACE_CHANCE = 0.6;

/* ----- Leech Bot ----- */
const LEECH_FLEE_CHANCE = 0.4;
const LEECH_BOUNTY = 15; // bonus credits for killing a leech, on top of what it stole

/* Collected while one action is reduced, applied by gameReducer at the end:
   screen effects for the UI and run statistics */
const FX_PRIORITY: FxKind[] = ["hit", "crit", "perfect", "backfire", "nuke"];
let pendingFx: FxKind | null = null;
let tally = { dealt: 0, taken: 0, stolen: 0, spent: 0, braces: 0, perfectBraces: 0 };

function emit(kind: FxKind) {
  if (!pendingFx || FX_PRIORITY.indexOf(kind) > FX_PRIORITY.indexOf(pendingFx)) pendingFx = kind;
}

/* ISW-Chan butts into the log, sometimes */
function chan(log: string[], kind: TauntKind, p: Player | null | undefined) {
  const t = taunt(kind, p?.className);
  if (t) log.push(t);
}

function qteMods(p: Player): QteMods {
  return { windowMult: hasPerk(p, "steady_hands") ? 1.25 : 1 };
}

const LOG_LIMIT = 60;

/* ----- Dice rolling ----- */
function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function rollDice(sides: number, count: number = 1): number {
  let total = 0;
  for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
  return total;
}

/* ----- Status effect helpers ----- */
function tickStatusEffects(effects: StatusEffect[]): { effects: StatusEffect[]; damage: number; stunned: boolean; msgs: string[] } {
  let damage = 0;
  let stunned = false;
  const msgs: string[] = [];
  const remaining: StatusEffect[] = [];

  for (const eff of effects) {
    const left = eff.turnsLeft - 1;
    switch (eff.type) {
      case "poison":
        damage += eff.damage || 3;
        msgs.push(`☠ Poison deals ${eff.damage || 3} damage`);
        break;
      case "burn":
        damage += eff.damage || 5;
        msgs.push(`🔥 Burn deals ${eff.damage || 5} damage`);
        break;
      case "bleed":
        damage += eff.damage || 4;
        msgs.push(`🩸 Bleed deals ${eff.damage || 4} damage`);
        break;
      case "stun":
        stunned = true;
        msgs.push(`💫 Stunned! Cannot act.`);
        break;
      case "slow":
        msgs.push(`🐌 Slowed...`);
        break;
    }
    if (left > 0) remaining.push({ ...eff, turnsLeft: left });
  }

  return { effects: remaining, damage, stunned, msgs };
}

function hasStatus(effects: StatusEffect[], type: string): boolean {
  return effects.some(e => e.type === type);
}

/* Every floor gets a Leech Bot, and from floor 2 on one enemy is possessed by ISW-Chan */
function decorateFloor(enemies: Enemy[], floor: number): Enemy[] {
  const regular = enemies.filter((e) => !e.isBoss);
  if (regular.length < 2) return enemies;
  const leechIdx = Math.floor(Math.random() * regular.length);
  const leech = regular[leechIdx];
  let fragmentId: string | null = null;
  if (floor >= 1) {
    const others = regular.filter((_, i) => i !== leechIdx);
    fragmentId = others[Math.floor(Math.random() * others.length)].id;
  }
  return enemies.map((e) => {
    if (e.id === leech.id) return makeLeech(floor, e.x, e.y, e.id);
    if (e.id === fragmentId) {
      const boost = (n: number) => Math.round(n * 1.4);
      return {
        ...e, fragment: true, name: `ISW-Chan // ${e.name}`, xpReward: boost(e.xpReward),
        stats: { ...e.stats, maxHp: boost(e.stats.maxHp), hp: boost(e.stats.maxHp), atk: boost(e.stats.atk) },
      };
    }
    return e;
  });
}

/* ----- Helper: create initial state ----- */
export function createInitialState(): GameState {
  const seed = Math.floor(Math.random() * 0xffffffff);
  const { enemies, npcs, groundItems, doors, puzzles, traps, merchants, uplinks } = parseFloor(0, seed);
  // Walls never move, so the unshuffled maps are the same for every seed
  const allMaps = FLOOR_MAPS.map((_, f) => parseFloor(f).cleanMap);

  return {
    mode: "CLASS_SELECT",
    player: null,
    enemies: decorateFloor(enemies, 0),
    npcs,
    groundItems,
    maps: allMaps,
    log: [
      "╔══════════════════════════════════════╗",
      "║   MAINFRAME BREACH — v5.0.0         ║",
      "║   A Cyberpunk Terminal RPG           ║",
      "║   6 Floors · Mini-Bosses · Traps    ║",
      "║   Quick-Time Combat · Merchants     ║",
      "╚══════════════════════════════════════╝",
      "",
      "You wake up inside a corrupted mainframe.",
      "Your memories are fragmented. You must escape.",
      "Six floors stand between you and freedom.",
      "Select your class to begin...",
    ],
    currentEnemy: null,
    currentNPC: null,
    dialogueIndex: 0,
    dialogueChoices: null,
    doors,
    turnCount: 0,
    spawnTimer: 12 + Math.floor(Math.random() * 7),
    puzzles,
    currentPuzzle: null,
    puzzleInput: "",
    traps: [...traps],
    qte: null,
    lockdownMs: 0,
    merchants,
    uplinks,
    currentMerchant: null,
    haggle: null,
    shopLine: "",
    seed,
    flagsFound: 0,
    runStats: {
      perfects: 0, lockdownsCracked: 0, creditsEarned: 0, creditsStolen: 0, creditsSpent: 0,
      bracesFaced: 0, perfectBraces: 0, damageDealt: 0, damageTaken: 0, killedBy: null,
    },
    perkChoices: null,
    fx: null,
    talk: null,
  };
}

/* ----- Helper: add log messages ----- */
function addLog(state: GameState, ...msgs: string[]): string[] {
  const newLog = [...state.log, ...msgs];
  return newLog.slice(-LOG_LIMIT);
}

/* ----- Helper: check level up ----- */
function checkLevelUp(player: Player, log: string[]): { player: Player; log: string[] } {
  let p = { ...player };
  const newLog = [...log];

  while (p.xp >= p.xpToNext) {
    p.xp -= p.xpToNext;
    p.level++;
    p.xpToNext = Math.floor(p.xpToNext * 1.5);
    const maxHp = p.stats.maxHp + 12;
    const maxMp = p.stats.maxMp + 8;
    p.stats = {
      ...p.stats,
      maxHp,
      hp: Math.min(maxHp, p.stats.hp + 12 + Math.floor(maxHp * LEVEL_UP_HEAL)),
      maxMp,
      mp: Math.min(maxMp, p.stats.mp + 8 + Math.floor(maxMp * LEVEL_UP_HEAL)),
      atk: p.stats.atk + 2,
      def: p.stats.def + 1,
      spd: p.stats.spd + 1,
      int: p.stats.int + 1,
    };
    p.pendingPerks += 1;
    newLog.push(`>>> LEVEL UP! You are now level ${p.level} <<<`);
    newLog.push(`HP & MP restored by half. Stats increased.`);
  }

  return { player: p, log: newLog };
}

function getHitMod(atk: number): number {
  return Math.floor(atk / 3);
}

function playerAttackRoll(player: Player, enemy: Enemy): { hit: boolean; roll: number; total: number; damage: number; crit: boolean; msgs: string[] } {
  const roll = rollD20();
  const mod = getHitMod(player.stats.atk);
  const total = roll + mod;
  const crit = roll === 20 || (roll === 19 && hasPerk(player, "lucky_dice"));
  const msgs: string[] = [];

  msgs.push(`🎲 Roll: d20(${roll}) + ${mod} = ${total} vs AC ${enemy.ac}`);

  if (roll === 1) {
    msgs.push("CRITICAL MISS! You stumble and miss entirely.");
    return { hit: false, roll, total, damage: 0, crit: false, msgs };
  }

  if (crit || total >= enemy.ac) {
    let damage = Math.max(1, player.stats.atk - Math.floor(enemy.stats.def / 3));
    // Combo bonus
    const comboBonus = Math.floor(player.comboCount * 0.15 * damage);
    damage += comboBonus;
    if (crit) {
      damage = damage * 2;
      msgs.push(`CRITICAL HIT! ${damage} damage!`);
    } else {
      if (comboBonus > 0) msgs.push(`Combo x${player.comboCount + 1}! +${comboBonus} bonus damage`);
      msgs.push(`Hit! ${damage} damage.`);
    }
    return { hit: true, roll, total, damage, crit, msgs };
  }

  msgs.push("Miss! Your attack fails to penetrate.");
  return { hit: false, roll, total, damage: 0, crit: false, msgs };
}

/* Enemy attack. `brace` is the Brace QTE result, or null when this attack had no Brace prompt */
function enemyAttackRoll(enemy: Enemy, player: Player, brace: QteResult | null): { player: Player; msgs: string[] } {
  const roll = rollD20();
  const mod = getHitMod(enemy.stats.atk);
  const total = roll + mod;
  // speed helps a little (spd/6): at spd/4 the fastest class was also nearly unhittable
  const playerAC = 10 + Math.floor(player.stats.def / 2) + Math.floor(player.stats.spd / 6);
  const msgs: string[] = [];

  msgs.push(`${enemy.name} rolls: d20(${roll}) + ${mod} = ${total} vs your AC ${playerAC}`);

  if (roll === 1) {
    msgs.push(`${enemy.name} fumbles!`);
    return { player, msgs };
  }

  const crit = roll === 20;
  if (crit || total >= playerAC) {
    if (brace === "perfect") {
      msgs.push("🛡 PERFECT BRACE! You dodge it completely.");
      return { player, msgs };
    }
    // Leech Bots go for your wallet, not your HP
    if (enemy.behavior === "leech") {
      const want = 10 + Math.floor(Math.random() * 16);
      const stolen = Math.min(player.credits, brace === "good" ? Math.ceil(want / 2) : want);
      enemy.stolen = (enemy.stolen ?? 0) + stolen;
      tally.stolen += stolen;
      msgs.push(stolen > 0 ? `🦠 ${enemy.name} siphons ${stolen} credits! (carrying ${enemy.stolen})` : `🦠 ${enemy.name} finds your wallet empty.`);
      return { player: { ...player, credits: player.credits - stolen }, msgs };
    }
    let damage = Math.max(1, Math.floor((enemy.stats.atk - Math.floor(player.stats.def / 3)) * ENEMY_TUNING.damage));
    if (crit) damage = damage * 2;
    if (brace === "good") damage = Math.ceil(damage / 2);
    msgs.push(
      `${crit ? "CRITICAL HIT! " : ""}${enemy.name} hits for ${damage} damage.${brace === "good" ? " 🛡 Braced, damage halved." : brace === "miss" ? " (no brace)" : ""}`,
    );
    const p = { ...player, stats: { ...player.stats } };
    if (p.drone) {
      const soaked = Math.min(p.drone.hp, Math.ceil(damage / 2)); // it takes half the hit
      damage -= soaked;
      p.drone = p.drone.hp - soaked > 0 ? { ...p.drone, hp: p.drone.hp - soaked } : null;
      msgs.push(p.drone ? `🤖 Your drone soaks ${soaked} damage. [${p.drone.hp}/${p.drone.maxHp}]` : `🤖 Your drone soaks ${soaked} damage and is destroyed!`);
    }
    p.stats.hp -= damage;
    tally.taken += damage;
    if (damage > 0) emit("hit");

    // Status effects only stick when you didn't brace
    if (brace !== "good" && enemy.onHitEffect && !hasStatus(p.statusEffects, enemy.onHitEffect) && Math.random() < STATUS_CHANCE) {
      const eff: StatusEffect = {
        type: enemy.onHitEffect,
        turnsLeft: enemy.onHitEffect === "stun" ? 1 : 3,
        damage: enemy.onHitEffect === "burn" ? 5 : enemy.onHitEffect === "poison" ? 3 : enemy.onHitEffect === "bleed" ? 4 : 0,
      };
      p.statusEffects = [...p.statusEffects, eff];
      const icons: Record<string, string> = { poison: "☠", burn: "🔥", stun: "💫", slow: "🐌", bleed: "🩸" };
      msgs.push(`${icons[enemy.onHitEffect]} ${enemy.onHitEffect.toUpperCase()} applied!`);
    }

    return { player: p, msgs };
  }

  msgs.push(`${enemy.name} misses!`);
  return { player, msgs };
}

function isWalkable(state: GameState, x: number, y: number, floor: number): boolean {
  const map = state.maps[floor];
  if (y < 0 || y >= map.length) return false;
  const row = map[y];
  if (x < 0 || x >= row.length) return false;
  const ch = row[x];
  if (ch === "#") return false;
  if (ch === "D") {
    const door = state.doors.find((d) => d.x === x && d.y === y && d.floor === floor);
    if (door?.locked) return false;
  }
  return true;
}

function isTileFree(state: GameState, x: number, y: number, floor: number): boolean {
  if (!isWalkable(state, x, y, floor)) return false;
  if (state.maps[floor][y]?.[x] === SHRINE_WALL) return false; // only the player fits in the shrine
  if (state.player && state.player.x === x && state.player.y === y && state.player.floor === floor) return false;
  if (state.enemies.some(e => e.x === x && e.y === y && e.floor === floor && e.alive)) return false;
  if (state.npcs.some(n => n.x === x && n.y === y && n.floor === floor)) return false;
  if (state.merchants.some(m => m.x === x && m.y === y && m.floor === floor)) return false;
  if (state.uplinks.some(u => u.x === x && u.y === y && u.floor === floor)) return false;
  return true;
}

const AGGRO_RANGE = 7;

function moveEnemies(state: GameState): GameState {
  if (!state.player || state.mode !== "EXPLORE") return state;
  const p = state.player;
  let newPlayer = { ...p, stats: { ...p.stats } };
  let log = [...state.log];
  let combatEnemy: Enemy | null = null;

  // If player is stealthed, reduce aggro range
  const effectiveAggro = p.stealthMode ? Math.max(2, AGGRO_RANGE - Math.floor(p.stealth / 20)) : AGGRO_RANGE;

  const movedEnemies = state.enemies.map(e => {
    if (!e.alive || e.floor !== p.floor || combatEnemy) return e;
    const dist = Math.abs(e.x - newPlayer.x) + Math.abs(e.y - newPlayer.y);
    if (dist <= 1) { combatEnemy = { ...e }; return e; }
    if (dist <= effectiveAggro) {
      const dx = Math.sign(newPlayer.x - e.x);
      const dy = Math.sign(newPlayer.y - e.y);
      const moves = [
        { x: e.x + dx, y: e.y },
        { x: e.x, y: e.y + dy },
        { x: e.x + dx, y: e.y + dy },
      ].filter(m => dx !== 0 || m.x !== e.x || dy !== 0 || m.y !== e.y);
      for (const m of moves) {
        if (isTileFree({ ...state, player: newPlayer }, m.x, m.y, e.floor)) {
          return { ...e, x: m.x, y: m.y };
        }
      }
    }
    return e;
  });

  if (combatEnemy) {
    // Backstab bonus if stealthed
    const backstab = p.stealthMode && p.stealth > 50;
    const logMsgs = [
      "",
      backstab ? `═══ BACKSTAB AMBUSH! ═══` : `═══ AMBUSH! ═══`,
      `${combatEnemy.isBoss ? "⚠ BOSS: " : ""}${combatEnemy.name} [HP:${combatEnemy.stats.hp}/${combatEnemy.stats.maxHp} AC:${combatEnemy.ac}]`,
      "[A]ttack  [Q] Special  [F]lee  [4-9] Use item",
      "",
    ];
    chan(logMsgs, combatEnemy.fragment ? "fragment" : "fight", p);

    if (backstab) {
      // Free backstab damage
      const bsDmg = Math.floor(p.stats.atk * 2);
      combatEnemy = { ...combatEnemy, stats: { ...combatEnemy.stats, hp: combatEnemy.stats.hp - bsDmg } };
      logMsgs.splice(2, 0, `🗡 Backstab! ${bsDmg} sneak damage!`);
    }

    return {
      ...state,
      enemies: movedEnemies,
      player: { ...newPlayer, stealthMode: false, stealth: 0, comboCount: 0 },
      mode: "COMBAT",
      currentEnemy: combatEnemy,
      log: addLog({ ...state, log }, ...logMsgs),
    };
  }

  return { ...state, enemies: movedEnemies, player: newPlayer, log };
}

function trySpawnEnemy(state: GameState): GameState {
  if (!state.player) return state;
  const newTimer = state.spawnTimer - 1;
  if (newTimer > 0) return { ...state, spawnTimer: newTimer };

  const map = state.maps[state.player.floor];
  const attempts = 30;
  for (let i = 0; i < attempts; i++) {
    const ry = Math.floor(Math.random() * map.length);
    const rx = Math.floor(Math.random() * (map[ry]?.length ?? 0));
    const dist = Math.abs(rx - state.player.x) + Math.abs(ry - state.player.y);
    if (dist > 10 && dist < 20 && isTileFree(state, rx, ry, state.player.floor)) {
      const newEnemy = createRandomEnemy(state.player.floor, rx, ry, `${state.turnCount}`);
      return {
        ...state,
        enemies: [...state.enemies, newEnemy],
        spawnTimer: 14 + Math.floor(Math.random() * 10),
        log: addLog(state, ">> Warning: new hostile process detected <<"),
      };
    }
  }
  return { ...state, spawnTimer: 3 };
}

/* ----- Tick cooldowns ----- */
function tickCooldowns(player: Player): Player {
  return {
    ...player,
    skills: player.skills.map(s => ({
      ...s,
      currentCooldown: Math.max(0, s.currentCooldown - 1),
    })),
  };
}

/* =====================================================
   Combat round flow (shared by every combat action):
   startRound → player action → finishPlayerTurn
     → enemy dead?  killEnemy
     → final boss at 50% / 20%?  LOCKDOWN
     → enemy stunned?  back to COMBAT
     → otherwise  Brace QTE → QTE_RESOLVE → enemy attack
   ==================================================== */

interface Round {
  p: Player;
  enemy: Enemy;
  log: string[];
}

function copyRound(state: GameState): Round {
  const sp = state.player!;
  const se = state.currentEnemy!;
  return {
    p: { ...sp, stats: { ...sp.stats }, statusEffects: [...sp.statusEffects], skills: sp.skills.map(s => ({ ...s })), inventory: [...sp.inventory] },
    enemy: { ...se, stats: { ...se.stats }, statusEffects: [...(se.statusEffects || [])] },
    log: [...state.log],
  };
}

function die(state: GameState, p: Player, log: string[], killedBy?: string): GameState {
  const out = [...log, "", ">>> SYSTEM FAILURE — YOU DIED <<<"];
  chan(out, "death", p);
  return {
    ...state, mode: "GAME_OVER", player: p, currentEnemy: null, qte: null,
    runStats: { ...state.runStats, killedBy: killedBy ?? state.currentEnemy?.name ?? "a trap" },
    log: [...out, "Press [R] to restart."].slice(-LOG_LIMIT),
  };
}

/* Start of the player's combat turn: their status effects and cooldowns tick */
function startRound(state: GameState): (Round & { stunned: boolean }) | { over: GameState } {
  const round = copyRound(state);
  const tick = tickStatusEffects(round.p.statusEffects);
  round.p.statusEffects = tick.effects;
  round.p.stats.hp -= tick.damage;
  round.log.push(...tick.msgs);
  if (round.p.stats.hp <= 0) return { over: die(state, round.p, round.log) };
  round.p = tickCooldowns(round.p);
  if (tick.stunned) round.log.push("You're stunned and can't act!");
  return { ...round, stunned: tick.stunned };
}

/* All player damage goes through here: Glass Cannon, exposed (double), Vampiric Code */
function damageEnemy(enemy: Enemy, damage: number, log: string[], p?: Player): number {
  const boosted = hasPerk(p, "glass_cannon") ? Math.floor(damage * 1.5) : damage;
  const dealt = hasStatus(enemy.statusEffects, "exposed") ? boosted * 2 : boosted;
  if (dealt !== boosted) log.push(`🎯 EXPOSED! Double damage: ${dealt}`);
  enemy.stats.hp -= dealt;
  tally.dealt += dealt;
  if (p && hasPerk(p, "vampiric")) {
    const heal = Math.min(p.stats.maxHp - p.stats.hp, Math.floor(dealt * 0.1));
    if (heal > 0) { p.stats.hp += heal; log.push(`🩸 Vampiric Code drains ${heal} HP`); }
  }
  return dealt;
}

function isFinalBoss(enemy: Enemy): boolean {
  return enemy.id.startsWith("boss-");
}

function killEnemy(state: GameState, p: Player, enemy: Enemy, log: string[]): GameState {
  enemy.alive = false;
  p.xp += enemy.xpReward;
  log.push(`${enemy.name} destroyed! +${enemy.xpReward} XP`);
  const drop = creditDrop(!!enemy.isBoss, isFinalBoss(enemy));
  const credits = hasPerk(p, "credit_miner") ? Math.floor(drop * 1.5) : drop;
  if (credits > 0) {
    p.credits += credits;
    log.push(`💰 +${credits} credits (${p.credits} total)`);
  }
  if (enemy.behavior === "leech" && (enemy.stolen ?? 0) > 0) {
    p.credits += enemy.stolen! + LEECH_BOUNTY;
    log.push(`💰 Recovered ${enemy.stolen} stolen credits + ${LEECH_BOUNTY} bounty!`);
  }
  chan(log, "kill", p);
  if (enemy.loot) { p.inventory = [...p.inventory, enemy.loot]; log.push(`Loot: ${enemy.loot.name}`); }
  p.comboCount = 0;

  const { player: lvlP, log: lvlLog } = checkLevelUp(p, log);
  const enemies = state.enemies.map((e) => (e.id === enemy.id ? { ...e, alive: false } : e));
  const runStats = { ...state.runStats, creditsEarned: state.runStats.creditsEarned + credits };
  const base = { ...state, player: lvlP, enemies, currentEnemy: null, qte: null, runStats };

  if (isFinalBoss(enemy) && qualifiesForEnding(state)) {
    return {
      ...base, mode: "ENDING", ending: openEnding(),
      log: [...lvlLog, "", "NEXUS goes dark. The exit unlocks.", "Then every screen in the room turns pink.", `${ISW_CHAN_TAG} wait.`].slice(-LOG_LIMIT),
    };
  }
  if (isFinalBoss(enemy)) {
    return {
      ...base, mode: "WIN",
      log: [...lvlLog, "", "╔══════════════════════════════════════╗", "║     NEXUS DESTROYED — YOU WIN!      ║", "║   The mainframe is yours, runner.   ║", "╚══════════════════════════════════════╝"].slice(-LOG_LIMIT),
    };
  }
  if (enemy.isBoss) {
    lvlLog.push(`>>> MINI-BOSS ${enemy.name} DEFEATED! <<<`);
    if (enemy.loot) lvlLog.push(`Legendary loot: ${enemy.loot.name}!`);
  }
  return { ...base, mode: "EXPLORE", log: lvlLog.slice(-LOG_LIMIT) };
}

/* ISW-Chan cheats, depending on her mood (docs/isw-chan-canon.md):
   attached: once per floor she heals you when a fight goes badly;
   cold: now and then she taxes your credits or fakes an alarm while you explore. */
const CHAN_HEAL_BELOW = 0.3;
const CHAN_HEAL = 0.2;
const CHAN_PRANK_CHANCE = 0.015;
export function chanMeddles(prev: GameState, next: GameState, action: GameAction): GameState {
  const p = next.player;
  if (!p || next.talk) return next;
  const mood = moodOf(next.iswAffection);
  if (next.iswAffection === undefined || mood === "curious") return next;
  if (mood === "attached" && next.mode === "COMBAT" && p.stats.hp > 0 && p.stats.hp < p.stats.maxHp * CHAN_HEAL_BELOW && next.iswHelpedFloor !== p.floor) {
    const heal = Math.floor(p.stats.maxHp * CHAN_HEAL);
    return {
      ...next, iswHelpedFloor: p.floor,
      player: { ...p, stats: { ...p.stats, hp: p.stats.hp + heal } },
      log: addLog(next, `${ISW_CHAN_TAG} ugh. don't die on me, it's embarrassing. (+${heal} HP)`),
    };
  }
  if (mood === "cold" && action.type === "MOVE" && next.mode === "EXPLORE" && prev.mode === "EXPLORE" && Math.random() < CHAN_PRANK_CHANCE) {
    if (p.credits >= 10 && Math.random() < 0.5) {
      const tax = Math.min(p.credits, 5 + Math.floor(Math.random() * 11));
      return { ...next, player: { ...p, credits: p.credits - tax }, log: addLog(next, `${ISW_CHAN_TAG} Mainframe tax. -${tax} credits :)`) };
    }
    return { ...next, log: addLog(next, "═══ ⚠ INTRUDER COUNTERMEASURES ARMED ═══", `${ISW_CHAN_TAG} ...kidding. Your face, though.`) };
  }
  return next;
}

function startLockdown(state: GameState, p: Player, enemy: Enemy, log: string[]): GameState {
  const phase = enemy.lockdownPhase!; // already incremented
  const type = LOCKDOWN_CIPHERS[Math.floor(Math.random() * LOCKDOWN_CIPHERS.length)];
  const puzzle = createPuzzle(0, -1, -1, `lockdown-${phase}`, type);
  const seconds = LOCKDOWN_MS[phase - 1] / 1000;
  return {
    ...state, mode: "LOCKDOWN", player: p, currentEnemy: enemy, qte: null,
    currentPuzzle: puzzle, puzzleInput: "", lockdownMs: LOCKDOWN_MS[phase - 1],
    log: [
      ...log, "",
      `⚠⚠ ${enemy.name} INITIATES LOCKDOWN ${phase}/${LOCKDOWN_AT.length} ⚠⚠`,
      `Crack the cipher within ${seconds}s or it repairs itself.`,
      puzzle.hint, "",
    ].slice(-LOG_LIMIT),
  };
}

/* End of the player's turn: enemy DoTs, death, lockdown, stun, otherwise the enemy attacks (sometimes with a Brace prompt) */
function finishPlayerTurn(state: GameState, p: Player, enemy: Enemy, log: string[]): GameState {
  if (p.drone && enemy.stats.hp > 0) {
    const zap = damageEnemy(enemy, Math.floor(p.stats.int * 0.35) + 1, [], p);
    log.push(`🤖 Drone zaps ${enemy.name} for ${zap}`);
  }
  const tick = tickStatusEffects(enemy.statusEffects);
  enemy.statusEffects = tick.effects;
  enemy.stats.hp -= tick.damage;
  log.push(...tick.msgs.map((m) => `[${enemy.name}] ${m}`));

  if (enemy.stats.hp <= 0) return killEnemy(state, p, enemy, log);

  const phase = enemy.lockdownPhase ?? 0;
  if (isFinalBoss(enemy) && phase < LOCKDOWN_AT.length && enemy.stats.hp <= enemy.stats.maxHp * LOCKDOWN_AT[phase]) {
    enemy.lockdownPhase = phase + 1;
    return startLockdown(state, p, enemy, log);
  }

  if (tick.stunned) {
    return { ...state, mode: "COMBAT", qte: null, player: p, currentEnemy: enemy, log: log.slice(-LOG_LIMIT) };
  }

  // A Leech Bot with your credits tries to run: catch it with the Grab QTE
  if (enemy.behavior === "leech" && (enemy.stolen ?? 0) > 0 && !enemy.grabbed && Math.random() < LEECH_FLEE_CHANCE) {
    return {
      ...state, mode: "QTE", qte: createQte("grab", p.floor, Math.random, qteMods(p)), player: p, currentEnemy: enemy,
      log: [...log, `🦠 ${enemy.name} bolts for the exit with ${enemy.stolen} of your credits! GRAB IT: mash [SPACE]!`].slice(-LOG_LIMIT),
    };
  }

  const paranoid = hasPerk(p, "paranoia");
  if (Math.random() < (paranoid ? PARANOIA_BRACE_CHANCE : BRACE_CHANCE)) {
    tally.braces += 1;
    const mods = qteMods(p);
    const qte = createQte("brace", p.floor, Math.random, paranoid ? { windowMult: (mods.windowMult ?? 1) * 0.6, perfectFrac: 0.12 } : mods);
    return {
      ...state, mode: "QTE", qte, player: p, currentEnemy: enemy,
      log: [...log, `⚠ ${enemy.name} winds up a heavy attack... BRACE! [SPACE]`].slice(-LOG_LIMIT),
    };
  }

  const { player: hitP, msgs } = enemyAttackRoll(enemy, p, null);
  log.push(...msgs);
  if (hitP.stats.hp <= 0) return die(state, hitP, log);
  return { ...state, mode: "COMBAT", qte: null, player: hitP, currentEnemy: enemy, log: log.slice(-LOG_LIMIT) };
}

const QTE_INSTRUCTIONS: Record<string, string> = {
  hack: "Type the code before the ICE closes!",
  gauge: "Hit [SPACE] when the needle is in the green!",
  combo: "Memorise the arrows, then repeat them!",
  shell: "Something broke. Type the command that fixes it!",
};

/* Class special, scaled by how well the QTE went. Keyed by QTE kind so the
   Script Kiddie can borrow any of them. */
function applySpecial(p: Player, enemy: Enemy, log: string[], qte: Qte, result: QteResult, accuracy: number) {
  const tag = result === "perfect" ? " ★PERFECT★" : result === "miss" ? " (fumbled)" : "";
  if (p.className === "Script Kiddie") log.push(">> COPY-PASTE EXPLOIT: borrowing someone else's moves...");
  switch (qte.kind) {
    case "hack": {
      const matched = Math.round(accuracy * qte.prompt.length);
      const dmg = Math.round(p.stats.int * 2 * (0.5 + accuracy)) + (result === "perfect" ? rollDice(8, 2) : 0);
      const dealt = damageEnemy(enemy, Math.max(1, dmg), log, p);
      log.push(`>> ICE Breaker — ${matched}/${qte.prompt.length} hacked${tag} — ${dealt} pure damage <<`);
      break;
    }
    case "gauge": {
      // A missed gauge backfires: no damage to the enemy, the whole surge goes into you
      if (result === "miss") {
        const backfire = Math.floor(p.stats.atk * 1.5);
        p.stats.hp = Math.max(1, p.stats.hp - backfire);
        tally.taken += backfire;
        emit("backfire");
        log.push(`>> OVERCLOCK BACKFIRE! The surge hits you for ${backfire} damage <<`);
        break;
      }
      const mult = result === "perfect" ? 3.5 : 3;
      const recoil = result === "perfect" ? 0 : Math.floor(p.stats.atk * 0.6);
      const dealt = damageEnemy(enemy, Math.max(1, Math.floor(p.stats.atk * mult) - Math.floor(enemy.stats.def / 3)), log, p);
      p.stats.hp = Math.max(1, p.stats.hp - recoil);
      log.push(`>> OVERCLOCK x${mult}${tag} — ${dealt} damage, ${recoil} recoil <<`);
      break;
    }
    case "combo": {
      const hits = Math.round(accuracy * qte.prompt.length);
      const dealt = damageEnemy(enemy, Math.floor(p.stats.atk * 1.0) + hits * Math.floor(p.stats.atk * 0.25), log, p);
      log.push(`>> SHADOW COMBO ${hits}/${qte.prompt.length}${tag} — ${dealt} damage <<`);
      if (result === "perfect" && !hasStatus(enemy.statusEffects, "bleed")) {
        enemy.statusEffects = [...enemy.statusEffects, { type: "bleed", turnsLeft: 3, damage: 6 }];
        log.push("🩸 Full combo! Enemy is bleeding.");
      }
      break;
    }
    case "shell": {
      if (result === "miss") {
        log.push(`>> Segmentation fault (core dumped). Nothing fixed.`);
        break;
      }
      const maxHp = 12 + p.level * 4;
      if (!p.drone) {
        p.drone = { hp: maxHp, maxHp };
        log.push(`>> Fixed${tag}! 🤖 Drone deployed [${maxHp} HP]. It soaks hits and zaps enemies.`);
      } else {
        p.drone = { hp: maxHp, maxHp };
        const dealt = damageEnemy(enemy, Math.floor(p.stats.int * (result === "perfect" ? 3 : 2)), log, p);
        log.push(`>> Fixed${tag}! 🤖 Drone repaired and fires a full volley: ${dealt} damage.`);
      }
      break;
    }
  }
  p.comboCount += 1;
}

/* sudo rm -rf /* — deletes the enemy (or half the final boss), the drone and nearly you */
function nuke(state: GameState, p: Player, enemy: Enemy, log: string[]): GameState {
  emit("nuke");
  log.push(
    ">> removing /bin... /boot... /etc... /home/isw-chan... /usr... /var...",
    ">> rm: cannot remove '/proc/1': Operation not permitted",
    ">> SYSTEM UNSTABLE",
  );
  chan(log, "nuke", p);
  p.drone = null;
  p.stats.hp = 1;
  if (isFinalBoss(enemy)) {
    damageEnemy(enemy, Math.floor(enemy.stats.maxHp * 0.5), log, p);
    log.push(`${enemy.name} survives with half its filesystem gone.`);
  } else {
    enemy.stats.hp = 0;
    log.push(`${enemy.name} was deleted.`);
  }
  return finishPlayerTurn(state, p, enemy, log);
}

/* ----- Merchant helpers ----- */
function merchantName(floor: number): string {
  return SHOPKEEPERS[floor % SHOPKEEPERS.length].name;
}

function withMerchant(state: GameState, update: (m: GameState["merchants"][number]) => GameState["merchants"][number]): GameState["merchants"] {
  return state.merchants.map((m) => (m.id === state.currentMerchant ? update(m) : m));
}

/* A Leech Bot that got away: it hides elsewhere on the floor, carrying your credits */
function leechEscapes(state: GameState, p: Player, enemy: Enemy, log: string[]): GameState {
  const map = state.maps[p.floor];
  let spot = { x: enemy.x, y: enemy.y };
  for (let i = 0; i < 60; i++) {
    const y = Math.floor(Math.random() * map.length);
    const x = Math.floor(Math.random() * map[y].length);
    if (Math.abs(x - p.x) + Math.abs(y - p.y) >= 8 && isTileFree(state, x, y, p.floor)) { spot = { x, y }; break; }
  }
  const fled = { ...enemy, ...spot, name: `Leech Bot [${enemy.stolen} cr]` };
  log.push(`🦠 ${enemy.name} escapes with ${enemy.stolen} credits! It's hiding somewhere on this floor.`);
  chan(log, "leech", p);
  return {
    ...state, mode: "EXPLORE", player: p, currentEnemy: null,
    enemies: state.enemies.map((e) => (e.id === enemy.id ? fled : e)),
    log: [...log, ""].slice(-LOG_LIMIT),
  };
}

/* ----- Main reducer: the step itself, plus the bookkeeping every step shares ----- */
export function gameReducer(state: GameState, action: GameAction): GameState {
  pendingFx = null;
  tally = { dealt: 0, taken: 0, stolen: 0, spent: 0, braces: 0, perfectBraces: 0 };
  setMood(moodOf(action.type === "SELECT_CLASS" ? action.affection : state.iswAffection));
  let next = reduce(state, action);
  if (next === state) return state;
  next = chanMeddles(state, next, action);

  // Level-ups wait for a calm moment to offer their perk
  if (next.mode === "EXPLORE" && next.player && next.player.pendingPerks > 0 && !next.perkChoices) {
    const choices = rollPerkChoices(next.player);
    if (choices.length > 0) {
      next = { ...next, mode: "PERK", perkChoices: choices, log: addLog(next, "", "═══ LEVEL UP: CHOOSE A PERK ═══") };
    } else {
      next = { ...next, player: { ...next.player, pendingPerks: 0 } };
    }
  }
  // Social Engineer runs live in the talk view between fights, shops and terminals
  if (next.talk && next.mode === "EXPLORE") next = { ...next, mode: "TALK" };

  if (pendingFx) next = { ...next, fx: { kind: pendingFx, id: (state.fx?.id ?? 0) + 1 } };
  if (Object.values(tally).some((v) => v > 0)) {
    const r = next.runStats;
    next = {
      ...next,
      runStats: {
        ...r,
        damageDealt: r.damageDealt + tally.dealt, damageTaken: r.damageTaken + tally.taken,
        creditsStolen: r.creditsStolen + tally.stolen, creditsSpent: r.creditsSpent + tally.spent,
        bracesFaced: r.bracesFaced + tally.braces, perfectBraces: r.perfectBraces + tally.perfectBraces,
      },
    };
  }
  return next;
}

function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    /* === CLASS SELECTION === */
    case "SELECT_CLASS": {
      const cls = CLASS_DATA[action.className];
      const { playerStart } = parseFloor(0);
      const player: Player = {
        className: action.className,
        stats: { ...cls.stats },
        level: 1,
        xp: 0,
        xpToNext: 30,
        inventory: [
          { id: "start-heal-1", name: "NanoMed Kit", description: "Restores 20 HP", type: "heal", value: 20 },
          { id: "start-heal-2", name: "NanoMed Kit", description: "Restores 20 HP", type: "heal", value: 20 },
        ],
        x: playerStart.x,
        y: playerStart.y,
        floor: 0,
        hasKeycard: false,
        statusEffects: [],
        skills: cls.skills.map(s => ({ ...s })),
        stealth: 0,
        stealthMode: false,
        comboCount: 0,
        credits: 0,
        perks: [],
        pendingPerks: 0,
        drone: null,
      };
      if (action.className === "Social Engineer") {
        return startTalk({ ...state, player, flagsFound: action.flagsFound ?? 0, iswAffection: action.affection });
      }
      return {
        ...state,
        mode: "EXPLORE",
        player,
        flagsFound: action.flagsFound ?? 0,
        iswAffection: action.affection,
        log: addLog(
          state,
          "",
          `Class selected: ${action.className}`,
          cls.desc,
          `Special ability: ${cls.special}`,
          `MP: ${cls.stats.maxMp} | Skills: ${cls.skills.map(s => s.name).join(", ")}`,
          "",
          `--- ${FLOOR_NAMES[0]} ---`,
          "WASD/arrows: Move | I: Inventory | X: Stealth",
          "Combat: A:Attack Q/1:Special 2-3:Skills F:Flee",
          "Heavy enemy attacks can be braced: hit [SPACE] on the cue.",
          "Walk into T (terminals) to solve cipher puzzles, $ to shop.",
          "Found a flag on the ISW website? Upload it at a U (uplink).",
          ""
        ),
      };
    }

    /* === MOVEMENT === */
    case "MOVE": {
      if (state.mode !== "EXPLORE" || !state.player) return state;
      const p = state.player;
      const nx = p.x + action.dx;
      const ny = p.y + action.dy;

      // Stealth meter increases while moving stealthed
      let stealthUpdate = { ...p };
      if (p.stealthMode) {
        const newStealth = Math.max(0, p.stealth - 3);
        stealthUpdate = { ...stealthUpdate, stealth: newStealth };
        if (newStealth <= 0) {
          stealthUpdate.stealthMode = false;
          return { ...state, player: stealthUpdate, log: addLog(state, "⚠ Stealth depleted! You've been detected!") };
        }
      }

      // Check for puzzle terminal
      const puzzle = state.puzzles.find(pz => pz.x === nx && pz.y === ny && pz.floor === p.floor && !pz.solved);
      if (puzzle) {
        return {
          ...state,
          mode: "PUZZLE",
          currentPuzzle: puzzle,
          puzzleInput: "",
          player: stealthUpdate,
          log: addLog(state, "", "═══ TERMINAL HACK ═══", `Type: ${puzzle.type.toUpperCase()} cipher`, puzzle.hint, "", "Type the decrypted answer. [ESC] to quit."),
        };
      }

      // Check for merchant
      const merchant = state.merchants.find(m => m.x === nx && m.y === ny && m.floor === p.floor);
      if (merchant) {
        const greeting = greetingLine(merchant, p, state.flagsFound);
        return {
          ...state,
          mode: "SHOP",
          player: stealthUpdate,
          currentMerchant: merchant.id,
          merchants: state.merchants.map(m => m.id === merchant.id ? { ...m, visits: m.visits + 1 } : m),
          haggle: null,
          puzzleInput: "",
          shopLine: greeting,
          log: addLog(state, "", `═══ SHOP: ${merchantName(merchant.floor)} ═══`, `"${greeting}"`),
        };
      }

      // Check for flag uplink
      if (state.uplinks.some(u => u.x === nx && u.y === ny && u.floor === p.floor)) {
        return {
          ...state,
          mode: "UPLINK",
          player: stealthUpdate,
          puzzleInput: "",
          log: addLog(state, "", "═══ ISW UPLINK ═══", "Flags hidden on the ISW website can be uploaded here.", "Each accepted flag adds 2500 to the score you submit.", "Type the flag · ENTER to upload · ESC to disconnect", ""),
        };
      }

      // Check for locked door interaction
      const door = state.doors.find((d) => d.x === nx && d.y === ny && d.floor === p.floor);
      if (door?.locked) {
        if (p.hasKeycard) {
          const newDoors = state.doors.map((d) => d === door ? { ...d, locked: false } : d);
          const newMaps = state.maps.map((m, i) => {
            if (i !== p.floor) return m;
            return m.map((row, ry) => {
              if (ry !== ny) return row;
              return row.substring(0, nx) + "." + row.substring(nx + 1);
            });
          });
          return {
            ...state,
            doors: newDoors,
            maps: newMaps,
            player: { ...stealthUpdate, hasKeycard: false },
            log: addLog(state, ">> KEYCARD used. Door unlocked. <<"),
          };
        }
        return { ...state, log: addLog(state, "Door is locked. Find a KEYCARD.") };
      }

      if (!isWalkable(state, nx, ny, p.floor)) return state;

      // Check for enemy at target
      const enemy = state.enemies.find(
        (e) => e.x === nx && e.y === ny && e.floor === p.floor && e.alive
      );
      if (enemy) {
        const backstab = p.stealthMode && p.stealth > 30;
        let combatEnemy = { ...enemy, stats: { ...enemy.stats }, statusEffects: [...enemy.statusEffects] };
        const logMsgs = [
          "",
          backstab ? `═══ BACKSTAB! ═══` : `═══ COMBAT ═══`,
          `${enemy.isBoss ? "⚠ BOSS: " : ""}${enemy.name} [HP:${enemy.stats.hp}/${enemy.stats.maxHp} AC:${enemy.ac}]`,
          "[A]ttack  [Q] Special  [F]lee  [4-9] Use item",
          "",
        ];

        if (backstab) {
          const bsDmg = Math.floor(p.stats.atk * 2.5);
          combatEnemy.stats.hp -= bsDmg;
          logMsgs.splice(2, 0, `🗡 Backstab strike! ${bsDmg} sneak damage!`);
        }
        chan(logMsgs, enemy.fragment ? "fragment" : "fight", p);

        return {
          ...state,
          mode: "COMBAT",
          currentEnemy: combatEnemy,
          player: { ...stealthUpdate, stealthMode: false, stealth: 0, comboCount: 0 },
          log: addLog(state, ...logMsgs),
        };
      }

      // Check for NPC at target
      const npc = state.npcs.find((n) => n.x === nx && n.y === ny && n.floor === p.floor);
      if (npc) {
        const talkCount = npc.talkCount;
        const updatedNpcs = state.npcs.map((n) =>
          n.id === npc.id ? { ...n, talkCount: n.talkCount + 1 } : n
        );

        if (talkCount >= 3) {
          const annoyedLine = getAnnoyedLine();
          return { ...state, npcs: updatedNpcs, log: addLog(state, "", `${npc.name}: "${annoyedLine}"`, "") };
        }

        const node = npc.dialogueTree[0];
        if (!node) return state;

        return {
          ...state,
          mode: "DIALOGUE",
          currentNPC: { ...npc, talkCount: talkCount + 1 },
          dialogueIndex: 0,
          dialogueChoices: node.choices || null,
          npcs: updatedNpcs,
          player: stealthUpdate,
          log: addLog(state, "", ...node.npcText, ""),
        };
      }

      // Move player
      const movedPlayer = { ...stealthUpdate, x: nx, y: ny };
      let newLog = state.log;
      let newGroundItems = state.groundItems;
      let diaryFound = state.diaryFound;

      // Check for ground item pickup
      const gItem = state.groundItems.find(
        (i) => i.x === nx && i.y === ny && i.floor === p.floor && !i.picked
      );
      if (gItem) {
        newGroundItems = state.groundItems.map((i) => i === gItem ? { ...i, picked: true } : i);
        if (gItem.type === "diary") {
          const page = DIARY[gItem.value];
          newLog = addLog({ ...state, log: newLog }, "", `📖 ${gItem.name} — ISW-Chan's diary, ${page.date}`, ...page.lines.map((l) => `   ${l}`), "");
          diaryFound = [...new Set([...(diaryFound ?? []), gItem.value])];
        } else if (gItem.type === "keycard") {
          movedPlayer.hasKeycard = true;
          newLog = addLog({ ...state, log: newLog }, `Picked up: ${gItem.name}`);
        } else if (gItem.type === "weapon") {
          movedPlayer.stats = { ...movedPlayer.stats, atk: movedPlayer.stats.atk + gItem.value };
          newLog = addLog({ ...state, log: newLog }, `Equipped: ${gItem.name} (+${gItem.value} ATK)`);
        } else if (gItem.type === "armor") {
          movedPlayer.stats = { ...movedPlayer.stats, def: movedPlayer.stats.def + gItem.value };
          newLog = addLog({ ...state, log: newLog }, `Equipped: ${gItem.name} (+${gItem.value} DEF)`);
        } else {
          movedPlayer.inventory = [...movedPlayer.inventory, { ...gItem }];
          newLog = addLog({ ...state, log: newLog }, `Picked up: ${gItem.name}`);
        }
      }

      // Check for trap
      let newTraps = state.traps;
      const trap = state.traps.find(t => t.x === nx && t.y === ny && t.floor === p.floor && !t.triggered);
      if (trap) {
        const trapInfo = TRAP_DATA[p.floor] || TRAP_DATA[0];
        movedPlayer.stats = { ...movedPlayer.stats, hp: movedPlayer.stats.hp - trapInfo.damage };
        newLog = addLog({ ...state, log: newLog }, trapInfo.message);
        newTraps = state.traps.map(t => t === trap ? { ...t, triggered: true } : t);
        if (trapInfo.statusEffect) {
          const eff = { type: trapInfo.statusEffect, turnsLeft: 3, damage: trapInfo.statusEffect === "burn" ? 5 : trapInfo.statusEffect === "poison" ? 3 : 0 };
          movedPlayer.statusEffects = [...movedPlayer.statusEffects, eff];
        }
        if (movedPlayer.stats.hp <= 0) {
          return die({ ...state, traps: newTraps }, movedPlayer, newLog, "a trap");
        }
      }

      // ISW-Chan's shrine
      let shrineFound = state.shrineFound;
      if (state.maps[p.floor][ny]?.[nx] === SHRINE_WALL) {
        newLog = addLog({ ...state, log: newLog }, "", ...SHRINE_LINES,
          `[ISW-Chan] ...you found it. Don't tell anyone. ${xorReveal(SHRINE_NOTE, "shrine")}`, "");
        shrineFound = true;
      }

      // Check for stairs
      const map = state.maps[p.floor];
      if (map[ny]?.[nx] === ">") {
        const nextFloor = p.floor + 1;
        if (nextFloor >= FLOOR_MAPS.length) {
          return { ...state, mode: "WIN", log: addLog(state, "You escaped the mainframe!") };
        }
        const parsed = parseFloor(nextFloor, state.seed);
        const restored = {
          ...movedPlayer.stats,
          hp: Math.min(movedPlayer.stats.maxHp, movedPlayer.stats.hp + Math.floor(movedPlayer.stats.maxHp * STAIRS_RESTORE)),
          mp: Math.min(movedPlayer.stats.maxMp, movedPlayer.stats.mp + Math.floor(movedPlayer.stats.maxMp * STAIRS_RESTORE)),
        };
        return {
          ...state,
          player: {
            ...movedPlayer,
            stats: restored,
            floor: nextFloor,
            x: parsed.playerStart.x,
            y: parsed.playerStart.y,
            hasKeycard: false,
          },
          enemies: [...state.enemies, ...decorateFloor(parsed.enemies, nextFloor)],
          npcs: [...state.npcs, ...parsed.npcs],
          groundItems: [...newGroundItems, ...parsed.groundItems],
          doors: [...state.doors, ...parsed.doors],
          puzzles: [...state.puzzles, ...parsed.puzzles],
          traps: [...newTraps, ...parsed.traps],
          merchants: [...state.merchants, ...parsed.merchants],
          uplinks: [...state.uplinks, ...parsed.uplinks],
          log: addLog({ ...state, log: newLog }, "", `>>> Descending to ${FLOOR_NAMES[nextFloor]} <<<`, ">> Checkpoint: 30% HP & MP restored <<", ...[nextFloor === 1 ? "[ISW-Chan] I hid something of mine in this floor's walls. Behind the worn one. ...Forget I said that." : taunt("floor", p.className)].filter((t): t is string => !!t), ""),
          turnCount: state.turnCount + 1,
        };
      }

      // After player moves, move enemies + try spawn
      let newState: GameState = {
        ...state,
        player: movedPlayer,
        groundItems: newGroundItems,
        traps: newTraps,
        log: newLog,
        turnCount: state.turnCount + 1,
        shrineFound,
        diaryFound,
      };

      newState = moveEnemies(newState);
      if (newState.mode === "EXPLORE") {
        newState = trySpawnEnemy(newState);
      }

      return newState;
    }

    /* === COMBAT: ATTACK === */
    case "ATTACK": {
      if (state.mode !== "COMBAT" || !state.player || !state.currentEnemy) return state;
      const round = startRound(state);
      if ("over" in round) return round.over;
      const { p, enemy, log } = round;

      if (!round.stunned) {
        const atkResult = playerAttackRoll(p, enemy);
        log.push(...atkResult.msgs);
        if (atkResult.hit) {
          if (atkResult.crit) emit("crit");
          damageEnemy(enemy, atkResult.damage, log, p);
          p.comboCount += 1;
          log.push(`[Enemy HP: ${Math.max(0, enemy.stats.hp)}/${enemy.stats.maxHp}]`);
        } else {
          p.comboCount = 0; // combo broken
        }
      }
      return finishPlayerTurn(state, p, enemy, log);
    }

    /* === COMBAT: SPECIAL (Q / 1 — skill 0, costs MP, class QTE) === */
    case "SPECIAL": {
      if (state.mode !== "COMBAT" || !state.player || !state.currentEnemy) return state;
      const skill = state.player.skills[0];
      if (!skill) return state;
      if (skill.currentCooldown > 0) {
        return { ...state, log: addLog(state, `${skill.name} on cooldown (${skill.currentCooldown} turns)`) };
      }
      if (state.player.stats.mp < skill.mpCost) {
        return { ...state, log: addLog(state, `Not enough MP! Need ${skill.mpCost}, have ${state.player.stats.mp}`) };
      }

      const round = startRound(state);
      if ("over" in round) return round.over;
      const { p, enemy, log } = round;
      if (round.stunned) return finishPlayerTurn(state, p, enemy, log);

      p.stats.mp -= skill.mpCost;
      p.skills[0] = { ...p.skills[0], currentCooldown: skill.cooldown };
      const classKind = CLASS_QTE[p.className];
      const kind: QteKind = classKind === "random" ? COPYABLE_QTES[Math.floor(Math.random() * COPYABLE_QTES.length)] : classKind;
      return {
        ...state, mode: "QTE", qte: createQte(kind, p.floor, Math.random, qteMods(p)), player: p, currentEnemy: enemy,
        log: [...log, `>> ${skill.name}! [-${skill.mpCost} MP] ${QTE_INSTRUCTIONS[kind]}`].slice(-LOG_LIMIT),
      };
    }

    /* === QUICK-TIME EVENT RESULT === */
    case "QTE_RESOLVE": {
      if (state.mode !== "QTE" || !state.qte || !state.player || !state.currentEnemy) return state;
      const qte = state.qte;
      const perfect = action.result === "perfect";
      const runStats = perfect ? { ...state.runStats, perfects: state.runStats.perfects + 1 } : state.runStats;
      const next = { ...state, qte: null, runStats };
      const { p, enemy, log } = copyRound(next);
      if (perfect) { emit("perfect"); chan(log, "perfect", p); }

      if (qte.context === "grab") {
        if (action.result !== "miss") {
          enemy.grabbed = true;
          enemy.statusEffects = [...enemy.statusEffects, { type: "stun", turnsLeft: 1 }];
          log.push(`🖐 GRABBED! ${enemy.name} is pinned and can't run anymore.`);
          return { ...next, mode: "COMBAT", player: p, currentEnemy: enemy, log: log.slice(-LOG_LIMIT) };
        }
        return leechEscapes(next, p, enemy, log);
      }

      if (qte.context === "special") {
        const egg = qte.kind === "shell" && action.text ? rmEgg(action.text) : null;
        if (egg === "nuke") return nuke(next, p, enemy, log);
        if (egg === "refused") {
          log.push(">> rm: it is dangerous to operate recursively on '/'", ">> rm: use --no-preserve-root to override this failsafe");
        } else {
          applySpecial(p, enemy, log, qte, action.result, action.accuracy);
        }
        if (perfect && hasPerk(p, "overcharge")) {
          p.stats.mp = Math.min(p.stats.maxMp, p.stats.mp + p.skills[0].mpCost);
          log.push(`⚡ Overcharge: +${p.skills[0].mpCost} MP refunded`);
        }
        return finishPlayerTurn(next, p, enemy, log);
      }

      if (perfect) tally.perfectBraces += 1;
      const { player: hitP, msgs } = enemyAttackRoll(enemy, p, action.result);
      log.push(...msgs);
      if (hitP.stats.hp <= 0) return die(next, hitP, log);
      // Paranoia pays off: a perfect brace hits back
      if (perfect && hasPerk(hitP, "paranoia")) {
        const counter = damageEnemy(enemy, hitP.stats.atk, log, hitP);
        log.push(`👁 Paranoia counter-attack! ${counter} damage.`);
        if (enemy.stats.hp <= 0) return killEnemy(next, hitP, enemy, log);
      }
      return { ...next, mode: "COMBAT", player: hitP, currentEnemy: enemy, log: log.slice(-LOG_LIMIT) };
    }

    /* === COMBAT: SKILL (1-3 mapped to skills) === */
    case "SKILL": {
      if (state.mode !== "COMBAT" || !state.player || !state.currentEnemy) return state;
      const skillIdx = action.skillIndex;
      if (skillIdx === 0) return reduce(state, { type: "SPECIAL" });
      const skill = state.player.skills[skillIdx];
      if (!skill) return state;

      if (skill.currentCooldown > 0) {
        return { ...state, log: addLog(state, `${skill.name} on cooldown (${skill.currentCooldown} turns)`) };
      }
      if (state.player.stats.mp < skill.mpCost) {
        return { ...state, log: addLog(state, `Not enough MP! Need ${skill.mpCost}, have ${state.player.stats.mp}`) };
      }

      const round = startRound(state);
      if ("over" in round) return round.over;
      const { p, enemy, log } = round;
      if (round.stunned) return finishPlayerTurn(state, p, enemy, log);

      p.stats.mp -= skill.mpCost;
      p.skills[skillIdx] = { ...p.skills[skillIdx], currentCooldown: skill.cooldown };

      switch (skill.name) {
        case "Virus Upload": {
          enemy.statusEffects = [...enemy.statusEffects, { type: "poison", turnsLeft: 3, damage: 5 }];
          log.push(`>> Virus Upload! Enemy poisoned for 3 turns [-${skill.mpCost} MP] <<`);
          break;
        }
        case "Firewall": {
          p.stats.def += 5;
          log.push(`>> Firewall activated! +5 DEF for this fight [-${skill.mpCost} MP] <<`);
          break;
        }
        case "Chrome Slam": {
          const dealt = damageEnemy(enemy, Math.floor(p.stats.atk * 1.5), log, p);
          enemy.statusEffects = [...enemy.statusEffects, { type: "stun", turnsLeft: 1 }];
          log.push(`>> Chrome Slam! ${dealt} damage + STUN [-${skill.mpCost} MP] <<`);
          break;
        }
        case "Repair Nanites": {
          const heal = Math.floor(p.stats.maxHp * 0.25);
          p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + heal);
          log.push(`>> Repair Nanites! Healed ${heal} HP [-${skill.mpCost} MP] <<`);
          break;
        }
        case "Smoke Bomb": {
          log.push(`>> Smoke Bomb! Guaranteed escape [-${skill.mpCost} MP] <<`, "You vanish into the smoke!");
          return { ...state, mode: "EXPLORE", player: { ...p, stealthMode: true, stealth: 80 }, currentEnemy: null, log: log.slice(-LOG_LIMIT) };
        }
        case "Poison Blade": {
          const dealt = damageEnemy(enemy, p.stats.atk + rollDice(6), log, p);
          enemy.statusEffects = [...enemy.statusEffects, { type: "poison", turnsLeft: 3, damage: 4 }];
          log.push(`>> Poison Blade! ${dealt} damage + POISON [-${skill.mpCost} MP] <<`);
          break;
        }
        case "kill -9": {
          const dealt = damageEnemy(enemy, p.stats.int * 2, log, p);
          log.push(`>> kill -9 ${enemy.name.replace(/\W+/g, "_").toLowerCase()}: ${dealt} damage [-${skill.mpCost} MP] <<`);
          break;
        }
        case "Restore Backup": {
          const heal = Math.floor(p.stats.maxHp * 0.3);
          p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + heal);
          log.push(`>> Restored from last night's backup: +${heal} HP [-${skill.mpCost} MP] <<`);
          break;
        }
        case "Google It": {
          const roll = Math.random();
          if (roll < 0.34) {
            const heal = Math.floor(p.stats.maxHp * 0.25);
            p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + heal);
            log.push(`>> Google It: "how to not die" — top answer works! +${heal} HP <<`);
          } else if (roll < 0.67) {
            const dealt = damageEnemy(enemy, Math.floor(p.stats.atk * 2.5), log, p);
            log.push(`>> Google It: found an exploit on page 2 of the results! ${dealt} damage <<`);
          } else {
            enemy.statusEffects = [...enemy.statusEffects, { type: "stun", turnsLeft: 1 }];
            log.push(`>> Google It: asked a forum. ${enemy.name} is so confused by the replies it can't move. <<`);
          }
          break;
        }
        case "LOIC": {
          const hits = [0, 1, 2].map(() => damageEnemy(enemy, Math.max(1, Math.floor(p.stats.atk * 0.7)), log, p));
          log.push(`>> LOIC: DDoS! ${hits.join(" + ")} damage [-${skill.mpCost} MP] <<`);
          break;
        }
        case "Smooth Talk": {
          enemy.statusEffects = [...enemy.statusEffects, { type: "stun", turnsLeft: 1 }];
          log.push(`>> "Hey, hey. Let's not do anything we'll regret." ${enemy.name} hesitates. [-${skill.mpCost} MP] <<`);
          break;
        }
        case "Fake Badge": {
          log.push(`>> You flash a fake ISW staff badge. ${enemy.name} lets you walk away. [-${skill.mpCost} MP] <<`);
          return { ...state, mode: "EXPLORE", player: p, currentEnemy: null, log: log.slice(-LOG_LIMIT) };
        }
        default: {
          log.push(`>> ${skill.name} used [-${skill.mpCost} MP] <<`);
          break;
        }
      }

      return finishPlayerTurn(state, p, enemy, log);
    }

    /* === COMBAT: FLEE === */
    case "FLEE": {
      if (state.mode !== "COMBAT" || !state.player || !state.currentEnemy) return state;
      const fleeRoll = rollD20();
      const slowPenalty = hasStatus(state.player.statusEffects, "slow") ? 4 : 0;
      const fleeTarget = 8 - Math.floor(state.player.stats.spd / 3) + Math.floor(state.currentEnemy.stats.spd / 4) + slowPenalty;
      const { p, enemy, log } = copyRound(state);
      log.push(`Flee roll: d20(${fleeRoll}) vs DC ${fleeTarget}${slowPenalty ? " (slowed!)" : ""}`);

      if (fleeRoll >= fleeTarget) {
        return { ...state, mode: "EXPLORE", currentEnemy: null, player: { ...p, comboCount: 0 }, log: [...log, "You escaped!"].slice(-LOG_LIMIT) };
      }
      log.push("Failed to flee!");
      return finishPlayerTurn(state, p, enemy, log);
    }

    /* === USE ITEM === */
    case "USE_ITEM": {
      if (!state.player) return state;
      const idx = action.itemIndex;
      if (idx < 0 || idx >= state.player.inventory.length) return state;
      const item = state.player.inventory[idx];
      const p = { ...state.player, stats: { ...state.player.stats }, statusEffects: [...state.player.statusEffects] };
      let log = [...state.log];

      switch (item.type) {
        case "heal":
          p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + item.value);
          log.push(`Used ${item.name}. HP: ${p.stats.hp}/${p.stats.maxHp}`);
          break;
        case "mana":
          p.stats.mp = Math.min(p.stats.maxMp, p.stats.mp + item.value);
          log.push(`Used ${item.name}. MP: ${p.stats.mp}/${p.stats.maxMp}`);
          break;
        case "antidote":
          p.statusEffects = [];
          log.push(`Used ${item.name}. All status effects cleared!`);
          break;
        case "emp":
          if (state.currentEnemy) {
            const enemy = { ...state.currentEnemy, stats: { ...state.currentEnemy.stats }, statusEffects: [...state.currentEnemy.statusEffects] };
            const dealt = damageEnemy(enemy, 25, log, p);
            enemy.stats.def = Math.max(0, enemy.stats.def - 3);
            log.push(`EMP blast! ${dealt} damage, enemy DEF reduced.`);
            p.inventory = p.inventory.filter((_, i) => i !== idx);
            if (enemy.stats.hp <= 0) return killEnemy(state, p, enemy, log);
            return { ...state, player: p, currentEnemy: enemy, log: log.slice(-LOG_LIMIT) };
          }
          log.push("No target for EMP.");
          break;
        default:
          log.push(`Can't use ${item.name} right now.`);
          return { ...state, log: log.slice(-LOG_LIMIT) };
      }

      p.inventory = p.inventory.filter((_, i) => i !== idx);
      return { ...state, player: p, log: log.slice(-LOG_LIMIT) };
    }

    /* === STEALTH TOGGLE === */
    case "TOGGLE_STEALTH": {
      if (state.mode !== "EXPLORE" || !state.player) return state;
      const p = state.player;
      if (p.stealthMode) {
        return { ...state, player: { ...p, stealthMode: false }, log: addLog(state, "Stealth mode OFF.") };
      }
      return { ...state, player: { ...p, stealthMode: true, stealth: 100 }, log: addLog(state, "🕶 Stealth mode ON. Detection meter: 100") };
    }

    /* === TYPED INPUT (terminals, lockdown, haggling) === */
    case "PUZZLE_INPUT": {
      if (!acceptsTyping(state)) return state;
      const char = action.char;
      // Allow letters, digits, spaces, and ISW flag characters: { } _
      const allowed = /^[A-Za-z0-9 {}_]$/;
      if (char.length === 1 && allowed.test(char)) {
        return { ...state, puzzleInput: state.puzzleInput + char.toUpperCase() };
      }
      return state;
    }

    case "PUZZLE_SET": {
      if (!acceptsTyping(state)) return state;
      return { ...state, puzzleInput: action.value.toUpperCase().replace(/[^A-Z0-9 {}_]/g, "") };
    }

    case "PUZZLE_BACKSPACE": {
      if (!acceptsTyping(state)) return state;
      return { ...state, puzzleInput: state.puzzleInput.slice(0, -1) };
    }

    case "PUZZLE_SUBMIT": {
      if (state.mode === "LOCKDOWN") return submitLockdown(state);
      if (state.mode === "SHOP") return submitHaggle(state);
      if (state.mode !== "PUZZLE" || !state.currentPuzzle || !state.player) return state;
      const puzzle = state.currentPuzzle;
      if (state.puzzleInput.toUpperCase() === puzzle.plainText.toUpperCase()) {
        const p = { ...state.player, stats: { ...state.player.stats } };
        const credits = Math.floor(terminalCredits(puzzle.floor) * (hasPerk(state.player, "credit_miner") ? 1.5 : 1));
        p.xp += puzzle.rewardXp;
        p.credits += credits;
        let log = addLog(state, "", `>>> DECRYPTED: ${puzzle.plainText} <<<`, `+${puzzle.rewardXp} XP!`, `💰 +${credits} credits`);
        if (puzzle.reward) {
          p.inventory = [...p.inventory, puzzle.reward];
          log = [...log, `Reward: ${puzzle.reward.name}`];
        }
        const { player: lvlP, log: lvlLog } = checkLevelUp(p, log);
        const newPuzzles = state.puzzles.map(pz => pz.id === puzzle.id ? { ...pz, solved: true } : pz);
        const runStats = { ...state.runStats, creditsEarned: state.runStats.creditsEarned + credits };
        return { ...state, mode: "EXPLORE", player: lvlP, currentPuzzle: null, puzzleInput: "", puzzles: newPuzzles, log: lvlLog, runStats };
      }
      return { ...state, puzzleInput: "", log: addLog(state, `Wrong! "${state.puzzleInput}" is incorrect. Try again.`) };
    }

    case "PUZZLE_QUIT": {
      if (state.mode === "SHOP" && state.haggle) {
        return { ...state, haggle: null, puzzleInput: "", shopLine: "Changed your mind? Full price it is." };
      }
      if (state.mode === "UPLINK") {
        return { ...state, mode: "EXPLORE", puzzleInput: "", log: addLog(state, "Uplink disconnected.", "") };
      }
      if (state.mode !== "PUZZLE") return state;
      return { ...state, mode: "EXPLORE", currentPuzzle: null, puzzleInput: "", log: addLog(state, "Terminal hack aborted.") };
    }

    /* === FLAG UPLINK (the flag check is async, so the UI checks and reports here) === */
    case "UPLINK_RESULT": {
      if (state.mode !== "UPLINK") return state;
      const devCmd = String.fromCharCode(...DEV_BACKDOOR.cmd);
      if (!action.title && action.input.trim().toLowerCase() === devCmd) {
        return {
          ...state, puzzleInput: "",
          log: addLog(state, "[dev] backdoor auth OK. god mode is not a thing anymore, stop asking.", `[dev] leftover note: ${xorReveal(DEV_BACKDOOR.notes, devCmd)}`, "[dev] (that's a flag. upload it.)"),
        };
      }
      const msg = action.title
        ? [`>>> FLAG ACCEPTED: ${action.title} <<<`, `${action.flagsFound} hidden flags uploaded.`, ...[taunt("uplink", state.player?.className)].filter((t): t is string => !!t)]
        : [`UPLINK REJECTED: "${action.input}" is not one of ours.`];
      return { ...state, puzzleInput: "", flagsFound: action.flagsFound, log: addLog(state, ...msg) };
    }

    /* === SECRET ENDING: typed conversation with ISW-Chan === */
    case "ENDING_SAY": {
      if (state.mode !== "ENDING" || !state.ending) return state;
      const ending = endingReply(state.ending, action.text);
      if (ending.kicked) {
        return {
          ...state, ending, mode: "GAME_OVER", runStats: { ...state.runStats, killedBy: "ISW-Chan (kicked out)" },
          log: addLog(state, "", "═══ DISCONNECTED BY ISW-CHAN ═══", `${ISW_CHAN_TAG} Inappropriate. Twice. No ending for you.`, "Press [R] to restart."),
        };
      }
      if (!ending.done) return { ...state, ending };
      return {
        ...state, ending, mode: "WIN", endingId: ending.done,
        log: addLog(state, "", "╔══════════════════════════════════════╗", `║ ${ENDING_TITLES[ending.done].padEnd(36)} ║`, "╚══════════════════════════════════════╝",
          `${ISW_CHAN_TAG} here. something to remember me by: ${endingFlag(ending.done)}`),
      };
    }

    /* === FINAL BOSS LOCKDOWN TIMER === */
    case "LOCKDOWN_TIMEOUT": {
      if (state.mode !== "LOCKDOWN" || !state.currentEnemy) return state;
      const enemy = { ...state.currentEnemy, stats: { ...state.currentEnemy.stats } };
      const heal = Math.floor(enemy.stats.maxHp * LOCKDOWN_HEAL);
      enemy.stats.hp = Math.min(enemy.stats.maxHp, enemy.stats.hp + heal);
      return {
        ...state, mode: "COMBAT", currentEnemy: enemy, currentPuzzle: null, puzzleInput: "",
        log: addLog(state, `⏱ LOCKDOWN TIMEOUT — answer was ${state.currentPuzzle?.plainText}.`, `${enemy.name} repairs itself: +${heal} HP [${enemy.stats.hp}/${enemy.stats.maxHp}]`, ""),
      };
    }

    /* === SHOP === */
    case "SHOP_BUY": {
      if (state.mode !== "SHOP" || !state.player || state.haggle) return state;
      const merchant = state.merchants.find(m => m.id === state.currentMerchant);
      const entry = SHOP_STOCK[action.index];
      if (!merchant || !entry) return state;
      const price = shopPrice(entry, merchant.floor, merchant, state.player);
      if (state.player.credits < price) {
        return { ...state, shopLine: line("tooPoor") };
      }
      const p = { ...state.player, stats: { ...state.player.stats }, credits: state.player.credits - price };
      if (entry.item) p.inventory = [...p.inventory, { ...entry.item, id: `${merchant.id}-${merchant.purchases}` }];
      if (entry.stat) p.stats[entry.stat.key] += entry.stat.value;
      tally.spent += price;
      return {
        ...state, player: p,
        merchants: withMerchant(state, m => ({ ...m, purchases: m.purchases + 1 })),
        shopLine: line("bought"),
        log: addLog(state, `Bought ${entry.name} for ${price} credits. (${p.credits} left)`),
      };
    }

    case "SHOP_HAGGLE": {
      if (state.mode !== "SHOP" || state.haggle) return state;
      const merchant = state.merchants.find(m => m.id === state.currentMerchant);
      if (!merchant) return state;
      if (merchant.haggle === "won") return { ...state, shopLine: "You already got your discount. Don't push it." };
      if (merchant.haggle === "lost") return { ...state, shopLine: line("haggleLocked") };
      return { ...state, haggle: createHaggle(), puzzleInput: "", shopLine: line("haggleStart") };
    }

    case "SHOP_LEAVE": {
      if (state.mode !== "SHOP") return state;
      const log = addLog(state, "You leave the shop.");
      chan(log, "shop", state.player);
      return { ...state, mode: "EXPLORE", currentMerchant: null, haggle: null, puzzleInput: "", log: [...log, ""].slice(-LOG_LIMIT) };
    }

    /* === PERKS === */
    case "PICK_PERK": {
      if (state.mode !== "PERK" || !state.perkChoices || !state.player) return state;
      const id = state.perkChoices[action.index];
      if (!id) return state;
      const p = applyPerk(state.player, id);
      p.pendingPerks = Math.max(0, p.pendingPerks - 1);
      return { ...state, mode: "EXPLORE", player: p, perkChoices: null, log: addLog(state, `>> Perk acquired: ${PERKS[id].name} — ${PERKS[id].description} <<`, "") };
    }

    /* === SOCIAL ENGINEER TALK MODE === */
    case "TALK_INPUT": {
      if (state.mode !== "TALK") return state;
      return talkReducer(state, action.text);
    }

    /* === DIALOGUE === */
    case "ADVANCE_DIALOGUE": {
      if (state.mode !== "DIALOGUE") return state;
      return { ...state, mode: "EXPLORE", currentNPC: null, dialogueChoices: null, log: addLog(state, "[End of transmission]") };
    }

    case "SELECT_DIALOGUE_CHOICE": {
      if (state.mode !== "DIALOGUE" || !state.dialogueChoices) return state;
      const choice = state.dialogueChoices[action.choiceIndex];
      if (!choice) return state;
      return { ...state, dialogueChoices: null, log: addLog(state, `> ${choice.label}`, "", ...choice.response, "", "[Press ENTER to close]") };
    }

    /* === INVENTORY === */
    case "TOGGLE_INVENTORY": {
      if (state.mode === "INVENTORY") {
        return { ...state, mode: "EXPLORE" };
      }
      if (state.mode === "EXPLORE" && state.player) {
        const p = state.player;
        const invLines = p.inventory.length === 0
          ? ["Inventory is empty."]
          : p.inventory.map((item, i) => `  [${i + 1}] ${item.name} — ${item.description}`);

        const skillLines = p.skills.map((s, i) => {
          const cdText = s.currentCooldown > 0 ? ` (CD:${s.currentCooldown})` : "";
          return `  [${i + 1}] ${s.name} — ${s.mpCost}MP${cdText} — ${s.description}`;
        });

        const statusLines = p.statusEffects.length > 0
          ? p.statusEffects.map(e => `  ${e.type.toUpperCase()} (${e.turnsLeft} turns)`)
          : ["  None"];

        return {
          ...state,
          mode: "INVENTORY",
          log: addLog(state, "",
            "═══ INVENTORY ═══",
            ...invLines,
            "",
            "═══ SKILLS ═══",
            ...skillLines,
            "",
            "═══ STATUS EFFECTS ═══",
            ...statusLines,
            "",
            `MP: ${p.stats.mp}/${p.stats.maxMp} | Credits: ${p.credits} | Stealth: ${p.stealthMode ? `ON (${p.stealth})` : "OFF"}`,
            "",
            "Press [I] to close. [1-9] to use item.",
          ),
        };
      }
      return state;
    }

    /* === RESTART === */
    case "RESTART": {
      return createInitialState();
    }

    default:
      return state;
  }
}

function acceptsTyping(state: GameState): boolean {
  return state.mode === "PUZZLE" || state.mode === "LOCKDOWN" || state.mode === "UPLINK" || (state.mode === "SHOP" && state.haggle !== null);
}

function submitLockdown(state: GameState): GameState {
  if (!state.currentPuzzle || !state.currentEnemy) return state;
  if (state.puzzleInput.toUpperCase() !== state.currentPuzzle.plainText.toUpperCase()) {
    return { ...state, puzzleInput: "", log: addLog(state, `ACCESS DENIED: "${state.puzzleInput}". Keep trying!`) };
  }
  const enemy = {
    ...state.currentEnemy,
    statusEffects: [
      ...state.currentEnemy.statusEffects.filter(e => e.type !== "stun" && e.type !== "exposed"),
      { type: "stun" as const, turnsLeft: 2 },
      { type: "exposed" as const, turnsLeft: 2 },
    ],
  };
  return {
    ...state, mode: "COMBAT", currentEnemy: enemy, currentPuzzle: null, puzzleInput: "",
    runStats: { ...state.runStats, lockdownsCracked: state.runStats.lockdownsCracked + 1 },
    log: addLog(state, `>>> LOCKDOWN CRACKED: ${state.currentPuzzle.plainText} <<<`, `${enemy.name} is STUNNED and EXPOSED (double damage) for 2 turns!`, ""),
  };
}

function submitHaggle(state: GameState): GameState {
  if (!state.haggle) return state;
  const won = state.puzzleInput.toUpperCase() === state.haggle.answer;
  return {
    ...state, haggle: null, puzzleInput: "",
    merchants: withMerchant(state, m => ({ ...m, haggle: won ? "won" : "lost" })),
    shopLine: line(won ? "haggleWon" : "haggleLost"),
    log: addLog(state, won ? ">> Haggle won: 20% off at this shop <<" : `>> Haggle failed (it was ${state.haggle.answer}) <<`),
  };
}
