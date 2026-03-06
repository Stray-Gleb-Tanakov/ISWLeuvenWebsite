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
    stats: { maxHp: 120, hp: 120, maxMp: 200, mp: 200, atk: 5, def: 2, spd: 8, int: 16 },
    skills: [
      { name: "ICE Breaker", mpCost: 20, cooldown: 0, currentCooldown: 0, description: "2x INT pure damage" },
      { name: "Virus Upload", mpCost: 15, cooldown: 3, currentCooldown: 0, description: "Poisons enemy (3 turns)" },
      { name: "Firewall", mpCost: 25, cooldown: 5, currentCooldown: 0, description: "+5 DEF for 3 turns" },
    ],
  },
  Cyborg: {
    desc: "Chrome-plated bruiser. Tanks hits, hits harder.",
    special: "Overclock (3x ATK, takes recoil damage)",
    stats: { maxHp: 200, hp: 200, maxMp: 60, mp: 60, atk: 20, def: 8, spd: 4, int: 3 },
    skills: [
      { name: "Overclock", mpCost: 15, cooldown: 0, currentCooldown: 0, description: "3x ATK, recoil damage" },
      { name: "Chrome Slam", mpCost: 10, cooldown: 2, currentCooldown: 0, description: "Stuns enemy 1 turn" },
      { name: "Repair Nanites", mpCost: 20, cooldown: 4, currentCooldown: 0, description: "Heal 25% max HP" },
    ],
  },
  Ghost: {
    desc: "Invisible operative. Fast, lethal, fragile.",
    special: "Backstab (guaranteed crit, 2.5x damage)",
    stats: { maxHp: 150, hp: 150, maxMp: 120, mp: 120, atk: 15, def: 6, spd: 18, int: 9 },
    skills: [
      { name: "Backstab", mpCost: 18, cooldown: 0, currentCooldown: 0, description: "2.5x crit damage" },
      { name: "Smoke Bomb", mpCost: 12, cooldown: 3, currentCooldown: 0, description: "Guaranteed flee + stealth" },
      { name: "Poison Blade", mpCost: 10, cooldown: 2, currentCooldown: 0, description: "ATK + poison 3 turns" },
    ],
  },
};

/* ----- Floor maps ----- */
/* Legend: @ = start, E = enemy, B = boss, M = mini-boss, N = NPC,
   T = terminal puzzle, D = locked door, > = stairs down,
   + = health, K = keycard, W = weapon, A = armor, X = trap */

const FLOOR_1 = [
  "########################################",
  "#@.....#........#.........#............#",
  "#......#........#.........#............#",
  "#......#...E....#....N....#.....+.....#",
  "#......#........#.........#............#",
  "####.###........#.........####.########",
  "#......................................#",
  "#.......E.................K............#",
  "#....................................E.#",
  "#........######.########.#............#",
  "#........#....#.#......#.#............#",
  "#........#.+..#.#..W...#.#............#",
  "#........#....#.#......#.#....T.......#",
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
  "#..........#.........#####.###########",
  "#..........#..........................#",
  "####.#######.........E............T...#",
  "#..........#..........................#",
  "#....E.....#.........#####.###########",
  "#..........#.........#......#.........#",
  "#....................#..K...#....+....#",
  "#..........#...............#.........#",
  "####D#######.........########.........#",
  "#....W.....#..........E......T........#",
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
  "#.....###..##.###.##.######............#",
  "#.....#....#.#....#.#.....#............#",
  "#.....#.E..#.#.+..#.#...W.#............#",
  "#.....#....#.#....#.#..................#",
  "#.....######.######.######.............#",
  "#......................................#",
  "#.........E..........E........T........#",
  "#......................................#",
  "####################D###################",
  "#......................................#",
  "#..........+.......A...................#",
  "#..........X...........X...............#",
  "#.....M................................#",
  "#....................................>.#",
  "########################################",
];

const FLOOR_4 = [
  "########################################",
  "#@.........X.........X................#",
  "#......................................#",
  "#....N...........E...........+........#",
  "#......................................#",
  "####.##########.####.#################",
  "#..........#.......#.................X#",
  "#..X.......#...E...#.........K........#",
  "#..........#.......#..................#",
  "#..........####D####..................#",
  "#......................................#",
  "#..E.............X.............E......#",
  "#......................................#",
  "#.....######.######...................#",
  "#.....#.T..#.#..W.#.......N...........#",
  "#.....#....#.#....#...................#",
  "#.....######.######...................#",
  "#......................................#",
  "#.........A...........X...............#",
  "#..X..........M.....................>.#",
  "########################################",
];

const FLOOR_5 = [
  "########################################",
  "#@.....X.....X.....X.....X............#",
  "#......................................#",
  "#..N...................................#",
  "#......................................#",
  "###.########.########.################",
  "#......#........#........#............#",
  "#..E...#..X.E...#...E.X..#....+......#",
  "#......#........#........#............#",
  "#......####.####.####.####............#",
  "#......................................#",
  "#..........X....X....X................#",
  "#.....T................................#",
  "####D##################################",
  "#......................................#",
  "#..K...........W.......A..............#",
  "#......X.....X.....X.....X............#",
  "#......................................#",
  "#...............M......................#",
  "#....................................>.#",
  "########################################",
];

const FLOOR_6 = [
  "########################################",
  "#@.....................................#",
  "#......................................#",
  "#....N.................................#",
  "#......................................#",
  "#......................................#",
  "#.....+...........+...................#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#....................B..................#",
  "#......................................#",
  "########################################",
];

export const FLOOR_MAPS = [FLOOR_1, FLOOR_2, FLOOR_3, FLOOR_4, FLOOR_5, FLOOR_6];

/* ----- Trap definitions ----- */

export interface TrapData {
  damage: number;
  statusEffect?: StatusType;
  message: string;
}

export const TRAP_DATA: Record<number, TrapData> = {
  0: { damage: 5, message: "⚡ You stepped on an electric trap! -5 HP" },
  1: { damage: 8, message: "⚡ Shock plate! -8 HP" },
  2: { damage: 10, statusEffect: "poison", message: "☠ Poison gas trap! -10 HP + POISONED" },
  3: { damage: 12, statusEffect: "burn", message: "🔥 Incendiary trap! -12 HP + BURNED" },
  4: { damage: 15, statusEffect: "slow", message: "🐌 Cryo trap! -15 HP + SLOWED" },
  5: { damage: 8, message: "⚡ Laser grid! -8 HP" },
};

/* ----- Enemy templates with status effects ----- */

export const ENEMY_TEMPLATES: Record<number, { name: string; stats: Stats; xp: number; ac: number; loot?: Item; onHitEffect?: StatusType }[]> = {
  0: [
    { name: "Security Drone", stats: { maxHp: 30, hp: 30, maxMp: 0, mp: 0, atk: 8, def: 3, spd: 5, int: 1 }, xp: 20, ac: 12 },
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
  3: [
    { name: "Biohazard Drone", stats: { maxHp: 80, hp: 80, maxMp: 0, mp: 0, atk: 18, def: 9, spd: 7, int: 6 }, xp: 75, ac: 17, onHitEffect: "poison" },
    { name: "Gene Splicer", stats: { maxHp: 70, hp: 70, maxMp: 0, mp: 0, atk: 22, def: 5, spd: 11, int: 10 }, xp: 80, ac: 14, onHitEffect: "bleed" },
  ],
  4: [
    { name: "Quantum Ghost", stats: { maxHp: 90, hp: 90, maxMp: 0, mp: 0, atk: 20, def: 12, spd: 10, int: 12 }, xp: 90, ac: 18, onHitEffect: "stun" },
    { name: "Entropy Worm", stats: { maxHp: 85, hp: 85, maxMp: 0, mp: 0, atk: 24, def: 6, spd: 14, int: 9 }, xp: 95, ac: 15, onHitEffect: "burn" },
  ],
  5: [
    { name: "NEXUS Shard", stats: { maxHp: 100, hp: 100, maxMp: 0, mp: 0, atk: 22, def: 14, spd: 8, int: 15 }, xp: 100, ac: 19, onHitEffect: "burn" },
  ],
};

/* ----- Mini-boss templates ----- */

const MINI_BOSS_TEMPLATES: Record<number, { name: string; stats: Stats; xp: number; ac: number; onHitEffect?: StatusType; loot: Item }> = {
  2: {
    name: "HYDRA — Bioweapon AI",
    stats: { maxHp: 150, hp: 150, maxMp: 0, mp: 0, atk: 18, def: 10, spd: 7, int: 12 },
    xp: 150, ac: 17, onHitEffect: "poison",
    loot: { id: "mb2-loot", name: "Hydra Fang", description: "+6 ATK", type: "weapon", value: 6 },
  },
  3: {
    name: "ORACLE — Prediction Engine",
    stats: { maxHp: 180, hp: 180, maxMp: 0, mp: 0, atk: 20, def: 12, spd: 10, int: 16 },
    xp: 180, ac: 18, onHitEffect: "stun",
    loot: { id: "mb3-loot", name: "Oracle Shield", description: "+5 DEF", type: "armor", value: 5 },
  },
  4: {
    name: "PHANTOM — Stealth Assassin",
    stats: { maxHp: 200, hp: 200, maxMp: 0, mp: 0, atk: 24, def: 8, spd: 16, int: 14 },
    xp: 220, ac: 19, onHitEffect: "bleed",
    loot: { id: "mb4-loot", name: "Phantom Core", description: "Restores 50 HP + 50 MP", type: "heal", value: 50 },
  },
};

const BOSS_DATA = {
  name: "NEXUS — Rogue AI",
  stats: { maxHp: 400, hp: 400, maxMp: 0, mp: 0, atk: 28, def: 16, spd: 10, int: 22 },
  xp: 500,
  ac: 20,
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

/* ----- Puzzle words/phrases scaled by difficulty ----- */
/* Answer is always in ISW{...} flag format */

/* Tier 1: Floor 1 — baby mode, 5-6 char */
const TIER1_WORDS = ["NEXUS", "GHOST", "VIRUS", "DRONE", "FLAME", "BLADE", "STEEL", "SHARD", "PULSE", "NERVE", "CRASH", "STACK"];

/* Tier 2: Floor 2 — medium, 6-12 char */
const TIER2_WORDS = ["BREACH", "CIPHER", "PROXY_KEY", "CRYPT", "VECTOR", "SHADOW", "KERNEL", "DAEMON", "SOCKET", "BYPASS", "ROOTKIT", "PAYLOAD"];

/* Tier 3: Floor 3 — hard, 12-20 char */
const TIER3_PHRASES = [
  "FIREWALL_BREACH", "STACK_OVERFLOW", "DEAD_PROCESS", "ROOT_EXPLOIT",
  "BUFFER_UNDERRUN", "KERNEL_PANIC", "DARK_PROTOCOL", "QUANTUM_LOCK",
  "MEMORY_CORRUPTION", "PRIVILEGE_ESCALATION",
];

/* Tier 4: Floor 4 — expert leetspeak, 18-28 char */
const TIER4_PHRASES = [
  "N3TW0RK_1NTRUS10N", "Z3R0_D4Y_3XPL01T", "R00T_4CC3SS_GR4NT3D",
  "M41NFR4M3_BR34CH", "PR0T0C0L_0V3RR1D3", "D34D_C0D3_1NJ3CT10N",
  "SH4D0W_PR0XY_4CT1V3", "QU4NTUM_F1R3W4LL",
  "H34P_0V3RFL0W_D3T3CT3D", "SY5T3M_C4LL_1NT3RC3PT",
];

/* Tier 5: Floor 5 — nightmare, 28-38 char */
const TIER5_PHRASES = [
  "S3CUR1TY_THR0UGH_0BSCUR1TY", "1NT3GR4T3D_S3CUR1TY_W0RKS",
  "CYPH3R_PUNK_N3V3R_D13S", "M4CH1N3_L34RN1NG_41",
  "D1G1T4L_F0R3NS1CS_UN1T", "3NCRYPT10N_1S_N0T_4_CR1M3",
  "R3V3RS3_3NG1N33R1NG_PR0T0C0L",
  "4DV4NC3D_P3RS1ST3NT_THR34T",
  "BL4CK_H4T_0P3R4T10N_4CT1V3",
];

/* Tier 6: Floor 6 — nearly impossible, 35-45 char */
const TIER6_PHRASES = [
  "C0MPUT3R_3M3RG3NCY_R3SP0NS3_T34M_4CT1V3",
  "D1STR1BUT3D_D3N14L_0F_S3RV1C3_4TT4CK",
  "4SYM3TR1C_K3Y_3XCH4NG3_PR0T0C0L_F41L",
  "Z3R0_KN0WL3DG3_PR00F_V3R1F1C4T10N",
  "H0M0M0RPH1C_3NCRYPT10N_BR34CH_D3T3CT3D",
  "QU4NTUM_K3Y_D1STR1BUT10N_C0MPR0M1S3D",
  "BL0CKCH41N_C0NS3NSUS_M3CH4N1SM_F41LUR3",
  "P0LYM0RPH1C_M4LW4R3_3V4S10N_T3CHN1QU3",
  "W4R3Z_3L3CT10N_4ND_D1STR1BUT10N_N3TWORK",
  "3XPL01T1NG_S1D3_CH4NN3L_VULN3R4B1L1T13S",
  "R3V3RS3_3NG1N33R1NG_4ND_D3C0D1NG_4LG0R1THMS",
  "P13T3R_D3_W4T3RG13t3R",
];

const VIGENERE_KEYS_EASY = ["KEY", "ICE"];
const VIGENERE_KEYS_HARD = ["HACK", "CODE", "NEXUS", "BREACH"];
const VIGENERE_KEYS_EXPERT = ["MAINFRAME", "SECURITY", "PROTOCOL"];
const VIGENERE_KEYS_NIGHTMARE = ["CRYPTANALYSIS", "VULNERABILITY", "INFRASTRUCTURE"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function pickWord(floor: number): string {
  if (floor <= 0) return pick(TIER1_WORDS);
  if (floor <= 1) return pick(TIER2_WORDS);
  if (floor <= 2) return pick(TIER3_PHRASES);
  if (floor <= 3) return pick(TIER4_PHRASES);
  if (floor <= 4) return pick(TIER5_PHRASES);
  return pick(TIER6_PHRASES);
}

/* ----- Cipher functions ----- */

function caesarEncrypt(text: string, shift: number): string {
  return text.split("").map(ch => {
    if (ch >= "A" && ch <= "Z") return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65);
    if (ch >= "0" && ch <= "9") return String.fromCharCode(((ch.charCodeAt(0) - 48 + shift) % 10) + 48);
    return ch;
  }).join("");
}

function reverseString(text: string): string {
  return text.split("").reverse().join("");
}

function substitutionEncrypt(text: string): string {
  return text.split("").map((ch, i) => {
    if (ch >= "A" && ch <= "Z") return String.fromCharCode(((ch.charCodeAt(0) - 65 + i + 3) % 26) + 65);
    return ch;
  }).join("");
}

function vigenereEncrypt(text: string, key: string): string {
  let ki = 0;
  return text.split("").map(ch => {
    if (ch >= "A" && ch <= "Z") {
      const shift = key.charCodeAt(ki % key.length) - 65;
      ki++;
      return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65);
    }
    return ch;
  }).join("");
}

function atbashEncrypt(text: string): string {
  return text.split("").map(ch => {
    if (ch >= "A" && ch <= "Z") return String.fromCharCode(90 - (ch.charCodeAt(0) - 65));
    return ch;
  }).join("");
}

function railFenceEncrypt(text: string, rails: number): string {
  const fence: string[][] = Array.from({ length: rails }, () => []);
  let rail = 0, dir = 1;
  for (const ch of text) {
    fence[rail].push(ch);
    if (rail === 0) dir = 1;
    if (rail === rails - 1) dir = -1;
    rail += dir;
  }
  return fence.map(r => r.join("")).join("");
}

function toBase64(text: string): string {
  return btoa(text);
}

function toHex(text: string): string {
  return text.split("").map(ch => ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")).join(" ");
}

function toBinary(text: string): string {
  return text.split("").map(ch => ch.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
}

/* ROT47: rotates printable ASCII 33-126 */
function rot47Encrypt(text: string): string {
  return text.split("").map(ch => {
    const c = ch.charCodeAt(0);
    if (c >= 33 && c <= 126) return String.fromCharCode(((c - 33 + 47) % 94) + 33);
    return ch;
  }).join("");
}

/* XOR with a single-byte key, output as hex */
function xorEncrypt(text: string, key: number): string {
  return text.split("").map(ch => (ch.charCodeAt(0) ^ key).toString(16).toUpperCase().padStart(2, "0")).join(" ");
}

/* Morse code */
const MORSE_MAP: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.",
  H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.",
  O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-",
  U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  "_": "..--.-",
};
function morseEncrypt(text: string): string {
  return text.split("").map(ch => MORSE_MAP[ch] || ch).join(" / ");
}

/* Octal encoding */
function toOctal(text: string): string {
  return text.split("").map(ch => ch.charCodeAt(0).toString(8).padStart(3, "0")).join(" ");
}

/* Triple encoding: base64 → reverse → caesar */
function tripleEncode(text: string, shift: number): string {
  const b64 = btoa(text);
  const rev = b64.split("").reverse().join("");
  return caesarEncrypt(rev.toUpperCase(), shift);
}

/* Beaufort cipher: like Vigenère but subtracts plaintext from key */
function beaufortEncrypt(text: string, key: string): string {
  let ki = 0;
  return text.split("").map(ch => {
    if (ch >= "A" && ch <= "Z") {
      const shift = key.charCodeAt(ki % key.length) - 65;
      ki++;
      return String.fromCharCode(((shift - (ch.charCodeAt(0) - 65) + 26) % 26) + 65);
    }
    return ch;
  }).join("");
}

/* Affine cipher: E(x) = (ax + b) mod 26 */
function affineEncrypt(text: string, a: number, b: number): string {
  return text.split("").map(ch => {
    if (ch >= "A" && ch <= "Z") return String.fromCharCode(((a * (ch.charCodeAt(0) - 65) + b) % 26) + 65);
    return ch;
  }).join("");
}

/* Columnar transposition cipher */
function columnarEncrypt(text: string, key: string): string {
  const cols = key.length;
  const rows = Math.ceil(text.length / cols);
  const padded = text.padEnd(rows * cols, "X");
  const order = [...key].map((c, i) => ({ c, i })).sort((a, b) => a.c.localeCompare(b.c)).map(x => x.i);
  let result = "";
  for (const col of order) {
    for (let row = 0; row < rows; row++) {
      result += padded[row * cols + col];
    }
  }
  return result;
}

/* Playfair cipher (5x5 grid, I=J) */
function playfairEncrypt(text: string, key: string): string {
  const alpha = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // no J
  const seen = new Set<string>();
  let grid = "";
  for (const ch of (key + alpha).toUpperCase()) {
    const c = ch === "J" ? "I" : ch;
    if (c >= "A" && c <= "Z" && !seen.has(c)) { grid += c; seen.add(c); }
  }
  const pos = (c: string) => { const i = grid.indexOf(c === "J" ? "I" : c); return { r: Math.floor(i / 5), c: i % 5 }; };
  const at = (r: number, c: number) => grid[r * 5 + c];

  // Prepare digraphs
  let clean = text.replace(/[^A-Z]/g, "").replace(/J/g, "I");
  const pairs: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const a = clean[i];
    const b = i + 1 < clean.length ? clean[i + 1] : "X";
    if (a === b) { pairs.push(a + "X"); i++; } else { pairs.push(a + b); i += 2; }
  }

  return pairs.map(p => {
    const a = pos(p[0]), b = pos(p[1]);
    if (a.r === b.r) return at(a.r, (a.c + 1) % 5) + at(b.r, (b.c + 1) % 5);
    if (a.c === b.c) return at((a.r + 1) % 5, a.c) + at((b.r + 1) % 5, b.c);
    return at(a.r, b.c) + at(b.r, a.c);
  }).join("");
}

/* Polybius square (ADFGX encoding) */
function polybiusEncrypt(text: string): string {
  const alpha = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
  const labels = ["A", "D", "F", "G", "X"];
  return text.replace(/J/g, "I").split("").map(ch => {
    const idx = alpha.indexOf(ch);
    if (idx === -1) return ch;
    return labels[Math.floor(idx / 5)] + labels[idx % 5];
  }).join(" ");
}

/* Autokey Vigenère: key extends with plaintext */
function autokeyEncrypt(text: string, seed: string): string {
  let fullKey = seed;
  let ki = 0;
  return text.split("").map(ch => {
    if (ch >= "A" && ch <= "Z") {
      if (ki >= fullKey.length) fullKey += ch; // extend key with plaintext BEFORE encryption
      const shift = fullKey.charCodeAt(ki) - 65;
      ki++;
      return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65);
    }
    return ch;
  }).join("");
}

/* Bacon's cipher: each letter → 5-bit binary as A/B */
function baconEncrypt(text: string): string {
  return text.split("").map(ch => {
    if (ch >= "A" && ch <= "Z") {
      const n = ch === "J" ? 9 : ch.charCodeAt(0) - 65;
      return n.toString(2).padStart(5, "0").replace(/0/g, "a").replace(/1/g, "b");
    }
    return ch;
  }).join(" ");
}

/* Bifid cipher: Polybius + transposition */
function bifidEncrypt(text: string, key: string): string {
  const alpha = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
  const seen = new Set<string>();
  let grid = "";
  for (const ch of (key + alpha).toUpperCase()) {
    const c = ch === "J" ? "I" : ch;
    if (c >= "A" && c <= "Z" && !seen.has(c)) { grid += c; seen.add(c); }
  }
  const pos = (c: string) => { const i = grid.indexOf(c === "J" ? "I" : c); return [Math.floor(i / 5), i % 5]; };
  const at = (r: number, c: number) => grid[r * 5 + c];

  const clean = text.replace(/[^A-Z]/g, "").replace(/J/g, "I");
  const rows: number[] = [], cols: number[] = [];
  for (const ch of clean) { const [r, c] = pos(ch); rows.push(r); cols.push(c); }
  const combined = [...rows, ...cols];
  let result = "";
  for (let i = 0; i < combined.length; i += 2) {
    result += at(combined[i], combined[i + 1]);
  }
  return result;
}

/* ADFGVX cipher: Polybius with fractionation + columnar transposition */
function adfgvxEncrypt(text: string, colKey: string): string {
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const labels = ["A", "D", "F", "G", "V", "X"];
  // Polybius 6x6
  const fractionated = text.replace(/[^A-Z0-9]/g, "").split("").map(ch => {
    const idx = alpha.indexOf(ch);
    if (idx === -1) return "";
    return labels[Math.floor(idx / 6)] + labels[idx % 6];
  }).join("");
  // Columnar transposition on fractionated text
  return columnarEncrypt(fractionated, colKey);
}

/* Quadruple: Vigenère → Base64 → Reverse → ROT47 */
function quadrupleEncode(text: string, vKey: string): string {
  const step1 = vigenereEncrypt(text, vKey);
  const step2 = btoa(step1);
  const step3 = step2.split("").reverse().join("");
  return rot47Encrypt(step3);
}

/* Nightmare: XOR → Hex → Reverse → Caesar → Atbash */
function nightmareEncode(text: string, xorKey: number, shift: number): string {
  const step1 = xorEncrypt(text, xorKey);
  const step2 = step1.split(" ").reverse().join(" ");
  const step3 = caesarEncrypt(step2.replace(/ /g, ""), shift);
  return atbashEncrypt(step3);
}

type PuzzleType = "caesar" | "reverse" | "substitution" | "vigenere" | "atbash" | "railfence" | "base64" | "hex" | "binary" | "double" | "rot47" | "xor" | "morse" | "octal" | "triple" | "beaufort" | "affine" | "columnar" | "playfair" | "polybius" | "autokey" | "bacon" | "bifid" | "adfgvx" | "quadruple" | "nightmare";

/* Floor → available cipher types — MASSIVE difficulty scaling */
const FLOOR_CIPHERS: PuzzleType[][] = [
  /* 0 — baby */ ["caesar", "reverse", "atbash"],
  /* 1 — easy */ ["substitution", "morse", "base64", "rot47"],
  /* 2 — medium */ ["vigenere", "railfence", "hex", "affine", "beaufort"],
  /* 3 — hard */ ["binary", "xor", "double", "columnar", "playfair", "polybius"],
  /* 4 — nightmare */ ["autokey", "bacon", "bifid", "triple", "adfgvx", "quadruple"],
  /* 5 — impossible */ ["bifid", "adfgvx", "quadruple", "nightmare", "playfair"],
];

export function createPuzzle(floor: number, x: number, y: number, id: string): Puzzle {
  const innerWord = pickWord(floor);
  // The answer is always ISW{...} format
  const flagAnswer = `ISW{${innerWord}}`;
  // We encrypt only the inner word, player must type the full ISW{...} flag
  const available = FLOOR_CIPHERS[Math.min(floor, FLOOR_CIPHERS.length - 1)];
  const type = available[Math.floor(Math.random() * available.length)];

  let cipherText: string;
  let hint: string;

  switch (type) {
    case "caesar": {
      const shift = 3 + floor * 2 + Math.floor(Math.random() * 8);
      cipherText = caesarEncrypt(innerWord, shift);
      hint = `Caesar cipher, shift ${shift}. Encrypted: ${cipherText}\nAnswer format: ISW{decrypted_text}`;
      break;
    }
    case "reverse":
      cipherText = reverseString(innerWord);
      hint = `Reversed text: ${cipherText}\nAnswer format: ISW{original_text}`;
      break;
    case "substitution":
      cipherText = substitutionEncrypt(innerWord);
      hint = `Position-shift cipher (letter[i] += i+3). Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    case "vigenere": {
      const keys = floor >= 4 ? VIGENERE_KEYS_EXPERT : floor >= 2 ? VIGENERE_KEYS_HARD : VIGENERE_KEYS_EASY;
      const key = keys[Math.floor(Math.random() * keys.length)];
      cipherText = vigenereEncrypt(innerWord, key);
      hint = `Vigenère cipher, key="${key}". Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    }
    case "atbash":
      cipherText = atbashEncrypt(innerWord);
      hint = `Atbash mirror cipher (A↔Z, B↔Y...). Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    case "railfence": {
      const rails = floor >= 3 ? 4 : 3;
      cipherText = railFenceEncrypt(innerWord, rails);
      hint = `Rail Fence cipher, ${rails} rails. Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    }
    case "base64":
      cipherText = toBase64(innerWord);
      hint = `Base64 encoded: ${cipherText}\nAnswer format: ISW{decoded_text}`;
      break;
    case "hex":
      cipherText = toHex(innerWord);
      hint = `Hex-encoded ASCII: ${cipherText}\nAnswer format: ISW{decoded}`;
      break;
    case "binary":
      cipherText = toBinary(innerWord);
      hint = `Binary ASCII: ${cipherText}\nAnswer format: ISW{decoded}`;
      break;
    case "double": {
      const shift = 5 + Math.floor(Math.random() * 8);
      const step1 = caesarEncrypt(innerWord, shift);
      cipherText = reverseString(step1);
      hint = `Double: Caesar(shift ${shift}) → Reverse. Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    }
    case "rot47":
      cipherText = rot47Encrypt(innerWord);
      hint = `ROT47 cipher (rotates printable ASCII by 47). Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    case "xor": {
      const xorKey = 42 + floor * 7;
      cipherText = xorEncrypt(innerWord, xorKey);
      hint = `XOR cipher, key=0x${xorKey.toString(16).toUpperCase()} (${xorKey}). Hex output: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    }
    case "morse":
      cipherText = morseEncrypt(innerWord);
      hint = `Morse code: ${cipherText}\nAnswer format: ISW{decoded_text}`;
      break;
    case "octal":
      cipherText = toOctal(innerWord);
      hint = `Octal-encoded ASCII: ${cipherText}\nAnswer format: ISW{decoded}`;
      break;
    case "triple": {
      const shift = 3 + Math.floor(Math.random() * 5);
      cipherText = tripleEncode(innerWord, shift);
      hint = `Triple: Base64 → Reverse → Caesar(shift ${shift}). Encrypted: ${cipherText}\nAnswer format: ISW{original_text}`;
      break;
    }
    case "beaufort": {
      const keys = floor >= 4 ? VIGENERE_KEYS_NIGHTMARE : VIGENERE_KEYS_HARD;
      const key = pick(keys);
      cipherText = beaufortEncrypt(innerWord.replace(/[^A-Z]/g, ""), key);
      hint = `Beaufort cipher (key subtracts plaintext), key="${key}". Encrypted: ${cipherText}\nPlaintext had non-alpha chars stripped. Answer format: ISW{decrypted}`;
      break;
    }
    case "affine": {
      const aVals = [3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];
      const a = pick(aVals);
      const b = 3 + Math.floor(Math.random() * 20);
      cipherText = affineEncrypt(innerWord, a, b);
      hint = `Affine cipher: E(x) = (${a}x + ${b}) mod 26. Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    }
    case "columnar": {
      const colKeys = ["HACK", "NEXUS", "CIPHER", "BREACH", "QUANTUM"];
      const key = pick(colKeys);
      cipherText = columnarEncrypt(innerWord.replace(/[^A-Z0-9]/g, ""), key);
      hint = `Columnar transposition, key="${key}" (alphabetical column order). Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    }
    case "playfair": {
      const pfKeys = ["SECURITY", "MAINFRAME", "CYBERPUNK", "PROTOCOL"];
      const key = pick(pfKeys);
      cipherText = playfairEncrypt(innerWord.replace(/[^A-Z]/g, ""), key);
      hint = `Playfair cipher (5×5 grid, I=J), key="${key}". Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    }
    case "polybius":
      cipherText = polybiusEncrypt(innerWord.replace(/[^A-Z]/g, ""));
      hint = `Polybius square (ADFGX encoding, 5×5 grid, I=J). Encoded: ${cipherText}\nAnswer format: ISW{decoded}`;
      break;
    case "autokey": {
      const seeds = ["KEY", "HACK", "NEXUS", "BREACH", "MAINFRAME"];
      const seed = pick(seeds);
      cipherText = autokeyEncrypt(innerWord.replace(/[^A-Z]/g, ""), seed);
      hint = `Autokey Vigenère (key extends with plaintext), seed="${seed}". Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    }
    case "bacon":
      cipherText = baconEncrypt(innerWord.replace(/[^A-Z]/g, ""));
      hint = `Bacon's cipher (5-bit binary a/b encoding, I=J). Encoded: ${cipherText}\nAnswer format: ISW{decoded}`;
      break;
    case "bifid": {
      const bfKeys = ["SECURITY", "MAINFRAME", "QUANTUM", "PROTOCOL"];
      const key = pick(bfKeys);
      cipherText = bifidEncrypt(innerWord.replace(/[^A-Z]/g, ""), key);
      hint = `Bifid cipher (Polybius + transposition, I=J), key="${key}". Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    }
    case "adfgvx": {
      const colKeys = ["HACK", "NEXUS", "CIPHER"];
      const key = pick(colKeys);
      cipherText = adfgvxEncrypt(innerWord.replace(/[^A-Z0-9]/g, ""), key);
      hint = `ADFGVX cipher (6×6 Polybius + columnar), column key="${key}". Encrypted: ${cipherText}\nAnswer format: ISW{decoded}`;
      break;
    }
    case "quadruple": {
      const key = pick(VIGENERE_KEYS_NIGHTMARE);
      cipherText = quadrupleEncode(innerWord.replace(/[^A-Z]/g, ""), key);
      hint = `Quadruple: Vigenère(key="${key}") → Base64 → Reverse → ROT47. Encrypted: ${cipherText}\nAnswer format: ISW{original}`;
      break;
    }
    case "nightmare": {
      const xKey = 42 + floor * 13;
      const shift = 7 + floor * 3;
      cipherText = nightmareEncode(innerWord.replace(/[^A-Z0-9]/g, ""), xKey, shift);
      hint = `NIGHTMARE: XOR(key=0x${xKey.toString(16).toUpperCase()}) → Hex → Reverse → Caesar(shift ${shift}) → Atbash.\nEncrypted: ${cipherText}\nAnswer format: ISW{original}`;
      break;
    }
  }

  const rewardItems: Item[] = [
    { id: `pr-${id}`, name: "Mana Cell", description: "Restores 30 MP", type: "mana", value: 30 },
    { id: `pr-${id}`, name: "NanoMed Kit+", description: "Restores 35 HP", type: "heal", value: 35 },
    { id: `pr-${id}`, name: "Antidote Patch", description: "Clears all status effects", type: "antidote", value: 0 },
  ];

  return {
    id, x, y, floor,
    solved: false, type,
    plainText: flagAnswer, cipherText, hint,
    reward: pick(rewardItems),
    rewardXp: 30 + floor * 35,
  };
}

/* ----- Trap positions tracked per floor ----- */

export interface TrapTile {
  x: number;
  y: number;
  floor: number;
  triggered: boolean;
}

export function parseFloor(floor: number) {
  const map = FLOOR_MAPS[floor];
  const enemies: Enemy[] = [];
  const npcs: NPC[] = [];
  const groundItems: GroundItem[] = [];
  const doors: Door[] = [];
  const puzzles: Puzzle[] = [];
  const traps: TrapTile[] = [];
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
            id: `e${floor}-${enemyCount}`, name: tmpl.name, symbol: "E",
            stats: { ...tmpl.stats }, xpReward: tmpl.xp, alive: true,
            x, y, floor, loot: tmpl.loot, ac: tmpl.ac,
            statusEffects: [], onHitEffect: tmpl.onHitEffect,
          });
          enemyCount++;
          cleaned += ".";
          break;
        }
        case "M": {
          const mb = MINI_BOSS_TEMPLATES[floor];
          if (mb) {
            enemies.push({
              id: `miniboss-${floor}`, name: mb.name, symbol: "M",
              stats: { ...mb.stats }, xpReward: mb.xp, alive: true,
              x, y, floor, loot: mb.loot, isBoss: true,
              ac: mb.ac, statusEffects: [], onHitEffect: mb.onHitEffect,
            });
          }
          cleaned += ".";
          break;
        }
        case "B": {
          enemies.push({
            id: `boss-${floor}`, name: BOSS_DATA.name, symbol: "B",
            stats: { ...BOSS_DATA.stats }, xpReward: BOSS_DATA.xp, alive: true,
            x, y, floor, isBoss: true, ac: BOSS_DATA.ac,
            statusEffects: [], onHitEffect: BOSS_DATA.onHitEffect,
          });
          cleaned += ".";
          break;
        }
        case "N": {
          const dialogueTrees = NPC_DIALOGUE_TREES[floor] || [[{ npcText: ["..."], choices: [] }]];
          const tree = dialogueTrees[npcCount % dialogueTrees.length];
          npcs.push({
            id: `n${floor}-${npcCount}`, name: `NPC_${floor}_${npcCount}`, symbol: "N",
            dialogue: [], dialogueTree: tree, x, y, floor, talkCount: 0,
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
        case "X": {
          traps.push({ x, y, floor, triggered: false });
          cleaned += "."; // traps are walkable but hidden
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
            ...tmpl, id: `i${floor}-${itemCount}`,
            x, y, floor, picked: false,
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

  return { cleanMap, enemies, npcs, groundItems, doors, puzzles, traps, playerStart };
}

/* ----- Floor names ----- */
export const FLOOR_NAMES = [
  "FLOOR 1 — Server Room",
  "FLOOR 2 — Research Lab",
  "FLOOR 3 — Executive Suite",
  "FLOOR 4 — Biotech Lab",
  "FLOOR 5 — Quantum Core",
  "FLOOR 6 — NEXUS Chamber",
];

/* ----- Random spawn helper ----- */
export function createRandomEnemy(floor: number, x: number, y: number, idSuffix: string): Enemy {
  const templates = ENEMY_TEMPLATES[floor] || ENEMY_TEMPLATES[0];
  const tmpl = templates[Math.floor(Math.random() * templates.length)];
  return {
    id: `spawn-${floor}-${idSuffix}`, name: tmpl.name, symbol: "E",
    stats: { ...tmpl.stats }, xpReward: tmpl.xp, alive: true,
    x, y, floor, loot: tmpl.loot, ac: tmpl.ac,
    statusEffects: [], onHitEffect: tmpl.onHitEffect,
  };
}

