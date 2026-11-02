import { Hono } from "hono";
import type { ResultSetHeader } from "mysql2";
import { db } from "./db.ts";
import { sendMail } from "./mail.ts";

// ---- Membership sign-up (/member-signup) ----

const SUBMIT_COOLDOWN_MS = 60_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const lastSubmit = new Map<string, number>();

export interface MemberRecord {
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  email: string;
  discord: string | null;
  payment: false;
  submittedAt: string;
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v && v.length <= max ? v : null;
}

/** Returns the cleaned record, or an error message for the user. */
export function parseSignup(body: Record<string, unknown>): MemberRecord | string {
  const firstName = text(body.firstName, 64);
  const lastName = text(body.lastName, 64);
  const email = text(body.email, 254);
  if (!firstName || !lastName) return "First and last name are required";
  if (!email || !EMAIL_RE.test(email)) return "A valid email is required";

  let studentNumber: string | null = null;
  if (body.studentNumber) {
    studentNumber = text(body.studentNumber, 16)?.replace(/^r/i, "") ?? null;
    if (!studentNumber || !/^\d{5,10}$/.test(studentNumber)) return "Student number should be digits only, e.g. 1048153";
  }
  const discord = body.discord ? text(body.discord, 64) : null;
  if (body.discord && !discord) return "Discord username is too long";

  // payment is never taken from the client: the board sets it once the transfer is in
  return { firstName, lastName, studentNumber, email, discord, payment: false, submittedAt: new Date().toISOString() };
}

export const members = new Hono();

members.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "Invalid JSON" }, 400);

  // Honeypot: real people never see this field, bots fill everything in. Pretend it worked.
  if (body.website) return c.json({ ok: true }, 201);

  const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();
  if (now - (lastSubmit.get(ip) ?? 0) < SUBMIT_COOLDOWN_MS) {
    return c.json({ error: "Slow down, try again in a minute" }, 429);
  }

  const record = parseSignup(body);
  if (typeof record === "string") return c.json({ error: record }, 400);

  let stored = false;
  if (db) {
    await db.query<ResultSetHeader>(
      `INSERT INTO members (first_name, last_name, student_number, email, discord, payment)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [record.firstName, record.lastName, record.studentNumber, record.email, record.discord],
    );
    stored = true;
  }

  try {
    await sendMail({
      subject: `Membership sign-up: ${record.firstName} ${record.lastName}`,
      text: JSON.stringify(record, null, 2),
      replyTo: record.email,
      json: record,
    });
  } catch (err) {
    // Already in the DB: the board can still find it there, so don't make them resubmit
    if (!stored) throw err;
    console.error("members: saved to DB but email failed", err);
  }

  lastSubmit.set(ip, now);
  return c.json(record, 201);
});
