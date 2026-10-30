/* ====================================================
   CYBERPUNK TERMINAL RPG — Game Data
   Maps, classes, enemies, items, NPCs, puzzles
   ==================================================== */

import type { ClassName, Stats, Enemy, NPC, GroundItem, Item, Door, DialogueNode, Puzzle, PuzzleType, Skill, StatusType, Merchant } from "./types";
import { BOOKS, bookEncode, canBookEncode } from "./book";
import { sha1Hex } from "./sha1";
import { floorRng, shuffleFloor } from "./placement";

/* ----- Class definitions with MP ----- */

export const CLASS_DATA: Record<ClassName, { desc: string; stats: Stats; special: string; skills: Skill[] }> = {
  Netrunner: {
    desc: "High INT hacker. Weak body, devastating exploits.",
    special: "ICE Breaker — HACK QTE: type the code fast (up to 3x INT, ignores DEF)",
    stats: { maxHp: 120, hp: 120, maxMp: 200, mp: 200, atk: 5, def: 2, spd: 8, int: 16 },
    skills: [
      { name: "ICE Breaker", mpCost: 20, cooldown: 0, currentCooldown: 0, description: "2x INT pure damage" },
      { name: "Virus Upload", mpCost: 15, cooldown: 3, currentCooldown: 0, description: "Poisons enemy (3 turns)" },
      { name: "Firewall", mpCost: 25, cooldown: 5, currentCooldown: 0, description: "+5 DEF for 3 turns" },
    ],
  },
  Cyborg: {
    desc: "Chrome-plated bruiser. Tanks hits, hits harder.",
    special: "Overclock — GAUGE QTE: stop the needle in the green (up to 3.5x ATK, no recoil on perfect; a miss backfires on you)",
    stats: { maxHp: 200, hp: 200, maxMp: 60, mp: 60, atk: 20, def: 8, spd: 4, int: 3 },
    skills: [
      { name: "Overclock", mpCost: 15, cooldown: 0, currentCooldown: 0, description: "3x ATK, recoil damage" },
      { name: "Chrome Slam", mpCost: 10, cooldown: 2, currentCooldown: 0, description: "Stuns enemy 1 turn" },
      { name: "Repair Nanites", mpCost: 20, cooldown: 4, currentCooldown: 0, description: "Heal 25% max HP" },
    ],
  },
  Ghost: {
    desc: "Invisible operative. Fast, lethal, fragile.",
    special: "Shadow Combo — ARROW QTE: repeat the sequence (more hits per arrow, bleed on perfect)",
    stats: { maxHp: 150, hp: 150, maxMp: 120, mp: 120, atk: 15, def: 6, spd: 18, int: 9 },
    skills: [
      { name: "Shadow Combo", mpCost: 18, cooldown: 0, currentCooldown: 0, description: "Arrow QTE combo, bleed on perfect" },
      { name: "Smoke Bomb", mpCost: 12, cooldown: 3, currentCooldown: 0, description: "Guaranteed flee + stealth" },
      { name: "Poison Blade", mpCost: 10, cooldown: 2, currentCooldown: 0, description: "ATK + poison 3 turns" },
    ],
  },
  Sysadmin: {
    desc: "Keeps the servers alive. Fixes things by typing real Linux commands.",
    special: "sudo fix — SHELL QTE: a real error appears, type the command that fixes it to deploy/repair a combat drone",
    stats: { maxHp: 140, hp: 140, maxMp: 140, mp: 140, atk: 10, def: 6, spd: 8, int: 13 },
    skills: [
      { name: "sudo fix", mpCost: 18, cooldown: 0, currentCooldown: 0, description: "Shell QTE: deploy or repair your drone" },
      { name: "kill -9", mpCost: 15, cooldown: 3, currentCooldown: 0, description: "2x INT damage, ignores DEF" },
      { name: "Restore Backup", mpCost: 25, cooldown: 5, currentCooldown: 0, description: "Heal 30% max HP" },
    ],
  },
  "Script Kiddie": {
    desc: "Never wrote a line of code. Copies everyone else's. Somehow it works.",
    special: "Copy-Paste Exploit — a random other class's QTE every time",
    stats: { maxHp: 115, hp: 115, maxMp: 130, mp: 130, atk: 11, def: 4, spd: 11, int: 11 },
    skills: [
      { name: "Copy-Paste Exploit", mpCost: 15, cooldown: 0, currentCooldown: 0, description: "Random class QTE + its effect" },
      { name: "Google It", mpCost: 10, cooldown: 3, currentCooldown: 0, description: "Random: heal, big hit or stun" },
      { name: "LOIC", mpCost: 20, cooldown: 4, currentCooldown: 0, description: "DDoS: 3 weak hits" },
    ],
  },
  "Social Engineer": {
    desc: "Talks their way through everything. The whole run becomes a text adventure: type what you say.",
    special: "Gaslight — HACK QTE when a conversation turns into a fight",
    stats: { maxHp: 110, hp: 110, maxMp: 110, mp: 110, atk: 9, def: 4, spd: 12, int: 14 },
    skills: [
      { name: "Gaslight", mpCost: 15, cooldown: 0, currentCooldown: 0, description: "Hack QTE, INT damage" },
      { name: "Smooth Talk", mpCost: 10, cooldown: 3, currentCooldown: 0, description: "Stun the enemy for 1 turn" },
      { name: "Fake Badge", mpCost: 15, cooldown: 4, currentCooldown: 0, description: "Walk away from the fight" },
    ],
  },
};

/* Classes that have to be unlocked first */
export const LOCKED_CLASSES: Partial<Record<ClassName, { hint: string; unlocked: (flagsFound: number) => boolean }>> = {
  "Script Kiddie": { hint: "Upload any hidden website flag at a U to unlock", unlocked: (flags) => flags >= 1 },
};

/* ----- Floor maps ----- */
/* Legend: @ = start, E = enemy, B = boss, M = mini-boss, N = NPC,
   T = terminal puzzle, D = locked door, > = stairs down, $ = merchant, U = flag uplink,
   + = health, K = keycard, W = weapon, A = armor, X = trap */

const FLOOR_1 = [
  "########################################",
  "#@.....#........#.........#............#",
  "#.....$#........#.........#............#",
  "#......#...E....#....N....#.....+.....#",
  "#U.....#........#.........#............#",
  "####.###........#.........####.########",
  "#......................................#",
  "#.......E.................K............#",
  "#....................................E.#",
  "#........###.##.####.###.#............#",
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
  "#.........$#.........#................#",
  "#U.........#....E....#.......N........#",
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
  "#.........$............................#",
  "#U...N.......................T.........#",
  "#......................................#",
  "#.....###..##.###.##.######............#",
  "#.....#....#.#....#.#.....#............#",
  "#.....#.E..#.#.+..#.#...W.#............#",
  "#.....#....#.#....#.#..................#",
  "#.....######.######.######.............#",
  "#......................................#",
  "#.........E..........E........T........#",
  "#......................................#",
  "####################D######.############",
  "#......................................#",
  "#..........+.......A...................#",
  "#..........X...........X...............#",
  "#.....M.........................T......#",
  "#....................................>.#",
  "########################################",
];

const FLOOR_4 = [
  "########################################",
  "#@.........X.........X................#",
  "#.......$..............................#",
  "#U...N...........E...........+........#",
  "#......................................#",
  "####.##########.####.#################",
  "#..........#.......#.................X#",
  "#..X.......#...E...#.........K........#",
  "#..........#.......#..................#",
  "#..........####D####..................#",
  "#..........................T...........#",
  "#..E.............X.............E......#",
  "#......................................#",
  "#.....###.##.###.##...................#",
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
  "#.......$..............................#",
  "#U.N...................................#",
  "#.........................T............#",
  "###.########.########.################",
  "#......#........#........#............#",
  "#..E...#..X.E...#...E.X..#....+......#",
  "#......#........#........#............#",
  "#......####.####.####.####............#",
  "#.................................T....#",
  "#..........X....X....X................#",
  "#.....T................................#",
  "####D###############.##################",
  "#......................................#",
  "#..K...........W.......A..............#",
  "#......X.....X.....X.....X............#",
  "#......................................#",
  "#...............M..............T.......#",
  "#....................................>.#",
  "########################################",
];

const FLOOR_6 = [
  "########################################",
  "#@.....................................#",
  "#.......$..............................#",
  "#U...N.................................#",
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
  stats: { maxHp: 320, hp: 320, maxMp: 0, mp: 0, atk: 25, def: 14, spd: 10, int: 22 },
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
  "P13T3R_D3_W4T3RG13T3R",
];

/* Leaked-password style words for the SHA-1 puzzle: unsalted hashes of these
   are in every public lookup table (crackstation, hashes.com) and in rockyou.txt */
const HASH_WORDS = [
  "dragon", "shadow", "monkey", "hunter", "master", "letmein", "freedom", "whatever",
  "trustno1", "qwerty", "starwars", "iloveyou", "princess", "sunshine", "football",
  "computer", "superman", "matrix", "pokemon", "batman",
];

const VIGENERE_KEYS_EASY = ["KEY", "ICE"];
const VIGENERE_KEYS_HARD = ["HACK", "CODE", "NEXUS", "BREACH"];
const VIGENERE_KEYS_EXPERT = ["MAINFRAME", "SECURITY", "PROTOCOL"];
const VIGENERE_KEYS_NIGHTMARE = ["CRYPTANALYSIS", "VULNERABILITY", "INFRASTRUCTURE"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const WORD_TIERS = [TIER1_WORDS, TIER2_WORDS, TIER3_PHRASES, TIER4_PHRASES, TIER5_PHRASES, TIER6_PHRASES];

/* `fits` restricts the pool to words a cipher can represent unambiguously */
function pickWord(floor: number, fits: (w: string) => boolean = () => true): string {
  const tier = WORD_TIERS[Math.min(Math.max(floor, 0), WORD_TIERS.length - 1)];
  const usable = tier.filter(fits);
  return pick(usable.length > 0 ? usable : tier);
}

/* Undo leetspeak, for ciphers that only work on letters */
function deleet(text: string): string {
  return text.replace(/[013457]/g, (d) => ({ "0": "O", "1": "I", "3": "E", "4": "A", "5": "S", "7": "T" })[d]!);
}

/* Apply a letters-only cipher to each "_"-separated word, keeping the underscores */
function perWord(text: string, encrypt: (word: string) => string): string {
  return text.split("_").map(encrypt).join("_");
}

/* Phone keypad multi-tap: press a key N times for its Nth character */
const KEYPAD = ["0", "1", "ABC2", "DEF3", "GHI4", "JKL5", "MNO6", "PQRS7", "TUV8", "WXYZ9"];
function keypadEncode(text: string): string {
  return [...text].map((ch) => {
    if (ch === "_") return "0";
    if (ch === "0") return "00";
    const key = KEYPAD.findIndex((k, i) => i >= 2 && k.includes(ch));
    if (key === -1) return ch === "1" ? "1" : ch;
    return String(key).repeat(KEYPAD[key].indexOf(ch) + 1);
  }).join(" ");
}

/* ----- Cipher functions ----- */

function caesarEncrypt(text: string, shift: number): string {
  return text.split("").map(ch => {
    if (ch >= "A" && ch <= "Z") return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65);
    if (ch >= "a" && ch <= "z") return String.fromCharCode(((ch.charCodeAt(0) - 97 + shift) % 26) + 97);
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

/* Triple encoding: base64 → reverse → caesar (case kept, base64 is case-sensitive) */
function tripleEncode(text: string, shift: number): string {
  const b64 = btoa(text);
  const rev = b64.split("").reverse().join("");
  return caesarEncrypt(rev, shift);
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

/* Columnar transposition cipher (irregular: no padding, short last row) */
function columnarEncrypt(text: string, key: string): string {
  const cols = key.length;
  const rows = Math.ceil(text.length / cols);
  const order = [...key].map((c, i) => ({ c, i })).sort((a, b) => a.c.localeCompare(b.c) || a.i - b.i).map(x => x.i);
  let result = "";
  for (const col of order) {
    for (let row = 0; row < rows; row++) {
      result += text[row * cols + col] ?? "";
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
  const fullKey = seed + text.replace(/[^A-Z]/g, ""); // key = seed followed by the plaintext letters
  let ki = 0;
  return text.split("").map(ch => {
    if (ch >= "A" && ch <= "Z") {
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
  const fractionated = text.split("").map(ch => {
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

/* Floor → available cipher types — MASSIVE difficulty scaling */
const FLOOR_CIPHERS: PuzzleType[][] = [
  /* 0 — baby */ ["caesar", "reverse", "atbash", "keypad"],
  /* 1 — easy */ ["substitution", "morse", "base64", "rot47", "keypad", "book_acrostic"],
  /* 2 — medium */ ["vigenere", "railfence", "hex", "affine", "beaufort", "sha1", "book_about"],
  /* 3 — hard */ ["binary", "xor", "double", "columnar", "playfair", "polybius", "sha1", "book_events"],
  /* 4 — nightmare */ ["autokey", "bacon", "bifid", "triple", "adfgvx", "quadruple", "book_members"],
  /* 5 — impossible */ ["bifid", "adfgvx", "quadruple", "nightmare", "playfair", "book_events"],
];

const BOOK_RULES = "Words are split on spaces and every word counts (start at 1). Inside a word count only letters/digits. 'x' = literal character.";

export function createPuzzle(floor: number, x: number, y: number, id: string, forceType?: PuzzleType): Puzzle {
  // The answer is always ISW{...} format; only the inner word is encrypted.
  // Cases below may swap innerWord for one their cipher can represent.
  let innerWord = pickWord(floor);
  const available = FLOOR_CIPHERS[Math.min(floor, FLOOR_CIPHERS.length - 1)];
  const type = forceType ?? available[Math.floor(Math.random() * available.length)];

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
      hint = `Triple: Base64 → Reverse → Caesar(shift ${shift}, case kept, digits mod 10). Encrypted: ${cipherText}\nAnswer format: ISW{original_text}`;
      break;
    }
    case "beaufort": {
      const keys = floor >= 4 ? VIGENERE_KEYS_NIGHTMARE : VIGENERE_KEYS_HARD;
      const key = pick(keys);
      cipherText = beaufortEncrypt(innerWord, key);
      hint = `Beaufort cipher (key subtracts plaintext), key="${key}". Digits and "_" are left as-is. Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
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
      cipherText = columnarEncrypt(innerWord, key);
      hint = `Columnar transposition, key="${key}" (read columns in alphabetical key order, irregular: no padding). Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    }
    case "playfair": {
      // Letters only and I=J: use the de-leeted phrase, without J, one word at a time
      innerWord = deleet(pickWord(floor, (w) => !deleet(w).includes("J")));
      const pfKeys = ["SECURITY", "MAINFRAME", "CYBERPUNK", "PROTOCOL"];
      const key = pick(pfKeys);
      cipherText = perWord(innerWord, (w) => playfairEncrypt(w, key));
      hint = `Playfair cipher (5×5 grid, I=J), key="${key}". Each word encrypted separately, "_" kept. Drop the filler X's after decrypting. Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    }
    case "polybius":
      innerWord = pickWord(floor, (w) => !w.includes("J"));
      cipherText = polybiusEncrypt(innerWord);
      hint = `Polybius square (ADFGX encoding, 5×5 grid, I=J). Digits and "_" are left as-is. Encoded: ${cipherText}\nAnswer format: ISW{decoded}`;
      break;
    case "autokey": {
      const seeds = ["KEY", "HACK", "NEXUS", "BREACH", "MAINFRAME"];
      const seed = pick(seeds);
      cipherText = autokeyEncrypt(innerWord, seed);
      hint = `Autokey Vigenère (key extends with plaintext letters), seed="${seed}". Digits and "_" are left as-is. Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    }
    case "bacon":
      innerWord = pickWord(floor, (w) => !w.includes("J"));
      cipherText = baconEncrypt(innerWord);
      hint = `Bacon's cipher (5-bit binary a/b encoding, A=aaaaa … Z=bbaab, I=J). Digits and "_" are left as-is. Encoded: ${cipherText}\nAnswer format: ISW{decoded}`;
      break;
    case "bifid": {
      innerWord = deleet(pickWord(floor, (w) => !deleet(w).includes("J")));
      const bfKeys = ["SECURITY", "MAINFRAME", "QUANTUM", "PROTOCOL"];
      const key = pick(bfKeys);
      cipherText = perWord(innerWord, (w) => bifidEncrypt(w, key));
      hint = `Bifid cipher (Polybius + transposition, I=J), key="${key}". Each word encrypted separately, "_" kept. Encrypted: ${cipherText}\nAnswer format: ISW{decrypted}`;
      break;
    }
    case "adfgvx": {
      const colKeys = ["HACK", "NEXUS", "CIPHER"];
      const key = pick(colKeys);
      cipherText = perWord(innerWord, (w) => adfgvxEncrypt(w, key));
      hint = `ADFGVX cipher (6×6 Polybius A-Z then 0-9, rows/cols ADFGVX + irregular columnar), column key="${key}". Each word encrypted separately, "_" kept. Encrypted: ${cipherText}\nAnswer format: ISW{decoded}`;
      break;
    }
    case "quadruple": {
      const key = pick(VIGENERE_KEYS_NIGHTMARE);
      cipherText = quadrupleEncode(innerWord, key);
      hint = `Quadruple: Vigenère(key="${key}", letters only) → Base64 → Reverse → ROT47. Encrypted: ${cipherText}\nAnswer format: ISW{original}`;
      break;
    }
    case "nightmare": {
      const xKey = 42 + floor * 13;
      const shift = 7 + floor * 3;
      cipherText = nightmareEncode(innerWord, xKey, shift);
      hint = `NIGHTMARE: XOR(key=0x${xKey.toString(16).toUpperCase()}) → Hex → Reverse bytes → Caesar(shift ${shift}, digits mod 10) → Atbash.\nEncrypted: ${cipherText}\nAnswer format: ISW{original}`;
      break;
    }
    case "sha1": {
      const word = pick(HASH_WORDS);
      innerWord = word.toUpperCase();
      cipherText = sha1Hex(word);
      hint = `Leaked password hash (unsalted SHA-1 of a lowercase password): ${cipherText}\nCrack it or look it up. Answer format: ISW{password}`;
      break;
    }
    case "keypad":
      cipherText = keypadEncode(innerWord);
      hint = `Old phone keypad, multi-tap (2=ABC, 22=B, 7777=S …, 0 = "_", 00 = digit 0). Pressed: ${cipherText}\nAnswer format: ISW{typed_text}`;
      break;
    case "book_acrostic": {
      innerWord = pickWord(floor, (w) => canBookEncode(w, BOOKS.about, true));
      cipherText = bookEncode(innerWord, BOOKS.about, true);
      hint = `Book cipher, the book is ${BOOKS.about.page}. Each number N = first letter of word N.\n${BOOK_RULES}\nCipher: ${cipherText}\nAnswer format: ISW{text}`;
      break;
    }
    case "book_about":
    case "book_events":
    case "book_members": {
      const book = BOOKS[type.slice(5) as "about" | "events" | "members"];
      const format = book.sections.length > 1 ? "section.word.letter" : "word.letter";
      innerWord = pickWord(floor, (w) => canBookEncode(w, book));
      cipherText = bookEncode(innerWord, book);
      hint = `Book cipher, the book is ${book.page}. Each token is ${format}.\n${BOOK_RULES}\nCipher: ${cipherText}\nAnswer format: ISW{text}`;
      break;
    }
  }
  const flagAnswer = `ISW{${innerWord}}`;

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

/* `seed` shuffles enemies/items/traps/terminals (see placement.ts); without it the hand-made layout is used */
export function parseFloor(floor: number, seed?: number) {
  const map = seed === undefined ? FLOOR_MAPS[floor] : shuffleFloor(FLOOR_MAPS[floor], floorRng(seed, floor));
  const merchants: Merchant[] = [];
  const uplinks: { x: number; y: number; floor: number }[] = [];
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
        case "U":
          uplinks.push({ x, y, floor });
          cleaned += ".";
          break;
        case "$":
          merchants.push({ id: `m${floor}`, floor, x, y, visits: 0, purchases: 0, haggle: "none" });
          cleaned += ".";
          break;
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

  return { cleanMap, enemies, npcs, groundItems, doors, puzzles, traps, merchants, uplinks, playerStart };
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

/* ----- Leech Bot: steals credits instead of HP, then tries to run ----- */
export function makeLeech(floor: number, x: number, y: number, id: string): Enemy {
  return {
    id, name: "Leech Bot", symbol: "E",
    stats: { maxHp: 24 + floor * 14, hp: 24 + floor * 14, maxMp: 0, mp: 0, atk: 6 + floor * 2, def: 2 + floor, spd: 14, int: 4 },
    xpReward: 15 + floor * 10, alive: true, x, y, floor, ac: 11 + floor,
    statusEffects: [], behavior: "leech", stolen: 0,
  };
}

/* ----- Random spawn helper ----- */
export function createRandomEnemy(floor: number, x: number, y: number, idSuffix: string): Enemy {
  if (Math.random() < 0.15) return makeLeech(floor, x, y, `spawn-${floor}-${idSuffix}`);
  const templates = ENEMY_TEMPLATES[floor] || ENEMY_TEMPLATES[0];
  const tmpl = templates[Math.floor(Math.random() * templates.length)];
  return {
    id: `spawn-${floor}-${idSuffix}`, name: tmpl.name, symbol: "E",
    stats: { ...tmpl.stats }, xpReward: tmpl.xp, alive: true,
    x, y, floor, loot: tmpl.loot, ac: tmpl.ac,
    statusEffects: [], onHitEffect: tmpl.onHitEffect,
  };
}

