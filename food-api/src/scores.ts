import { createHash } from "node:crypto";
import { Hono } from "hono";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "./db.ts";

// ---- Mainframe Breach leaderboard (/mainframe_breach) ----

// sha256 of the uppercased hidden site flags -> flag id. Keep in sync with src/game/flags.ts.
const FLAG_HASHES = new Map([
  ["8261aadbd667c485bcd8f7ac77fda73ed0397bf109c9cba1887a4190d6169156", "source"],
  ["d0670190ae61fa8ed283425980f7f059aeebf8312e82fe882c0121db5a146b22", "console"],
  ["00237443d3f0c90a1d546193e87b9f52ab9ac2a5f2a9350704f02aab4319360c", "robots"],
  ["f03090678010dca4f816015ce421c053adfef8ec0b8c68ef3d2e0358dc4055b9", "header"],
  ["97ad7c77062e795f768e3ff6471eba07b1f813866046b8784e8847f4e3532f50", "zerowidth"],
  ["b0300ef068febf6c2961a6f6e915e731bd1b4a8644da99fed1541bc87808e9f2", "lost"],
]);
// Badge id -> flag it needs ("all" = every flag). Keep in sync with src/game/cosmetics.ts.
const BADGES = new Set(["source", "console", "robots", "header", "zerowidth", "lost", "all"]);
const FLAG_POINTS = 2500;
const SCORE_VERSION = 1; // bump together with SCORE_VERSION in src/game/score.ts when scoring changes
const MAX_GAME_SCORE = 80000; // comfortably above a perfect run
const CLASSES = new Set(["Netrunner", "Cyborg", "Ghost", "Sysadmin", "Script Kiddie"]); // talk-mode runs aren't ranked yet
const SUBMIT_COOLDOWN_MS = 20_000;

const lastSubmit = new Map<string, number>();

export const scores = new Hono();

scores.get("/", async (c) => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT name, score, game_score AS gameScore, flags_found AS flagsFound, badge, floor,
            class_name AS className, won, created_at AS createdAt
     FROM game_scores WHERE version = ? ORDER BY score DESC, created_at ASC LIMIT 20`,
    [SCORE_VERSION],
  );
  c.header("Cache-Control", "public, max-age=10");
  return c.json(rows.map((r) => ({ ...r, won: Boolean(r.won) })));
});

scores.post("/", async (c) => {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();
  if (now - (lastSubmit.get(ip) ?? 0) < SUBMIT_COOLDOWN_MS) {
    return c.json({ error: "Slow down, runner. Try again in a few seconds." }, 429);
  }

  const body = await c.req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const { className, floor, won, gameScore, flags, version, badge } = body ?? {};

  if (version !== SCORE_VERSION) return c.json({ error: "The game was updated. Refresh the page to submit." }, 409);
  if (!/^[\w .-]{1,16}$/.test(name)) return c.json({ error: "Name: 1-16 letters, digits, spaces, . _ -" }, 400);
  if (!CLASSES.has(className)) return c.json({ error: "Unknown class" }, 400);
  if (!Number.isInteger(floor) || floor < 1 || floor > 6) return c.json({ error: "Invalid floor" }, 400);
  if (typeof won !== "boolean" || (won && floor !== 6)) return c.json({ error: "Invalid result" }, 400);
  if (!Number.isInteger(gameScore) || gameScore < 0 || gameScore > MAX_GAME_SCORE) return c.json({ error: "Invalid score" }, 400);
  if (!Array.isArray(flags) || flags.length > 20) return c.json({ error: "Invalid flags" }, 400);

  const found = new Set(
    flags
      .filter((f): f is string => typeof f === "string" && f.length <= 100)
      .map((f) => createHash("sha256").update(f.trim().toUpperCase()).digest("hex"))
      .filter((h) => FLAG_HASHES.has(h))
      .map((h) => FLAG_HASHES.get(h)!),
  );
  // A badge only counts if the flags behind it were submitted with this score
  const earned = badge === "all" ? found.size === FLAG_HASHES.size : found.has(badge);
  if (badge != null && (!BADGES.has(badge) || !earned)) return c.json({ error: "You haven't earned that badge." }, 400);
  const score = gameScore + found.size * FLAG_POINTS;

  lastSubmit.set(ip, now);
  await db.query<ResultSetHeader>(
    `INSERT INTO game_scores (version, name, class_name, floor, won, game_score, flags_found, badge, score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [SCORE_VERSION, name, className, floor, won, gameScore, found.size, badge ?? null, score],
  );
  const [[{ position }]] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) + 1 AS position FROM game_scores WHERE version = ? AND score > ?",
    [SCORE_VERSION, score],
  );
  return c.json({ score, flagsFound: found.size, rank: Number(position) }, 201);
});
