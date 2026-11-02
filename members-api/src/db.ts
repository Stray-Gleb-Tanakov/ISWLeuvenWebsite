import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

// The members DB doesn't exist yet. Until DB_HOST is set, sign-ups are only emailed.
export const dbEnabled = Boolean(process.env.DB_HOST);

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") throw new Error(`Missing env var ${name}`);
  return value;
}

const config = dbEnabled
  ? {
      host: env("DB_HOST"),
      port: Number(env("DB_PORT", "3306")),
      user: env("DB_USER"),
      password: env("DB_PASSWORD"),
      database: env("DB_NAME"),
    }
  : null;

export const db = config ? mysql.createPool({ ...config, connectionLimit: 5, timezone: "Z" }) : null;

export async function migrate() {
  if (!config) return;
  const sql = await readFile(new URL("../sql/schema.sql", import.meta.url), "utf8");
  const conn = await mysql.createConnection({ ...config, multipleStatements: true });
  try {
    await conn.query(sql);
  } finally {
    await conn.end();
  }
}
