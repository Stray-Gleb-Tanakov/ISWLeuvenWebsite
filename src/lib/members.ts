/* Client for membership sign-up (members-api: /api/members). The API emails it to the board and, once the members DB exists, stores it. */

export const MEMBERS_EMAIL = "isw@ucll.be";

export interface MemberSignup {
  firstName: string;
  lastName: string;
  /** Digits only, without the leading 'r'. */
  studentNumber: string | null;
  email: string;
  discord: string | null;
  /** Honeypot, hidden from people. Anything in here and the API silently drops the sign-up. */
  website?: string;
}

/** What the API stored/sent. `payment` always starts false; the board flips it by hand once the transfer shows up. */
export interface MemberRecord extends Omit<MemberSignup, "website"> {
  payment: false;
  submittedAt: string;
}

export async function submitMemberSignup(signup: MemberSignup): Promise<MemberRecord> {
  const res = await fetch("/api/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(signup),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}
