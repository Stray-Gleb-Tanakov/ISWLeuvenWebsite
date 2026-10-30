/* ====================================================
   Quick-time events
   Every class has its own QTE on its special ability;
   Brace (everyone) triggers on some enemy attacks;
   Grab catches a fleeing Leech Bot.
   The reducer only creates QTEs and applies results —
   timing is measured by the UI (QtePanel).
   ==================================================== */

import type { ClassName, Qte, QteKind, QteResult } from "./types";

export const CLASS_QTE: Record<ClassName, QteKind | "random"> = {
  Netrunner: "hack",
  Cyborg: "gauge",
  Ghost: "combo",
  Sysadmin: "shell",
  "Script Kiddie": "random", // copies another class's QTE every time
  "Social Engineer": "hack",
};

export const COPYABLE_QTES: QteKind[] = ["hack", "gauge", "combo", "shell"];

/* Perk-driven tweaks */
export interface QteMods {
  windowMult?: number;  // Steady Hands, Paranoia
  perfectFrac?: number; // Paranoia: brace perfect window
}

/* ----- Sysadmin: real Linux problems, fixed by typing the command ----- */
interface ShellProblem {
  error: string;
  answers: string[];
  seconds: number;
  hint: string;
}

export const SHELL_PROBLEMS: ShellProblem[] = [
  { error: "bash: ./deploy.sh: Permission denied", answers: ["chmod +x deploy.sh", "chmod +x ./deploy.sh", "chmod u+x deploy.sh", "chmod 755 deploy.sh", "chmod 744 deploy.sh"], seconds: 5, hint: "change the file mode" },
  { error: "E: Unable to locate package nginx", answers: ["apt update", "apt-get update"], seconds: 5, hint: "refresh the package lists" },
  { error: "fatal: not a git repository (or any of the parent directories): .git", answers: ["git init"], seconds: 5, hint: "make it a repository" },
  { error: "Command 'nginx' not found", answers: ["apt install nginx", "apt-get install nginx", "apt install -y nginx", "apt-get install -y nginx"], seconds: 7, hint: "install the package" },
  { error: "write error: No space left on device", answers: ["df -h", "df", "du -sh *", "du -sh", "du -h"], seconds: 7, hint: "check disk usage" },
  { error: "Job for nginx.service failed because the control process exited", answers: ["systemctl restart nginx", "systemctl start nginx", "service nginx restart", "service nginx start"], seconds: 12, hint: "restart the service" },
  { error: "listen tcp :80: bind: address already in use", answers: ["lsof -i :80", "ss -tlnp", "netstat -tlnp", "fuser 80/tcp", "ss -tulpn", "netstat -tulpn"], seconds: 12, hint: "find what's using the port" },
  { error: "Permission denied (publickey).", answers: ["ssh-keygen", "ssh-keygen -t ed25519", "ssh-keygen -t rsa", "ssh-add"], seconds: 12, hint: "you need a key" },
];

/* "sudo" is optional and extra spaces don't matter */
export function normalizeCommand(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ").replace(/^sudo /, "");
}

/* The rm -rf easter egg: "/" alone is refused by real rm, "/*" goes through */
export function rmEgg(text: string): "refused" | "nuke" | null {
  const cmd = normalizeCommand(text);
  if (/^rm (-rf|-fr|-r -f|-f -r) (--no-preserve-root \/|\/\*)$/.test(cmd) || cmd === "rm -rf --no-preserve-root /") return "nuke";
  if (/^rm (-rf|-fr|-r -f|-f -r) \/$/.test(cmd)) return "refused";
  return null;
}

/* Correct and fast = perfect, correct = good, wrong = miss */
export function shellResult(qte: Qte, text: string, elapsedMs: number): QteResult {
  const ok = (qte.answers ?? []).some((a) => normalizeCommand(a) === normalizeCommand(text));
  if (!ok || elapsedMs > qte.windowMs) return "miss";
  return elapsedMs <= qte.windowMs * 0.5 ? "perfect" : "good";
}

const HACK_CHARS = "0123456789ABCDEF";
const ARROWS = "UDLR";

/* Random time multiplier: a tight range on floor 1, wider (and a bit faster) deeper down.
   floor 0: 0.95–1.05 · floor 5: 0.45–1.25 */
export function windowFactor(floor: number, rng: () => number = Math.random): number {
  const spread = 0.05 + floor * 0.07;
  const center = 1 - floor * 0.03;
  return center + (rng() * 2 - 1) * spread;
}

function randomString(alphabet: string, length: number, rng: () => number): string {
  return Array.from({ length }, () => alphabet[Math.floor(rng() * alphabet.length)]).join("");
}

export function createQte(kind: QteKind, floor: number, rng: () => number = Math.random, mods: QteMods = {}): Qte {
  const f = windowFactor(floor, rng) * (mods.windowMult ?? 1);
  switch (kind) {
    case "hack": {
      const prompt = randomString(HACK_CHARS, 4 + Math.min(2, Math.floor(floor / 2)), rng);
      return { kind, context: "special", prompt, windowMs: Math.round(prompt.length * 900 * f) };
    }
    case "gauge": {
      const width = 0.26 - floor * 0.02;
      const start = 0.3 + rng() * (0.65 - width);
      const mid = start + width / 2;
      return {
        kind, context: "special", prompt: "", windowMs: Math.round(1500 * f),
        zone: { good: [start, start + width], perfect: [mid - 0.04, mid + 0.04] },
      };
    }
    case "combo": {
      const prompt = randomString(ARROWS, 7 + Math.floor(rng() * 2), rng); // 7–8 arrows
      return { kind, context: "special", prompt, memorizeMs: 2000 + prompt.length * 350, windowMs: Math.round(prompt.length * 650 * f) };
    }
    case "brace":
      return {
        kind, context: "brace", prompt: "", cueDelayMs: Math.round(400 + rng() * 1100), windowMs: Math.round(650 * f),
        perfectFrac: mods.perfectFrac,
      };
    case "grab":
      return { kind, context: "grab", prompt: "", presses: 8, windowMs: Math.round(2000 * f) };
    case "shell": {
      const problem = SHELL_PROBLEMS[Math.floor(rng() * SHELL_PROBLEMS.length)];
      // fixed timers per problem; Steady Hands still helps, floors don't
      return {
        kind, context: "special", prompt: problem.error, answers: problem.answers, hint: problem.hint,
        windowMs: Math.round(problem.seconds * 1000 * (mods.windowMult ?? 1)),
      };
    }
  }
}

/* Sequence QTEs (hack, combo): fraction of the prompt entered correctly */
export function sequenceResult(accuracy: number): QteResult {
  return accuracy >= 1 ? "perfect" : accuracy >= 0.5 ? "good" : "miss";
}

/* Gauge: where the needle was stopped (null = never pressed) */
export function gaugeResult(qte: Qte, position: number | null): QteResult {
  if (position === null || !qte.zone) return "miss";
  const { good, perfect } = qte.zone;
  if (position >= perfect[0] && position <= perfect[1]) return "perfect";
  if (position >= good[0] && position <= good[1]) return "good";
  return "miss";
}

/* Grab: presses made in the window */
export function grabResult(qte: Qte, presses: number): QteResult {
  const needed = qte.presses ?? 8;
  return presses >= needed ? "perfect" : presses >= needed * 0.75 ? "good" : "miss";
}

/* Brace: ms after the cue (negative = pressed too early, null = never pressed) */
export function braceResult(qte: Qte, reactionMs: number | null): QteResult {
  if (reactionMs === null || reactionMs < 0 || reactionMs > qte.windowMs) return "miss";
  return reactionMs <= qte.windowMs * (qte.perfectFrac ?? 0.45) ? "perfect" : "good";
}
