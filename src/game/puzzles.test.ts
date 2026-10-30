/* Every puzzle must be solvable from its hint alone (plus the website text
   for book ciphers). Each solver below plays the player: it only reads the hint. */
import { describe, it, expect } from "vitest";
import { createPuzzle } from "./data";
import { BOOKS, bookDecode } from "./book";
import { sha1Hex } from "./sha1";
import { LOST_CIPHER, HIDDEN_FLAGS, ZERO_WIDTH_PAYLOAD, sha256Hex } from "./flags";
import type { PuzzleType } from "./types";

const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const after = (hint: string, label: string) => hint.split(label)[1].split("\n")[0].trim();
const num = (hint: string, re: RegExp) => Number(hint.match(re)![1]);
const str = (hint: string, re: RegExp) => hint.match(re)![1];
const mod = (n: number, m: number) => ((n % m) + m) % m;

function unCaesar(text: string, shift: number): string {
  return [...text].map((ch) => {
    if (/[A-Z]/.test(ch)) return A[mod(ch.charCodeAt(0) - 65 - shift, 26)];
    if (/[a-z]/.test(ch)) return A[mod(ch.charCodeAt(0) - 97 - shift, 26)].toLowerCase();
    if (/[0-9]/.test(ch)) return String(mod(Number(ch) - shift, 10));
    return ch;
  }).join("");
}
const atbash = (t: string) => [...t].map((c) => (/[A-Z]/.test(c) ? A[25 - A.indexOf(c)] : c)).join("");
const rot47 = (t: string) => [...t].map((c) => { const n = c.charCodeAt(0); return n >= 33 && n <= 126 ? String.fromCharCode(33 + mod(n - 33 + 47, 94)) : c; }).join("");
const reverse = (t: string) => [...t].reverse().join("");

function unVigenere(text: string, key: string): string {
  let k = 0;
  return [...text].map((c) => (/[A-Z]/.test(c) ? A[mod(A.indexOf(c) - A.indexOf(key[k++ % key.length]), 26)] : c)).join("");
}
function unColumnar(text: string, key: string): string {
  const cols = key.length, rows = Math.ceil(text.length / cols);
  const order = [...key].map((c, i) => ({ c, i })).sort((a, b) => a.c.localeCompare(b.c) || a.i - b.i).map((x) => x.i);
  const grid: string[] = new Array(text.length);
  let p = 0;
  for (const col of order) for (let r = 0; r < rows; r++) if (r * cols + col < text.length) grid[r * cols + col] = text[p++];
  return grid.join("");
}
function keyGrid(key: string): string {
  return [...new Set([...(key + "ABCDEFGHIKLMNOPQRSTUVWXYZ").replace(/J/g, "I")])].join("");
}
function unPlayfair(word: string, key: string): string {
  const g = keyGrid(key);
  let out = "";
  for (let i = 0; i < word.length; i += 2) {
    const a = g.indexOf(word[i]), b = g.indexOf(word[i + 1]);
    const [ar, ac, br, bc] = [Math.floor(a / 5), a % 5, Math.floor(b / 5), b % 5];
    if (ar === br) out += g[ar * 5 + mod(ac - 1, 5)] + g[br * 5 + mod(bc - 1, 5)];
    else if (ac === bc) out += g[mod(ar - 1, 5) * 5 + ac] + g[mod(br - 1, 5) * 5 + bc];
    else out += g[ar * 5 + bc] + g[br * 5 + ac];
  }
  // drop filler: X between two equal letters, and a trailing X
  return out.replace(/(.)X(?=\1)/g, "$1").replace(/X$/, "");
}
function unBifid(word: string, key: string): string {
  const g = keyGrid(key);
  const coords = [...word].flatMap((c) => { const i = g.indexOf(c); return [Math.floor(i / 5), i % 5]; });
  const half = word.length;
  return [...word].map((_, i) => g[coords[i] * 5 + coords[half + i]]).join("");
}
function unAdfgvx(word: string, key: string): string {
  const frac = unColumnar(word, key), L = "ADFGVX", alpha = A + "0123456789";
  let out = "";
  for (let i = 0; i < frac.length; i += 2) out += alpha[L.indexOf(frac[i]) * 6 + L.indexOf(frac[i + 1])];
  return out;
}
function railDecode(text: string, rails: number): string {
  const pattern = [...text].map((_, i) => { const c = 2 * (rails - 1); const m = i % c; return m < rails ? m : c - m; });
  const out: string[] = new Array(text.length);
  let p = 0;
  for (let r = 0; r < rails; r++) pattern.forEach((pr, i) => { if (pr === r) out[i] = text[p++]; });
  return out.join("");
}

const MORSE: Record<string, string> = {
  ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F", "--.": "G", "....": "H", "..": "I", ".---": "J", "-.-": "K", ".-..": "L", "--": "M",
  "-.": "N", "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T", "..-": "U", "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y", "--..": "Z",
  "-----": "0", ".----": "1", "..---": "2", "...--": "3", "....-": "4", ".....": "5", "-....": "6", "--...": "7", "---..": "8", "----.": "9", "..--.-": "_",
};
const KEYPAD = ["0", "1", "ABC2", "DEF3", "GHI4", "JKL5", "MNO6", "PQRS7", "TUV8", "WXYZ9"];
/* stand-in for rockyou.txt / crackstation */
const WORDLIST = ["123456", "password", "dragon", "shadow", "monkey", "hunter", "master", "letmein", "freedom", "whatever", "trustno1", "qwerty",
  "starwars", "iloveyou", "princess", "sunshine", "football", "computer", "superman", "matrix", "pokemon", "batman", "admin"];

function solve(type: PuzzleType, hint: string): string {
  const enc = (l = "Encrypted:") => after(hint, l);
  switch (type) {
    case "caesar": return unCaesar(enc(), num(hint, /shift (\d+)/));
    case "reverse": return reverse(after(hint, "Reversed text:"));
    case "substitution": return [...enc()].map((c, i) => (/[A-Z]/.test(c) ? A[mod(A.indexOf(c) - i - 3, 26)] : c)).join("");
    case "vigenere": return unVigenere(enc(), str(hint, /key="(\w+)"/));
    case "atbash": return atbash(enc());
    case "railfence": return railDecode(enc(), num(hint, /(\d+) rails/));
    case "base64": return atob(after(hint, "Base64 encoded:"));
    case "hex": return after(hint, "ASCII:").split(" ").map((h) => String.fromCharCode(parseInt(h, 16))).join("");
    case "binary": return after(hint, "ASCII:").split(" ").map((b) => String.fromCharCode(parseInt(b, 2))).join("");
    case "octal": return after(hint, "ASCII:").split(" ").map((o) => String.fromCharCode(parseInt(o, 8))).join("");
    case "double": return unCaesar(reverse(enc()), num(hint, /shift (\d+)/));
    case "rot47": return rot47(enc());
    case "xor": { const k = num(hint, /\((\d+)\)/); return after(hint, "Hex output:").split(" ").map((h) => String.fromCharCode(parseInt(h, 16) ^ k)).join(""); }
    case "morse": return after(hint, "Morse code:").split(" / ").map((m) => MORSE[m]).join("");
    case "triple": return atob(reverse(unCaesar(enc(), num(hint, /shift (\d+)/))));
    case "beaufort": { const key = str(hint, /key="(\w+)"/); let k = 0; return [...enc()].map((c) => (/[A-Z]/.test(c) ? A[mod(A.indexOf(key[k++ % key.length]) - A.indexOf(c), 26)] : c)).join(""); }
    case "affine": {
      const a = num(hint, /\((\d+)x/), b = num(hint, /x \+ (\d+)\)/);
      const inv = [...Array(26).keys()].find((i) => (a * i) % 26 === 1)!;
      return [...enc()].map((c) => (/[A-Z]/.test(c) ? A[mod(inv * (A.indexOf(c) - b), 26)] : c)).join("");
    }
    case "columnar": return unColumnar(enc(), str(hint, /key="(\w+)"/));
    case "playfair": return enc().split("_").map((w) => unPlayfair(w, str(hint, /key="(\w+)"/))).join("_");
    case "polybius": {
      const L = "ADFGX", g = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
      return after(hint, "Encoded:").split(" ").map((t) => (t.length === 2 && /^[ADFGX]{2}$/.test(t) ? g[L.indexOf(t[0]) * 5 + L.indexOf(t[1])] : t)).join("");
    }
    case "autokey": {
      const key = [...str(hint, /seed="(\w+)"/)];
      let k = 0;
      return [...enc()].map((c) => { if (!/[A-Z]/.test(c)) return c; const p = A[mod(A.indexOf(c) - A.indexOf(key[k++]), 26)]; key.push(p); return p; }).join("");
    }
    case "bacon": return after(hint, "Encoded:").split(" ").map((t) => (/^[ab]{5}$/.test(t) ? A[parseInt(t.replace(/a/g, "0").replace(/b/g, "1"), 2)] : t)).join("");
    case "bifid": return enc().split("_").map((w) => unBifid(w, str(hint, /key="(\w+)"/))).join("_");
    case "adfgvx": return enc().split("_").map((w) => unAdfgvx(w, str(hint, /key="(\w+)"/))).join("_");
    case "quadruple": return unVigenere(atob(reverse(rot47(enc()))), str(hint, /key="(\w+)"/));
    case "nightmare": {
      const k = parseInt(str(hint, /key=0x([0-9A-F]+)/), 16);
      const hex = unCaesar(atbash(enc()), num(hint, /Caesar\(shift (\d+)/));
      const bytes = hex.match(/../g)!.reverse();
      return bytes.map((h) => String.fromCharCode(parseInt(h, 16) ^ k)).join("");
    }
    case "sha1": { const h = after(hint, "password hash (unsalted SHA-1 of a lowercase password):"); return WORDLIST.find((w) => sha1Hex(w) === h)!.toUpperCase(); }
    case "keypad": return after(hint, "Pressed:").split(" ").map((t) => (t === "0" ? "_" : t === "00" ? "0" : t === "1" ? "1" : KEYPAD[Number(t[0])][t.length - 1])).join("");
    case "book_acrostic": return bookDecode(after(hint, "Cipher:"), BOOKS.about, true);
    case "book_about": return bookDecode(after(hint, "Cipher:"), BOOKS.about);
    case "book_events": return bookDecode(after(hint, "Cipher:"), BOOKS.events);
    case "book_members": return bookDecode(after(hint, "Cipher:"), BOOKS.members);
  }
}

const ALL_TYPES: PuzzleType[] = [
  "caesar", "reverse", "substitution", "vigenere", "atbash", "railfence", "base64", "hex", "binary", "double", "rot47", "xor",
  "morse", "octal", "triple", "beaufort", "affine", "columnar", "playfair", "polybius", "autokey", "bacon", "bifid", "adfgvx",
  "quadruple", "nightmare", "sha1", "keypad", "book_acrostic", "book_about", "book_events", "book_members",
];

describe("terminal puzzles", () => {
  for (const type of ALL_TYPES) {
    it(`${type} is solvable on every floor`, () => {
      for (let floor = 0; floor < 6; floor++) {
        for (let i = 0; i < 40; i++) {
          const pz = createPuzzle(floor, 0, 0, "t", type);
          expect(`ISW{${solve(type, pz.hint)}}`.toUpperCase(), pz.hint).toBe(pz.plainText.toUpperCase());
        }
      }
    });
  }

  it("sha1 matches known vectors", () => {
    expect(sha1Hex("")).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
    expect(sha1Hex("password")).toBe("5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8");
  });
});

describe("hidden flags", () => {
  it("404 book cipher decodes to a registered flag", async () => {
    const flag = bookDecode(LOST_CIPHER, BOOKS.about);
    expect(flag).toMatch(/^ISW\{.+\}$/);
    expect(HIDDEN_FLAGS.map((f) => f.hash)).toContain(await sha256Hex(flag));
  });

  it("zero-width payload decodes to a registered flag", async () => {
    const flag = ZERO_WIDTH_PAYLOAD.split("‍")
      .map((bits) => String.fromCharCode(parseInt(bits.replace(/​/g, "0").replace(/‌/g, "1"), 2)))
      .join("");
    expect(HIDDEN_FLAGS.map((f) => f.hash)).toContain(await sha256Hex(flag));
  });
});
