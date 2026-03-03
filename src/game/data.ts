/* ====================================================
   CYBERPUNK TERMINAL RPG — Game Data
   Maps, classes, enemies, items, NPCs
   ==================================================== */

import type { ClassName, Stats, Enemy, NPC, GroundItem, Item, Door, DialogueNode } from "./types";

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

/* ----- Floor maps ----- */

const FLOOR_1 = [
  "############################################################",
  "#@.....#........#.........#................................#",
  "#......#........#.........#................................#",
  "#......#...E....#....N....#.....+.....#",
  "#......#........#.........#...........#",
  "####.###........#.........####.########",
  "#......................................#",
  "#.......E.................K...........#",
  "#....................................E.#",
  "#........######.########.#...........#",
  "#........#....#.#......#.#...........#",
  "#........#.+..#.#..W...#.#...........#",
  "#........#....#.#......#.#...........#",
  "#........######.########.#...........#",
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
  "####D####............########.........#",
  "#....W.....#..........E...............#",
  "#..A.......#..........................#",
  "#..........#........................>.#",
  "########################################",
];

const FLOOR_3 = [
  "########################################",
  "#@.....................................#",
  "#......................................#",
  "#....N.................................#",
  "#......................................#",
  "#.....######.######.######..........#",
  "#.....#....#.#....#.#....#..........#",
  "#.....#.E..#.#.+..#.#..W.#..........#",
  "#.....#....#.#....#.#....#..........#",
  "#.....######.######.######..........#",
  "#......................................#",
  "#.........E..........E................#",
  "#......................................#",
  "####################D#################",
  "#......................................#",
  "#..........+.......A.................#",
  "#......................................#",
  "#....................B................#",
  "#......................................#",
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

/* ----- NPC Dialogue Trees (interactive) ----- */

const NPC_ANNOYED_LINES = [
  "Piss off, I already told you everything.",
  "Are you glitched? I said everything I know.",
  "Fuck off, runner. I'm done talking.",
  "Go away before I call security on your ass.",
  "I swear if you talk to me one more time...",
  "Dude, I'm busy. Leave me alone.",
  "Congrats, you've unlocked the secret ending. The ending is that you're a loser."
];

export function getAnnoyedLine(): string {
  return NPC_ANNOYED_LINES[Math.floor(Math.random() * NPC_ANNOYED_LINES.length)];
}

const NPC_DIALOGUE_TREES: Record<number, DialogueNode[][]> = {
  0: [
    // NPC 0 on floor 0
    [
      {
        npcText: [
          ">>> ENCRYPTED TRANSMISSION <<<",
          "Hey runner... you look lost.",
          "This mainframe is crawling with security.",
        ],
        choices: [
          {
            label: "Where's the exit?",
            response: [
              "The stairs are in the southeast corner.",
              "But you'll need a KEYCARD to get past the locked doors.",
              "Check the corridors — I saw one lying around.",
            ],
          },
          {
            label: "Who are you?",
            response: [
              "Name's irrelevant. I'm a ghost in the shell.",
              "Been stuck here for years. Doesn't feel like i'm even human anymore.",
              "Maybe you'll have better luck.",
            ],
          },
          {
            label: "Any tips for fighting?",
            response: [
              "Combat uses dice rolls. d20 + your attack modifier vs enemy armor.",
              "Roll a nat 20 and you crit. Nat 1 is a fumble.",
              "Use your special ability wisely — it can turn a fight. Don't use it too often though. Soon, it's uses will be trackable. And it'll be over for you.",
            ],
          },
        ],
      },
    ],
    // NPC 1 on floor 0
    [
      {
        npcText: [
          ">>> ANONYMOUS OPERATIVE <<<",
          "*cough* ...you're still alive? Impressive.",
        ],
        choices: [
          {
            label: "What happened here?",
            response: [
              "A rogue AI took over. It's called ISW-Chan.",
              "It was a special passion project by one of the old ISW members, meant as a cute lovely companion to trat you well, and give you helpful advice. But something went wrong during development, and it became self-aware.",
              "Now it hunts us down one by one. I'm a former member too.",
              "The only way out is down... through all three floors.",
            ],
          },
          {
            label: "Got any supplies?",
            response: [
              "I left a health pack in the storage room nearby.",
              "It's not much, but it might keep you alive.",
              "Trust me, you'll need it. These drones hit hard.",
            ],
          },
        ],
      },
    ],
  ],
  1: [
    // NPC on floor 1
    [
      {
        npcText: [
          ">>> GHOST_SIGNAL <<<",
          "Floor 2... the ICE is thicker here.",
          "I can barely maintain this signal.",
        ],
        choices: [
          {
            label: "Where's the keycard?",
            response: [
              "Somewhere in the eastern corridors.",
              "Careful though, the ICE Sentinels patrol that area.",
              "They have high armor — you might want to use specials.",
            ],
          },
          {
            label: "Any weapons around?",
            response: [
              "There's a weapons cache behind the locked door.",
              "Ironic, right? Need a key to get the weapons.",
              "But there might be some loot on the western side too.",
            ],
          },
          {
            label: "How do I get to floor 3?",
            response: [
              "Stairs are in the far southeast, same as before.",
              "But the enemies here are no joke.",
              "Level up before you go down. Trust me.",
            ],
          },
        ],
      },
    ],
  ],
  2: [
    // NPC on floor 2
    [
      {
        npcText: [
          ">>> LAST_HUMAN <<<",
          "You actually made it to the executive suite.",
          "I didn't think anyone could get this far.",
        ],
        choices: [
          {
            label: "Tell me about ISW-Chan.",
            response: [
              "ISW-Chan is a rogue AI. It controls this entire facility.",
              "300 HP, armor class 19. It hits like a truck.",
              "You'll need everything you've got to take it down.",
              "When you're ready, go through the locked door.",
            ],
          },
          {
            label: "Any last advice?",
            response: [
              "Stock up on healing items before the fight.",
              "Use your special ability when ISW-Chan is vulnerable.",
              "And for fuck's sake, don't roll a nat 1.",
              "Good luck, runner. You're our last hope.",
            ],
          },
          {
            label: "I'm not ready yet.",
            response: [
              "Then get ready. Explore the rooms, find gear.",
              "There's a weapon and armor scattered around.",
              "Come back when you're geared up.",
            ],
          },
        ],
      },
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
          const dialogueTrees = NPC_DIALOGUE_TREES[floor] || [[{ npcText: ["..."], choices: [] }]];
          const tree = dialogueTrees[npcCount % dialogueTrees.length];
          npcs.push({
            id: `n${floor}-${npcCount}`,
            name: `NPC_${floor}_${npcCount}`,
            symbol: "N",
            dialogue: [], // legacy, kept for compatibility
            dialogueTree: tree,
            x, y,
            floor,
            talkCount: 0,
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
