/* ====================================================
   CYBERPUNK TERMINAL RPG — Game Data
   Maps, classes, enemies, items, NPCs
   ==================================================== */

import type { ClassName, Stats, Enemy, NPC, GroundItem, Item, Door } from "./types";

/* ----- Class definitions ----- */

export const CLASS_DATA: Record<ClassName, { desc: string; stats: Stats; special: string }> = {
  Netrunner: {
    desc: "High INT hacker. Weak body, devastating exploits.",
    special: "ICE Breaker (2x INT damage, ignores DEF)",
    stats: { maxHp: 50, hp: 50, atk: 5, def: 2, spd: 8, int: 14 },
  },
  Cyborg: {
    desc: "Chrome-plated bruiser. Tanks hits, hits harder.",
    special: "Overclock (3x ATK, takes recoil damage)",
    stats: { maxHp: 100, hp: 100, atk: 12, def: 8, spd: 4, int: 3 },
  },
  Ghost: {
    desc: "Invisible operative. Fast, lethal, fragile.",
    special: "Backstab (guaranteed crit, 2.5x damage)",
    stats: { maxHp: 70, hp: 70, atk: 9, def: 4, spd: 14, int: 7 },
  },
};

/* ----- Floor maps -----
   Legend:
   # = wall    . = floor    @ = player start
   > = stairs  D = locked door  K = keycard
   + = health pack  W = weapon  A = armor
   E = enemy   B = boss     N = NPC
*/

const FLOOR_1 = [
  "########################################",
  "#@.....#........#.........#............#",
  "#......#........#.........#............#",
  "#......#...E....#....N....#.....+......#",
  "#......#........#.........#............#",
  "####.###........#.........####.#########",
  "#..............................................#",
  "#.......E.................K............#",
  "#....................................E.#",
  "#........######.########.#............#",
  "#........#....#.#......#.#............#",
  "#........#.+..#.#..W...#.#............#",
  "#........#....#.#......#.#............#",
  "#........######.########.#............#",
  "#....................................N.#",
  "#..E.................................>.#",
  "########################################",
];

const FLOOR_2 = [
  "########################################",
  "#@.........#.........#................#",
  "#..........#.........#................#",
  "#..........#....E....#.......N........#",
  "#..........#.........#................#",
  "#..........#.........#####.############",
  "#..........#..........................#",
  "####.######..........E................#",
  "#..........#..........................#",
  "#....E.....#.........#####.############",
  "#..........#.........#......#.........#",
  "#..........#.........#..K...#....+....#",
  "#..........#.........#......#.........#",
  "####D####..#.........########.........#",
  "#....W.....#..........E...............#",
  "#..A.......#..........................#",
  "#..........#........................>.#",
  "########################################",
];

const FLOOR_3 = [
  "########################################",
  "#@.........................................#",
  "#..........................................#",
  "#....N.....................................#",
  "#..........................................#",
  "#.....######.######.######...............#",
  "#.....#....#.#....#.#....#...............#",
  "#.....#.E..#.#.+..#.#..W.#...............#",
  "#.....#....#.#....#.#....#...............#",
  "#.....######.######.######...............#",
  "#..........................................#",
  "#.........E..........E...................#",
  "#..........................................#",
  "#################D#######################",
  "#..........................................#",
  "#..........+.......A.....................#",
  "#..........................................#",
  "#....................B....................#",
  "#..........................................#",
  "########################################",
];

export const FLOOR_MAPS = [FLOOR_1, FLOOR_2, FLOOR_3];

/* ----- Enemy templates with AC (armor class) ----- */

export const ENEMY_TEMPLATES: Record<number, { name: string; stats: Stats; xp: number; ac: number; loot?: Item }[]> = {
  0: [
    { name: "Security Drone", stats: { maxHp: 30, hp: 30, atk: 8, def: 3, spd: 5, int: 1 }, xp: 20, ac: 12 },
    { name: "Corrupt Process", stats: { maxHp: 35, hp: 35, atk: 10, def: 2, spd: 7, int: 2 }, xp: 25, ac: 10 },
  ],
  1: [
    { name: "Firewall Daemon", stats: { maxHp: 55, hp: 55, atk: 14, def: 7, spd: 5, int: 4 }, xp: 45, ac: 15 },
    { name: "ICE Sentinel", stats: { maxHp: 65, hp: 65, atk: 11, def: 10, spd: 3, int: 6 }, xp: 55, ac: 17 },
  ],
  2: [
    { name: "Rogue Agent", stats: { maxHp: 70, hp: 70, atk: 16, def: 8, spd: 9, int: 5 }, xp: 60, ac: 16 },
    { name: "Virus Cluster", stats: { maxHp: 60, hp: 60, atk: 20, def: 4, spd: 12, int: 8 }, xp: 65, ac: 13 },
  ],
};

const BOSS_DATA = {
  name: "NEXUS — Rogue AI",
  stats: { maxHp: 300, hp: 300, atk: 22, def: 14, spd: 8, int: 18 },
  xp: 300,
  ac: 19,
};

const NPC_DIALOGUES: Record<number, string[][]> = {
  0: [
    [
      ">>> ENCRYPTED TRANSMISSION <<<",
      "They locked down the mainframe after the breach.",
      "Find the KEYCARD to access the next level.",
      "Watch out for security drones... they're everywhere.",
    ],
    [
      ">>> ANONYMOUS OPERATIVE <<<",
      "The stairs down are in the southeast corner.",
      "I left a health pack in the storage room. You'll need it.",
      "Good luck, runner.",
    ],
  ],
  1: [
    [
      ">>> GHOST_SIGNAL <<<",
      "Floor 2... the ICE is thicker here.",
      "There's a locked door — you need another keycard.",
      "The weapons cache has some serious hardware.",
    ],
  ],
  2: [
    [
      ">>> LAST_HUMAN <<<",
      "You made it to the executive suite.",
      "NEXUS is through the locked door at the bottom.",
      "It's a rogue AI — it controls this entire facility.",
      "Defeat it and the mainframe is yours.",
      "Or die trying. No pressure.",
    ],
  ],
};

const ITEM_TEMPLATES: Record<string, Item> = {
  "+": { id: "", name: "NanoMed Kit", description: "Restores 20 HP", type: "heal", value: 20 },
  K: { id: "", name: "Security Keycard", description: "Opens locked doors on this floor", type: "keycard", value: 1 },
  W: { id: "", name: "Plasma Blade", description: "+4 ATK", type: "weapon", value: 4 },
  A: { id: "", name: "Carbon Weave", description: "+3 DEF", type: "armor", value: 3 },
};

export function parseFloor(floor: number) {
  const map = FLOOR_MAPS[floor];
  const enemies: Enemy[] = [];
  const npcs: NPC[] = [];
  const groundItems: GroundItem[] = [];
  const doors: Door[] = [];
  let playerStart = { x: 1, y: 1 };
  let enemyCount = 0;
  let npcCount = 0;
  let itemCount = 0;

  const maxLen = Math.max(...map.map((r) => r.length));
  const normalizedMap = map.map((row) => row.padEnd(maxLen, "#"));

  const cleanMap = normalizedMap.map((row, y) => {
    let cleaned = "";
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      switch (ch) {
        case "@":
          playerStart = { x, y };
          cleaned += ".";
          break;
        case "E": {
          const templates = ENEMY_TEMPLATES[floor] || ENEMY_TEMPLATES[0];
          const tmpl = templates[enemyCount % templates.length];
          enemies.push({
            id: `e${floor}-${enemyCount}`,
            name: tmpl.name,
            symbol: "E",
            stats: { ...tmpl.stats },
            xpReward: tmpl.xp,
            alive: true,
            x, y,
            floor,
            loot: tmpl.loot,
            ac: tmpl.ac,
          });
          enemyCount++;
          cleaned += ".";
          break;
        }
        case "B": {
          enemies.push({
            id: `boss-${floor}`,
            name: BOSS_DATA.name,
            symbol: "B",
            stats: { ...BOSS_DATA.stats },
            xpReward: BOSS_DATA.xp,
            alive: true,
            x, y,
            floor,
            isBoss: true,
            ac: BOSS_DATA.ac,
          });
          cleaned += ".";
          break;
        }
        case "N": {
          const dialogues = NPC_DIALOGUES[floor] || [["..."]];
          const dlg = dialogues[npcCount % dialogues.length];
          npcs.push({
            id: `n${floor}-${npcCount}`,
            name: `NPC_${floor}_${npcCount}`,
            symbol: "N",
            dialogue: dlg,
            x, y,
            floor,
            talked: false,
          });
          npcCount++;
          cleaned += ".";
          break;
        }
        case "D":
          doors.push({ x, y, floor, locked: true });
          cleaned += "D";
          break;
        case "+":
        case "K":
        case "W":
        case "A": {
          const tmpl = ITEM_TEMPLATES[ch];
          groundItems.push({
            ...tmpl,
            id: `i${floor}-${itemCount}`,
            x, y,
            floor,
            picked: false,
          });
          itemCount++;
          cleaned += ".";
          break;
        }
        default:
          cleaned += ch;
      }
    }
    return cleaned;
  });

  return { cleanMap, enemies, npcs, groundItems, doors, playerStart };
}

/* ----- Floor names ----- */
export const FLOOR_NAMES = [
  "FLOOR 1 — Server Room",
  "FLOOR 2 — Research Lab",
  "FLOOR 3 — Executive Suite",
];

/* ----- Random spawn helper ----- */
export function createRandomEnemy(floor: number, x: number, y: number, idSuffix: string): Enemy {
  const templates = ENEMY_TEMPLATES[floor] || ENEMY_TEMPLATES[0];
  const tmpl = templates[Math.floor(Math.random() * templates.length)];
  return {
    id: `spawn-${floor}-${idSuffix}`,
    name: tmpl.name,
    symbol: "E",
    stats: { ...tmpl.stats },
    xpReward: tmpl.xp,
    alive: true,
    x, y,
    floor,
    loot: tmpl.loot,
    ac: tmpl.ac,
  };
}
