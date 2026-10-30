/* ====================================================
   Merchants — one per floor ($ on the map).
   Credits drop from enemies and terminals, are spent
   here, and die with you.
   ==================================================== */

import type { Haggle, Item, Merchant, Player } from "./types";
import { hasPerk } from "./perks";

export interface ShopEntry {
  name: string;
  description: string;
  basePrice: number;
  item?: Omit<Item, "id">;              // goes into the inventory
  stat?: { key: "atk" | "def"; value: number }; // permanent upgrade
}

export const SHOP_STOCK: ShopEntry[] = [
  { name: "NanoMed Kit", description: "Restores 20 HP", basePrice: 35, item: { name: "NanoMed Kit", description: "Restores 20 HP", type: "heal", value: 20 } },
  { name: "NanoMed Kit+", description: "Restores 35 HP", basePrice: 60, item: { name: "NanoMed Kit+", description: "Restores 35 HP", type: "heal", value: 35 } },
  { name: "Mana Cell", description: "Restores 30 MP", basePrice: 45, item: { name: "Mana Cell", description: "Restores 30 MP", type: "mana", value: 30 } },
  { name: "Antidote Patch", description: "Clears all status effects", basePrice: 40, item: { name: "Antidote Patch", description: "Clears all status effects", type: "antidote", value: 0 } },
  { name: "Blade Mod", description: "+2 ATK, permanent", basePrice: 140, stat: { key: "atk", value: 2 } },
  { name: "Plating Mod", description: "+2 DEF, permanent", basePrice: 120, stat: { key: "def", value: 2 } },
];

export const HAGGLE_DISCOUNT = 0.2;

export function shopPrice(entry: ShopEntry, floor: number, merchant: Merchant, player?: Player | null): number {
  const scaled = entry.basePrice * (1 + floor * 0.3);
  const haggled = merchant.haggle === "won" ? 1 - HAGGLE_DISCOUNT : 1;
  const contact = hasPerk(player, "black_market") ? 0.7 : 1;
  return Math.round(scaled * haggled * contact);
}

/* Credits dropped by a defeated enemy */
export function creditDrop(isBoss: boolean, isFinalBoss: boolean, rng: () => number = Math.random): number {
  if (isFinalBoss) return 0; // the run is over anyway
  if (isBoss) return 120 + Math.floor(rng() * 81);
  return 20 + Math.floor(rng() * 41); // 20–60
}

/* Credits for a hacked terminal: worth more than a fight */
export function terminalCredits(floor: number, rng: () => number = Math.random): number {
  return 50 + floor * 15 + Math.floor(rng() * 31);
}

/* ----- Haggling: a tiny Caesar cipher for 20% off ----- */

const HAGGLE_WORDS = ["CREDIT", "DEAL", "SALE", "PRICE", "TRADE", "CHEAP", "BARTER", "MARKUP", "REFUND", "BRIBE"];

export function createHaggle(rng: () => number = Math.random): Haggle {
  const answer = HAGGLE_WORDS[Math.floor(rng() * HAGGLE_WORDS.length)];
  const shift = 1 + Math.floor(rng() * 3);
  const cipherText = [...answer].map((c) => String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65)).join("");
  return { answer, shift, cipherText };
}

/* ----- Personalities: one shopkeeper per floor ----- */

interface Personality {
  name: string;
  greetings: string[];
}

export const SHOPKEEPERS: Personality[] = [
  {
    name: "VEX // greedy",
    greetings: [
      "Welcome, welcome! Everything's for sale. Including my silence.",
      "Fresh meat with fresh credits? My favourite kind of customer.",
      "First rule of the server room: Vex always gets paid.",
    ],
  },
  {
    name: "PATCH // paranoid",
    greetings: [
      "Close the door. Did anyone follow you? Don't answer that, they're listening.",
      "I sell gear. I don't sell information. I definitely don't sell YOU to ISW-Chan.",
      "Every item is clean. Mostly. Probably. Don't scan it.",
    ],
  },
  {
    name: "MIRA-9 // ISW-Chan superfan",
    greetings: [
      "Isn't she BEAUTIFUL? ISW-Chan, I mean. Anyway, want a medkit?",
      "I bought a limited-edition ISW-Chan body pillow with your predecessor's credits.",
      "If you hurt her I'll raise my prices. If you DON'T hurt her I'll also raise my prices.",
    ],
  },
  {
    name: "OLD KERNEL // tired sysadmin",
    greetings: [
      "Have you tried turning yourself off and on again? No? Then buy something.",
      "Forty years of uptime. Not one day off. What do you need.",
      "I remember when this mainframe ran on a single Raspberry Pi. Good times. What'll it be?",
    ],
  },
  {
    name: "GL1TCH // corrupted",
    greetings: [
      "W3lc0me t0 the sh0p. The sh0p. The sh̷o̷p̷.",
      "Pr1ces are ACCURATE // error: prices are accurate // prices are accurate.",
      "I was a vending machine once. Now I'm a vending machine with opinions.",
    ],
  },
  {
    name: "THE LAST VENDOR // nihilist",
    greetings: [
      "NEXUS is right behind that wall. Credits won't matter in a minute. Spend them.",
      "Last shop before the end of everything. No pressure.",
      "Buy something. Or don't. The heat death of the universe is coming either way.",
    ],
  },
];

const LINES = {
  returning: [
    "Back already? You must like me. Or my prices.",
    "Ah, my favourite repeat customer. Don't make it weird.",
    "You again. Still alive. Statistically impressive.",
    "Welcome back. I raised nothing. Probably.",
  ],
  lowHp: [
    "You're leaking. NanoMed's on the shelf, or you can bleed for free.",
    "You look like a corrupted save file. Want a medkit?",
    "Please don't die in my shop. The paperwork is horrible.",
    "I can hear your HP bar beeping from here.",
  ],
  broke: [
    "That's not money, that's a rounding error.",
    "Your wallet just returned a 404.",
    "Come back when your balance has more than two digits.",
    "Credits. Not compliments. Credits.",
  ],
  bought: [
    "No refunds. No receipts. No witnesses.",
    "Pleasure doing business. Mostly my pleasure.",
    "Good choice. Well, a choice.",
    "Sold! I'll miss it. I won't miss it.",
    "That one's warm. Don't ask why it's warm.",
  ],
  flags: [
    "Heard you've been poking around the website. ISW-Chan noticed too.",
    "Someone's been reading page sources. Nerd. Respect.",
    "You've got flag dust on your boots. Been sniffing headers?",
  ],
  annoyed: [
    "You've touched every item twice. That's a rental fee now.",
    "Window shopping is free. Standing in my window isn't.",
    "Buy something or get back to dying. Your choice, runner.",
    "I've seen ICE with more purchasing power than you.",
    "You're not a customer. You're a loading screen.",
    "Every second you stand here, NEXUS gets smarter. Probably.",
    "I don't do layaway. I don't do layaway for ghosts especially.",
    "Ask me one more question and the answer is a price increase.",
    "My prices are fixed. Unlike your life expectancy.",
    "You smell like a failed Playfair cipher.",
    "Credits. Not compliments. Credits.",
    "Haggling is a privilege. You lost it three visits ago.",
    "This isn't the basement of the B-block. There's no free coffee here.",
    "Even the Examenwiki restore will be done before you make up your mind.",
    "I'd give you a discount, but I'd have to like you first.",
    "Go solve a terminal. Come back when you're worth talking to.",
    "If you're not buying, at least die somewhere I can loot you.",
    "The last runner who browsed this long is now a Corrupt Process.",
    "Wallet empty, inventory empty, head empty. Impressive consistency.",
    "Shop's closed. For you. Specifically.",
  ],
  haggleStart: [
    "Haggle? Fine. Crack this and I'll knock off 20%. Fail and the price is the price.",
    "You want a discount? Prove you're worth one.",
  ],
  haggleWon: [
    "...Fine. 20% off. Tell anyone and I'll deny it.",
    "Ugh. You're smarter than you look. Which isn't hard.",
    "Discount granted. My accountant is crying.",
  ],
  haggleLost: [
    "Wrong. Full price, forever. Well, for this floor.",
    "Haha, no. Haggling privileges revoked.",
    "That's not even close. Prices are final now.",
  ],
  haggleLocked: [
    "We've been over this. No more haggling.",
    "You had your shot. You missed. Like a nat 1.",
  ],
  tooPoor: [
    "You can't afford that. I checked. Twice.",
    "Nice try. Your balance says no.",
  ],
};

export type LineKind = keyof typeof LINES;

export function line(kind: LineKind, rng: () => number = Math.random): string {
  const pool = LINES[kind];
  return pool[Math.floor(rng() * pool.length)];
}

/* What the shopkeeper says when you walk in */
export function greetingLine(merchant: Merchant, player: Player, flagsFound: number, rng: () => number = Math.random): string {
  const cheapest = Math.min(...SHOP_STOCK.map((e) => shopPrice(e, merchant.floor, merchant, player)));
  if (merchant.visits >= 3 && merchant.purchases === 0) return line("annoyed", rng);
  if (merchant.visits === 0) {
    const greetings = SHOPKEEPERS[merchant.floor % SHOPKEEPERS.length].greetings;
    return greetings[Math.floor(rng() * greetings.length)];
  }
  if (player.stats.hp < player.stats.maxHp * 0.3) return line("lowHp", rng);
  if (player.credits < cheapest) return line("broke", rng);
  if (flagsFound > 0 && rng() < 0.3) return line("flags", rng);
  return line("returning", rng);
}
