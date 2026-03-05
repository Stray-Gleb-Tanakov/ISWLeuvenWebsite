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

const EASY_WORDS = ["NEXUS", "GHOST", "VIRUS", "DRONE", "FLAME", "BLADE", "STEEL", "SHARD", "PULSE", "NERVE"];
const MEDIUM_WORDS = ["BREACH", "CIPHER", "PROXY", "CRYPT", "VECTOR", "SHADOW", "KERNEL", "DAEMON", "SOCKET", "BYPASS"];
const HARD_PHRASES = [
  "FIREWALL_BREACH", "STACK_OVERFLOW", "DEAD_PROCESS", "ROOT_EXPLOIT",
  "BUFFER_UNDERRUN", "KERNEL_PANIC", "DARK_PROTOCOL", "QUANTUM_LOCK",
];
const EXPERT_PHRASES = [
  "N3TW0RK_1NTRUS10N", "Z3R0_D4Y_3XPL01T", "R00T_4CC3SS_GR4NT3D",
  "M41NFR4M3_BR34CH", "PR0T0C0L_0V3RR1D3", "D34D_C0D3_1NJ3CT10N",
  "SH4D0W_PR0XY_4CT1V3", "QU4NTUM_F1R3W4LL",
];
const NIGHTMARE_PHRASES = [
  "S3CUR1TY_THR0UGH_0BSCUR1TY", "1NT3GR4T3D_S3CUR1TY_W0RKS",
  "CYPH3R_PUNK_N3V3R_D13S", "M4CH1N3_L34RN1NG_41",
  "D1G1T4L_F0R3NS1CS_UN1T", "3NCRYPT10N_1S_N0T_4_CR1M3",
];

const VIGENERE_KEYS_EASY = ["KEY", "ICE"];
const VIGENERE_KEYS_HARD = ["HACK", "CODE", "NEXUS", "BREACH"];
const VIGENERE_KEYS_EXPERT = ["MAINFRAME", "SECURITY", "PROTOCOL"];

function pickWord(floor: number): string {
  if (floor <= 0) return EASY_WORDS[Math.floor(Math.random() * EASY_WORDS.length)];
  if (floor <= 1) return MEDIUM_WORDS[Math.floor(Math.random() * MEDIUM_WORDS.length)];
  if (floor <= 2) return HARD_PHRASES[Math.floor(Math.random() * HARD_PHRASES.length)];
  if (floor <= 3) return EXPERT_PHRASES[Math.floor(Math.random() * EXPERT_PHRASES.length)];
  if (floor <= 4) return NIGHTMARE_PHRASES[Math.floor(Math.random() * NIGHTMARE_PHRASES.length)];
  // Floor 5+: nightmare with extra leetspeak
  return NIGHTMARE_PHRASES[Math.floor(Math.random() * NIGHTMARE_PHRASES.length)];
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

type PuzzleType = "caesar" | "reverse" | "substitution" | "vigenere" | "atbash" | "railfence" | "base64" | "hex" | "binary" | "double" | "rot47" | "xor" | "morse" | "octal" | "triple";

/* Floor → available cipher types (harder as you go deeper) */
const FLOOR_CIPHERS: PuzzleType[][] = [
  /* 0 */ ["caesar", "reverse", "atbash"],
  /* 1 */ ["substitution", "atbash", "morse"],
  /* 2 */ ["vigenere", "railfence", "hex", "rot47"],
  /* 3 */ ["base64", "binary", "xor", "double"],
  /* 4 */ ["morse", "octal", "triple", "xor", "vigenere"],
  /* 5 */ ["triple", "xor", "binary", "rot47", "vigenere"],
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
    reward: rewardItems[Math.floor(Math.random() * rewardItems.length)],
    rewardXp: 30 + floor * 25,
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

