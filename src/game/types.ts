/* ====================================================
   CYBERPUNK TERMINAL RPG — Type Definitions
   ==================================================== */

export type GameMode =
  | "CLASS_SELECT"
  | "EXPLORE"
  | "COMBAT"
  | "DIALOGUE"
  | "INVENTORY"
  | "GAME_OVER"
  | "WIN"
  | "PUZZLE"
  | "QTE"       // timed reaction prompt (class specials and Brace)
  | "LOCKDOWN"  // final boss phase: timed cipher
  | "SHOP"
  | "UPLINK"    // terminal where hidden website flags are entered
  | "PERK"      // level-up: pick 1 of 3 perks
  | "TALK";     // Social Engineer: text-adventure mode

export type ClassName = "Netrunner" | "Cyborg" | "Ghost" | "Sysadmin" | "Script Kiddie" | "Social Engineer";

/* ----- Perks (picked on level-up) ----- */
export type PerkId =
  | "glass_cannon" | "paranoia" | "vampiric" | "overcharge"
  | "black_market" | "credit_miner" | "steady_hands" | "lucky_dice";

/* ----- Screen effects, picked up by the UI ----- */
export type FxKind = "hit" | "crit" | "perfect" | "backfire" | "nuke";

/* ----- Status effects ----- */
export type StatusType = "poison" | "burn" | "stun" | "slow" | "bleed" | "exposed"; // exposed: takes double damage

export interface StatusEffect {
  type: StatusType;
  turnsLeft: number;
  damage?: number; // per-turn damage for DoTs
}

export interface Stats {
  maxHp: number;
  hp: number;
  maxMp: number;
  mp: number;
  atk: number;
  def: number;
  spd: number;
  int: number;
}

export interface Skill {
  name: string;
  mpCost: number;
  cooldown: number;
  currentCooldown: number;
  description: string;
}

export interface Player {
  className: ClassName;
  stats: Stats;
  level: number;
  xp: number;
  xpToNext: number;
  inventory: Item[];
  x: number;
  y: number;
  floor: number;
  hasKeycard: boolean;
  statusEffects: StatusEffect[];
  skills: Skill[];
  stealth: number;       // 0-100, stealth meter
  stealthMode: boolean;  // actively sneaking
  comboCount: number;    // consecutive hits for combo bonus
  credits: number;       // merchant currency, lost on death
  perks: PerkId[];
  pendingPerks: number;  // level-ups whose perk hasn't been picked yet
  drone: { hp: number; maxHp: number } | null; // Sysadmin's helper
}

export interface Enemy {
  id: string;
  name: string;
  symbol: string;
  stats: Stats;
  xpReward: number;
  alive: boolean;
  x: number;
  y: number;
  floor: number;
  loot?: Item;
  isBoss?: boolean;
  ac: number;
  statusEffects: StatusEffect[];
  onHitEffect?: StatusType; // enemies can inflict status effects
  lockdownPhase?: number;   // final boss: lockdowns already triggered
  behavior?: "leech";       // steals credits instead of HP, tries to flee
  stolen?: number;          // leech: credits it carries
  grabbed?: boolean;        // leech: pinned by a Grab QTE, can't flee anymore
  fragment?: boolean;       // possessed by ISW-Chan: stronger, taunts
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: "heal" | "weapon" | "keycard" | "emp" | "armor" | "mana" | "antidote";
  value: number;
}

/* ----- Dialogue ----- */
export interface DialogueChoice {
  label: string;
  response: string[];
}

export interface DialogueNode {
  npcText: string[];
  choices?: DialogueChoice[];
}

export interface NPC {
  id: string;
  name: string;
  symbol: string;
  dialogue: string[];
  dialogueTree: DialogueNode[];
  x: number;
  y: number;
  floor: number;
  talkCount: number;
}

export interface GroundItem extends Item {
  x: number;
  y: number;
  floor: number;
  picked: boolean;
}

export interface Door {
  x: number;
  y: number;
  floor: number;
  locked: boolean;
}

/* ----- Puzzle ----- */
export type PuzzleType =
  | "caesar" | "reverse" | "substitution" | "vigenere" | "atbash" | "railfence" | "base64" | "hex" | "binary"
  | "double" | "rot47" | "xor" | "morse" | "octal" | "triple" | "beaufort" | "affine" | "columnar" | "playfair"
  | "polybius" | "autokey" | "bacon" | "bifid" | "adfgvx" | "quadruple" | "nightmare"
  | "sha1" | "keypad" | "book_acrostic" | "book_about" | "book_events" | "book_members";

export interface Puzzle {
  id: string;
  x: number;
  y: number;
  floor: number;
  solved: boolean;
  type: PuzzleType;
  plainText: string;
  cipherText: string;
  hint: string;
  reward: Item | null;
  rewardXp: number;
}

/* ----- Quick-time events ----- */
export type QteKind = "hack" | "gauge" | "combo" | "brace" | "grab" | "shell";
export type QteResult = "perfect" | "good" | "miss";

export interface Qte {
  kind: QteKind;
  context: "special" | "brace" | "grab";
  prompt: string;       // hack: characters to type; combo: arrows as U/D/L/R; shell: the error message
  windowMs: number;     // time to respond (after the cue / memorize phase)
  memorizeMs?: number;  // combo: how long the arrows are shown
  cueDelayMs?: number;  // brace: wait before the cue, pressing early is a miss
  zone?: { good: [number, number]; perfect: [number, number] }; // gauge: needle positions 0..1
  perfectFrac?: number; // brace: fraction of the window that counts as perfect (default 0.45)
  presses?: number;     // grab: presses needed
  answers?: string[];   // shell: accepted commands
  hint?: string;        // shell: nudge for people who don't know Linux yet
}

/* ----- Social Engineer talk mode ----- */
export interface TalkState {
  scene: string;
  npc: string | null;   // who you're talking to, if anyone
  suspicion: Record<string, number>; // per NPC, 0-100, 100 = alarm
  flags: string[];      // story progress
  visited: string[];
  // per NPC: what you claimed, your last intents, how convinced they are, an open question, trust already earned
  memory: Record<string, { claims: string[]; recent: string[]; trust: number; pending: string | null; used: string[] }>;
}

export interface RunStats {
  perfects: number;
  lockdownsCracked: number;
  creditsEarned: number;
  creditsStolen: number;
  creditsSpent: number;
  bracesFaced: number;
  perfectBraces: number;
  damageDealt: number;
  damageTaken: number;
  killedBy: string | null;
}

/* ----- Merchant ----- */
export interface Merchant {
  id: string;
  floor: number;
  x: number;
  y: number;
  visits: number;
  purchases: number;
  haggle: "none" | "won" | "lost";
}

export interface Haggle {
  cipherText: string;
  shift: number;
  answer: string;
}

export interface TrapTile {
  x: number;
  y: number;
  floor: number;
  triggered: boolean;
}

export interface GameState {
  mode: GameMode;
  player: Player | null;
  enemies: Enemy[];
  npcs: NPC[];
  groundItems: GroundItem[];
  maps: string[][];
  log: string[];
  currentEnemy: Enemy | null;
  currentNPC: NPC | null;
  dialogueIndex: number;
  dialogueChoices: DialogueChoice[] | null;
  doors: Door[];
  turnCount: number;
  spawnTimer: number;
  puzzles: Puzzle[];
  currentPuzzle: Puzzle | null;
  puzzleInput: string;
  traps: TrapTile[];
  qte: Qte | null;
  lockdownMs: number;             // time limit of the active lockdown
  merchants: Merchant[];
  uplinks: { x: number; y: number; floor: number }[];
  currentMerchant: string | null; // id
  haggle: Haggle | null;
  shopLine: string;               // what the merchant just said
  seed: number;                   // item/enemy placement seed of this run
  flagsFound: number;             // hidden site flags, merchants comment on them
  runStats: RunStats;
  perkChoices: PerkId[] | null;
  fx: { kind: FxKind; id: number } | null;
  talk: TalkState | null;
}

export type GameAction =
  | { type: "SELECT_CLASS"; className: ClassName; flagsFound?: number }
  | { type: "MOVE"; dx: number; dy: number }
  | { type: "ATTACK" }
  | { type: "SPECIAL" }
  | { type: "SKILL"; skillIndex: number }
  | { type: "FLEE" }
  | { type: "USE_ITEM"; itemIndex: number }
  | { type: "ADVANCE_DIALOGUE" }
  | { type: "SELECT_DIALOGUE_CHOICE"; choiceIndex: number }
  | { type: "TOGGLE_INVENTORY" }
  | { type: "TOGGLE_STEALTH" }
  | { type: "PUZZLE_INPUT"; char: string }
  | { type: "PUZZLE_SUBMIT" }
  | { type: "PUZZLE_BACKSPACE" }
  | { type: "PUZZLE_QUIT" }
  | { type: "PUZZLE_SET"; value: string }
  | { type: "QTE_RESOLVE"; result: QteResult; accuracy: number; text?: string }
  | { type: "PICK_PERK"; index: number }
  | { type: "TALK_INPUT"; text: string }
  | { type: "LOCKDOWN_TIMEOUT" }
  | { type: "SHOP_BUY"; index: number }
  | { type: "SHOP_HAGGLE" }
  | { type: "SHOP_LEAVE" }
  | { type: "UPLINK_RESULT"; input: string; title: string | null; flagsFound: number }
  | { type: "RESTART" };
