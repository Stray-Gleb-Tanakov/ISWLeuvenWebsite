/* ====================================================
   CYBERPUNK TERMINAL RPG — Game Data
   Maps, classes, enemies, items, NPCs, puzzles
   ==================================================== */

import type { ClassName, Stats, Enemy, NPC, GroundItem, Item, Door, DialogueNode, Puzzle, Skill, StatusType } from "./types";

/* ----- Class definitions with MP ----- */

export const CLASS_DATA: Record<ClassName, { desc: string; stats: Stats; special: string; skills: Skill[] }> = {
  Netrunner: {
    desc: "High INT hacker. Weak body, devastating exploits.",
    special: "ICE Breaker (2x INT damage, ignores DEF)",
    stats: { maxHp: 50, hp: 50, maxMp: 80, mp: 80, atk: 5, def: 2, spd: 8, int: 14 },
    skills: [
      { name: "ICE Breaker", mpCost: 20, cooldown: 0, currentCooldown: 0, description: "2x INT pure damage" },
      { name: "Virus Upload", mpCost: 15, cooldown: 3, currentCooldown: 0, description: "Poisons enemy (3 turns)" },
      { name: "Firewall", mpCost: 25, cooldown: 5, currentCooldown: 0, description: "+5 DEF for 3 turns" },
    ],
  },
  Cyborg: {
    desc: "Chrome-plated bruiser. Tanks hits, hits harder.",
    special: "Overclock (3x ATK, takes recoil damage)",
    stats: { maxHp: 100, hp: 100, maxMp: 40, mp: 40, atk: 12, def: 8, spd: 4, int: 3 },
    skills: [
      { name: "Overclock", mpCost: 15, cooldown: 0, currentCooldown: 0, description: "3x ATK, recoil damage" },
      { name: "Chrome Slam", mpCost: 10, cooldown: 2, currentCooldown: 0, description: "Stuns enemy 1 turn" },
      { name: "Repair Nanites", mpCost: 20, cooldown: 4, currentCooldown: 0, description: "Heal 25% max HP" },
    ],
  },
  Ghost: {
    desc: "Invisible operative. Fast, lethal, fragile.",
    special: "Backstab (guaranteed crit, 2.5x damage)",
    stats: { maxHp: 70, hp: 70, maxMp: 60, mp: 60, atk: 9, def: 4, spd: 14, int: 7 },
    skills: [
      { name: "Backstab", mpCost: 18, cooldown: 0, currentCooldown: 0, description: "2.5x crit damage" },
      { name: "Smoke Bomb", mpCost: 12, cooldown: 3, currentCooldown: 0, description: "Guaranteed flee + stealth" },
      { name: "Poison Blade", mpCost: 10, cooldown: 2, currentCooldown: 0, description: "ATK + poison 3 turns" },
    ],
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
  "#...........T..........................#",
  "#.......E.................K...........#",
  "#....................................E.#",
  "#........######.########.#...........#",
  "#........#....#.#......#.#...........#",
  "#........#.+..#.#..W...#.#...........#",
  "#........#....#.#......#.#...........#",
  "#........######.########.#...........#",
  "#..............................T.....N.#",
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

export const ENEMY_TEMPLATES: Record<number, {
  onHitEffect: StatusType; name: string; stats: Stats; xp: number; ac: number; loot?: Item 
}[]> = {
  0: [
    { name: "Security Drone", stats: { maxHp: 30, hp: 30, maxMp: 0, mp: 0, atk: 8, def: 3, spd: 5, int: 1 }, xp: 20, ac: 12, onHitEffect: "burn" },
    { name: "Corrupt Process", stats: { maxHp: 35, hp: 35, maxMp: 0, mp: 0, atk: 10, def: 2, spd: 7, int: 2 }, xp: 25, ac: 10, onHitEffect: "poison" },
  ],
  1: [
    { name: "Firewall Daemon", stats: { maxHp: 55, hp: 55, maxMp: 0, mp: 0, atk: 14, def: 7, spd: 5, int: 4 }, xp: 45, ac: 15, onHitEffect: "burn" },
    { name: "ICE Sentinel", stats: { maxHp: 65, hp: 65, maxMp: 0, mp: 0, atk: 11, def: 10, spd: 3, int: 6 }, xp: 55, ac: 17, onHitEffect: "slow" },
  ],
  2: [
    { name: "Rogue Agent", stats: { maxHp: 70, hp: 70, maxMp: 0, mp: 0, atk: 16, def: 8, spd: 9, int: 5 }, xp: 60, ac: 16, onHitEffect: "bleed" },
    { name: "Virus Cluster", stats: { maxHp: 60, hp: 60, maxMp: 0, mp: 0, atk: 20, def: 4, spd: 12, int: 8 }, xp: 65, ac: 13, onHitEffect: "poison" },
  ],
};

const BOSS_DATA = {
  name: "NEXUS — Rogue AI",
  stats: { maxHp: 300, hp: 300, maxMp: 0, mp: 0, atk: 22, def: 14, spd: 8, int: 18 },
  xp: 300,
  ac: 19,
  onHitEffect: "burn" as StatusType,
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
          {
            label: "Tell me about stealth.",
            response: [
              "Press [S] during exploration to toggle stealth mode.",
              "Moving while stealthy fills your detection meter slowly.",
              "Get close to an enemy undetected and backstab for massive damage.",
              "But if the meter fills up... they ALL know where you are.",
            ],
          },
          {
              label: "What are status effects?",
            response: [
              "Some enemies inflict nasty conditions when they hit you:",
              "🔥 BURN — damage over time, hurts a lot",
              "☠ POISON — slow damage each turn",
              "💫 STUN — skip your next turn",
              "🐌 SLOW — reduced flee chance",
              "🩸 BLEED — stacks damage the more you move",
              "Use antidotes or outlast them.",
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
          {
            label: "How does mana work?",
            response: [
              "Your special abilities and skills cost MP now.",
              "Different classes have different mana pools.",
              "Netrunners have the most, Cyborgs the least.",
              "Find Mana Cells on the ground to restore MP.",
              "Use skills wisely — you can't spam them anymore.",
            ]
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
              "Its attacks BURN you. Bring antidotes.",
              "Build a combo chain - consecutive hits deal bonus damage.",
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

/* ----- Puzzle generation ----- */
const PUZZLE_WORDS = [
  "NEXUS", "BREACH", "CIPHER", "GHOST", "VIRUS",
  "DRONE", "PROXY", "FLAME", "STACK", "CRYPT",
  "NERVE", "PULSE", "BLADE", "STEEL", "OMEGA",
];
function caesarEncrypt(text: string, shift: number): string {
  return text.split("").map(ch => {
    if (ch >= "A" && ch <= "Z") {
      return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65);
    }
    return ch;
  }).join("");
}
function reverseString(text: string): string {
  return text.split("").reverse().join("");
}
function substitutionEncrypt(text: string): string {
  // Simple shift-per-position
  return text.split("").map((ch, i) => {
    if (ch >= "A" && ch <= "Z") {
      return String.fromCharCode(((ch.charCodeAt(0) - 65 + i + 3) % 26) + 65);
    }
    return ch;
  }).join("");
}
export function createPuzzle(floor: number, x: number, y: number, id: string): Puzzle {
  const word = PUZZLE_WORDS[Math.floor(Math.random() * PUZZLE_WORDS.length)];
  const types: Array<"caesar" | "reverse" | "substitution"> = ["caesar", "reverse", "substitution"];
  const type = types[floor % types.length];
  let cipherText: string;
  let hint: string;
  switch (type) {
    case "caesar": {
      const shift = 3 + Math.floor(Math.random() * 10);
      cipherText = caesarEncrypt(word, shift);
      hint = `Caesar cipher, shift ${shift}. Decrypt: ${cipherText}`;
      break;
    }
    case "reverse":
      cipherText = reverseString(word);
      hint = `Reversed text. Decrypt: ${cipherText}`;
      break;
    case "substitution":
      cipherText = substitutionEncrypt(word);
      hint = `Position-shifted cipher. Each letter shifts by (pos+3). Decrypt: ${cipherText}`;
      break;
  }
  const rewardItems: Item[] = [
    { id: `pr-${id}`, name: "Mana Cell", description: "Restores 30 MP", type: "mana", value: 30 },
    { id: `pr-${id}`, name: "NanoMed Kit+", description: "Restores 35 HP", type: "heal", value: 35 },
    { id: `pr-${id}`, name: "Antidote Patch", description: "Clears all status effects", type: "antidote", value: 0 },
  ];
  return {
    id,
    x, y, floor,
    solved: false,
    type,
    plainText: word,
    cipherText,
    hint,
    reward: rewardItems[Math.floor(Math.random() * rewardItems.length)],
    rewardXp: 20 + floor * 15,
  };
}
export function parseFloor(floor: number) {
  const map = FLOOR_MAPS[floor];
  const enemies: Enemy[] = [];
  const npcs: NPC[] = [];
  const groundItems: GroundItem[] = [];
  const doors: Door[] = [];
  const puzzles: Puzzle[] = [];
  let playerStart = { x: 1, y: 1 };
  let enemyCount = 0;
  let npcCount = 0;
  let itemCount = 0;
  let puzzleCount = 0;

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
            statusEffects: [],
            onHitEffect: tmpl.onHitEffect,
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
            statusEffects: [],
            onHitEffect: BOSS_DATA.onHitEffect,
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
        case "T": {
          puzzles.push(createPuzzle(floor, x, y, `p${floor}-${puzzleCount}`));
          puzzleCount++;
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

   return { cleanMap, enemies, npcs, groundItems, doors, puzzles, playerStart };
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
    statusEffects: [],
    onHitEffect: tmpl.onHitEffect,
  };
}
