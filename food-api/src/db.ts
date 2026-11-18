import mysql from "mysql2/promise";

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") throw new Error(`Missing env var ${name}`);
  return value;
}

// The API never creates or alters tables; each database sets up its own on its first start.

// Food database: the /lokaal menu fallback when the inventory app is unavailable.
export const db = mysql.createPool({
  host: env("DB_HOST"),
  port: Number(env("DB_PORT", "3306")),
  user: env("DB_USER"),
  password: env("DB_PASSWORD"),
  database: env("DB_NAME"),
  connectionLimit: 10,
  timezone: "Z",
});

// isw-db (k8s/isw-db.yaml): the game leaderboard.
export const gameDb = mysql.createPool({
  host: env("GAME_DB_HOST"),
  port: Number(env("GAME_DB_PORT", "3306")),
  user: env("GAME_DB_USER"),
  password: env("GAME_DB_PASSWORD"),
  database: env("GAME_DB_NAME"),
  connectionLimit: 5,
  timezone: "Z",
});
