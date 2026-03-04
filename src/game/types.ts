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
  | "PUZZLE";

export type ClassName = "Netrunner" | "Cyborg" | "Ghost";

/* ----- Status effects ----- */
export type StatusType = "poison" | "burn" | "stun" | "slow" | "bleed";

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
export interface Puzzle {
  id: string;
  x: number;
  y: number;
  floor: number;
  solved: boolean;
  type: "caesar" | "reverse" | "substitution" | "vigenere";
  plainText: string;
  cipherText: string;
  hint: string;
  reward: Item | null;
  rewardXp: number;
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
}

export type GameAction =
  | { type: "SELECT_CLASS"; className: ClassName }
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
  | { type: "RESTART" };
