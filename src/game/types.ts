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
  | "WIN";
export type ClassName = "Netrunner" | "Cyborg" | "Ghost";
export interface Stats {
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  int: number;
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
}
export interface Item {
  id: string;
  name: string;
  description: string;
  type: "heal" | "weapon" | "keycard" | "emp" | "armor";
  value: number;
}
export interface NPC {
  id: string;
  name: string;
  symbol: string;
  dialogue: string[];
  x: number;
  y: number;
  floor: number;
  talked: boolean;
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
  doors: Door[];
  turnCount: number;
  spawnTimer: number;
}
export type GameAction =
  | { type: "SELECT_CLASS"; className: ClassName }
  | { type: "MOVE"; dx: number; dy: number }
  | { type: "ATTACK" }
  | { type: "SPECIAL" }
  | { type: "FLEE" }
  | { type: "USE_ITEM"; itemIndex: number }
  | { type: "ADVANCE_DIALOGUE" }
  | { type: "TOGGLE_INVENTORY" }
  | { type: "RESTART" };