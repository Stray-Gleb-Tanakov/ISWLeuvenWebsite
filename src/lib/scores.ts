/* Client for the Mainframe Breach leaderboard (food-api: /api/scores) */

export interface LeaderboardEntry {
  name: string;
  score: number;
  gameScore: number;
  flagsFound: number;
  badge: string | null;
  floor: number;
  className: string;
  won: boolean;
  createdAt: string;
}

export interface ScoreSubmission {
  version: number;
  name: string;
  className: string;
  floor: number;
  won: boolean;
  gameScore: number;
  flags: string[];
  badge: string | null;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch("/api/scores");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function submitScore(entry: ScoreSubmission): Promise<{ score: number; flagsFound: number; rank: number }> {
  const res = await fetch("/api/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}
