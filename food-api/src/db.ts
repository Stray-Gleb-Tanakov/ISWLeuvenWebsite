import mysql from "mysql2/promise";

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") throw new Error(`Missing env var ${name}`);
  return value;
}

const config = {
  host: env("DB_HOST"),
  port: Number(env("DB_PORT", "3306")),
  user: env("DB_USER"),
  password: env("DB_PASSWORD"),
  database: env("DB_NAME"),
};

export const db = mysql.createPool({ ...config, connectionLimit: 10, timezone: "Z" });

export async function migrate() {
  const sql = await Bun.file(new URL("../sql/schema.sql", import.meta.url)).text();
  const conn = await mysql.createConnection({ ...config, multipleStatements: true });
  try {
    await conn.query(sql);
  } finally {
    await conn.end();
  }
}
