import { useState } from "react";
import type { GameState } from "@/game/types";
import { computeScore, SCORE_VERSION } from "@/game/score";
import { FLAG_POINTS } from "@/game/flags";
import { ENDING_TITLES } from "@/game/ending";
import { submitScore } from "@/lib/scores";
import { badgeTitle } from "@/game/cosmetics";

const NAME_KEY = "isw-ctf-name";

function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

interface ScoreSubmitProps {
  state: GameState;
  flags: string[];
  badge?: string | null;
  deathText?: string;
  onSubmitted: () => void;
}

/* One line that tells the story of the run */
function runSummary(state: GameState): string {
  const r = state.runStats;
  const parts = [
    state.mode === "WIN" ? (state.talk ? "Talked your way through floor 1" : state.endingId ? ENDING_TITLES[state.endingId] : "Escaped the mainframe") : `Killed by ${r.killedBy ?? "something"} on floor ${(state.player?.floor ?? 0) + 1}`,
    `${r.damageDealt} damage dealt`,
    `${r.damageTaken} taken`,
    r.bracesFaced > 0 ? `${r.perfectBraces}/${r.bracesFaced} perfect braces` : "",
    r.creditsStolen > 0 ? `${r.creditsStolen} credits stolen by leeches` : "",
    r.creditsSpent > 0 ? `${r.creditsSpent} credits spent` : "",
    `${state.player?.credits ?? 0} credits wasted`,
  ];
  return parts.filter(Boolean).join(" · ");
}

/* Shown after death or victory. Rendered outside the game's key handler so typing works. */
const ScoreSubmit = ({ state, flags, badge = null, deathText = "RUN TERMINATED", onSubmitted }: ScoreSubmitProps) => {
  const [name, setName] = useState(loadName);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [result, setResult] = useState<string | null>(null);
  const score = computeScore(state);

  if (!state.player) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      localStorage.setItem(NAME_KEY, name.trim());
    } catch {
      // not important
    }
    try {
      const res = await submitScore({
        version: SCORE_VERSION,
        name: name.trim(),
        className: state.player!.className,
        floor: score.floor,
        won: score.won,
        gameScore: score.total,
        flags,
        badge,
      });
      setResult(`>>> Uploaded: ${res.score.toLocaleString("en-US")} pts (${res.flagsFound} flags) — rank #${res.rank} <<<`);
      setStatus("done");
      onSubmitted();
    } catch (err) {
      setResult(`ERROR: ${(err as Error).message}`);
      setStatus("idle");
    }
  };

  return (
    <section className="border border-primary/60 bg-card p-4 font-mono text-xs mt-3">
      <h2 className="text-primary text-glow text-sm mb-2">
        {score.won ? "RUN COMPLETE — YOU ESCAPED" : deathText} · score {score.total.toLocaleString("en-US")}
      </h2>
      <p className="text-foreground/90 mb-2">{runSummary(state)}</p>
      <p className="text-muted-foreground mb-3">
        floor {score.floor}/6 · {score.kills} kills · {score.bosses} bosses · {score.puzzles} terminals hacked · {score.perfects} perfect QTEs{score.lockdowns > 0 && ` · ${score.lockdowns} lockdowns cracked`} · level {state.player.level}
        {flags.length > 0 && ` · +${(flags.length * FLAG_POINTS).toLocaleString("en-US")} for ${flags.length} hidden flags`}
      </p>
      {state.talk && (
        <p className="text-amber-300">Talk-mode runs aren't on the leaderboard yet: it's a pilot. Press R to play again.</p>
      )}
      {!state.talk && status !== "done" && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            required
            placeholder="handle"
            aria-label="Name for the leaderboard"
            className="flex-1 min-w-0 bg-background border border-border px-2 py-1.5 text-foreground focus:border-primary outline-none"
          />
          {badge && <span className="self-center text-amber-300 shrink-0">{badgeTitle(badge)}</span>}
          <button type="submit" disabled={status === "sending"} className="border border-border px-3 hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
            {status === "sending" ? "uploading..." : "submit score"}
          </button>
        </form>
      )}
      {result && <p className={`mt-2 ${status === "done" ? "text-primary" : "text-destructive"}`}>{result}</p>}
    </section>
  );
};

export default ScoreSubmit;
