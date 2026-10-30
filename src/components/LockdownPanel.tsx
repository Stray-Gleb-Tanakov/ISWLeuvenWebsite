import { useEffect, useState } from "react";
import type { GameState } from "@/game/types";

interface LockdownPanelProps {
  state: GameState;
  dispatch: React.Dispatch<any>;
}

/* Final boss lockdown: countdown that fires LOCKDOWN_TIMEOUT. Remount (key) per lockdown. */
const LockdownPanel = ({ state, dispatch }: LockdownPanelProps) => {
  const [left, setLeft] = useState(state.lockdownMs);

  useEffect(() => {
    const end = performance.now() + state.lockdownMs;
    const timer = setInterval(() => {
      const remaining = Math.max(0, end - performance.now());
      setLeft(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        dispatch({ type: "LOCKDOWN_TIMEOUT" });
      }
    }, 100);
    return () => clearInterval(timer);
  }, [state.lockdownMs, dispatch]);

  const urgent = left < 10000;
  return (
    <div className="border-2 border-destructive bg-card p-3 font-mono">
      <div className="flex justify-between items-center mb-2">
        <span className="text-destructive font-bold text-sm">⚠ LOCKDOWN — {state.currentEnemy?.name}</span>
        <span className={`text-lg font-bold ${urgent ? "text-destructive animate-pulse" : "text-amber-300"}`}>{(left / 1000).toFixed(1)}s</span>
      </div>
      <div className="h-2 bg-border mb-2 overflow-hidden">
        <div className="h-full bg-destructive" style={{ width: `${(left / state.lockdownMs) * 100}%` }} />
      </div>
      <p className="text-xs text-foreground/90 whitespace-pre-wrap break-words">{state.currentPuzzle?.hint}</p>
    </div>
  );
};

export default LockdownPanel;
