/* ====================================================
   Quick-time event UI: measures timing and reports one
   result to the reducer. Keyboard (window listener) and
   touch buttons both work.
   ==================================================== */

import { useEffect, useRef, useState } from "react";
import type { Qte, QteResult } from "@/game/types";
import { braceResult, gaugeResult, grabResult, sequenceResult, shellResult } from "@/game/qte";

const ARROW_ICON: Record<string, string> = { U: "▲", D: "▼", L: "◄", R: "►" };
const KEY_TO_ARROW: Record<string, string> = { arrowup: "U", w: "U", arrowdown: "D", s: "D", arrowleft: "L", a: "L", arrowright: "R", d: "R" };
const HEX = "0123456789ABCDEF";
const FEEDBACK_MS = 450;

interface QtePanelProps {
  qte: Qte;
  onResolve: (result: QteResult, accuracy: number, text?: string) => void;
}

const QtePanel = ({ qte, onResolve }: QtePanelProps) => {
  const [now, setNow] = useState(() => performance.now());
  const [typed, setTyped] = useState(0);         // hack/combo progress, grab presses
  const [command, setCommand] = useState("");    // shell
  const [feedback, setFeedback] = useState<string | null>(null);
  const startRef = useRef(performance.now());
  const doneRef = useRef(false);
  const typedRef = useRef(0); // mirrors `typed` for the listeners, which are bound once per QTE
  typedRef.current = typed;
  // Grade what the player actually saw: on a slow device the last drawn frame lags real time
  const drawnProgressRef = useRef(0);
  const cueDrawnAtRef = useRef<number | null>(null);

  // hack: timer runs immediately · combo: after memorising · brace: after the cue · gauge: needle sweeps the window
  const memorize = qte.memorizeMs ?? 0;
  const cue = qte.cueDelayMs ?? 0;
  const delay = qte.kind === "combo" ? memorize : qte.kind === "brace" ? cue : 0;
  const elapsed = now - startRef.current;
  const active = elapsed - delay; // ms since the response window opened
  const progress = Math.min(1, Math.max(0, active / qte.windowMs));
  drawnProgressRef.current = progress;
  if (active >= 0 && cueDrawnAtRef.current === null) cueDrawnAtRef.current = now;

  const finish = (result: QteResult, accuracy: number, text?: string, typedCommand?: string) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setFeedback(text ?? (result === "perfect" ? "★ PERFECT ★" : result === "good" ? "GOOD" : "MISS"));
    setTimeout(() => onResolve(result, accuracy, typedCommand), FEEDBACK_MS);
  };

  // Animation clock + timeout
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const t = performance.now();
      const opened = t - startRef.current - delay;
      setNow(t);
      const sinceCue = cueDrawnAtRef.current === null ? -1 : t - cueDrawnAtRef.current;
      const timedOut = qte.kind === "brace" ? sinceCue > qte.windowMs : opened > qte.windowMs;
      if (!doneRef.current && timedOut) {
        const acc = qte.prompt ? typedRef.current / qte.prompt.length : 0;
        if (qte.kind === "grab") finish(grabResult(qte, typedRef.current), typedRef.current / (qte.presses ?? 8), grabResult(qte, typedRef.current) === "miss" ? "IT GOT AWAY" : undefined);
        else if (qte.kind === "shell") finish("miss", 0, "TIMEOUT");
        else finish(qte.kind === "hack" || qte.kind === "combo" ? sequenceResult(acc) : "miss", acc, qte.kind === "brace" ? "TOO SLOW" : undefined);
      }
      if (!doneRef.current) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const input = (value: string) => {
    if (doneRef.current) return;
    const t = performance.now() - startRef.current - delay;
    switch (qte.kind) {
      case "hack": {
        if (value !== qte.prompt[typedRef.current]) return; // wrong key: no progress
        const next = typedRef.current + 1;
        typedRef.current = next;
        setTyped(next);
        if (next === qte.prompt.length) finish("perfect", 1);
        return;
      }
      case "combo": {
        if (t < 0) return; // still memorising
        if (value !== qte.prompt[typedRef.current]) {
          const acc = typedRef.current / qte.prompt.length;
          finish(sequenceResult(acc), acc, "COMBO BROKEN");
          return;
        }
        const next = typedRef.current + 1;
        typedRef.current = next;
        setTyped(next);
        if (next === qte.prompt.length) finish("perfect", 1);
        return;
      }
      case "gauge": {
        const position = drawnProgressRef.current;
        finish(gaugeResult(qte, position), position);
        return;
      }
      case "brace": {
        if (cueDrawnAtRef.current === null) { finish("miss", 0, "TOO EARLY"); return; }
        finish(braceResult(qte, performance.now() - cueDrawnAtRef.current), 1);
        return;
      }
      case "grab": {
        const next = typedRef.current + 1;
        typedRef.current = next;
        setTyped(next);
        if (next >= (qte.presses ?? 8)) finish("perfect", 1, "GOT IT!");
        return;
      }
      case "shell": {
        const result = shellResult(qte, value, t);
        finish(result, result === "miss" ? 0 : 1, result === "miss" ? "command failed" : undefined, value);
        return;
      }
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (qte.kind === "hack" && /^[0-9a-f]$/.test(k)) input(k.toUpperCase());
      else if (qte.kind === "combo" && KEY_TO_ARROW[k]) input(KEY_TO_ARROW[k]);
      else if ((qte.kind === "gauge" || qte.kind === "brace" || qte.kind === "grab") && (k === " " || k === "enter") && !e.repeat) input("press");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tap = (value: string) => (e: React.PointerEvent) => { e.preventDefault(); input(value); };
  const bigBtn = "w-full h-16 border-2 border-primary bg-primary/10 active:bg-primary/40 text-primary text-glow font-bold text-lg select-none touch-manipulation";
  const smallBtn = "h-12 border border-border bg-card active:bg-primary/30 active:border-primary text-foreground font-bold select-none touch-manipulation";

  const title = { hack: "HACK THE ICE", gauge: "OVERCLOCK", combo: "SHADOW COMBO", brace: "INCOMING!", grab: "GRAB IT!", shell: "root@mainframe" }[qte.kind];

  return (
    <div className="border-2 border-amber-300/70 bg-card p-3 font-mono" role="group" aria-label={`Quick-time event: ${title}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-amber-300 font-bold text-sm">⚡ {title}</span>
        {feedback && <span className="text-primary text-glow font-bold text-sm">{feedback}</span>}
      </div>

      {/* Timer bar (the gauge draws its own) */}
      {qte.kind !== "gauge" && (
        <div className="h-2 bg-border mb-3 overflow-hidden">
          <div className="h-full bg-amber-300" style={{ width: `${active < 0 ? 100 : (1 - progress) * 100}%` }} />
        </div>
      )}

      {qte.kind === "hack" && (
        <>
          <div className="text-2xl tracking-[0.4em] text-center mb-3">
            {[...qte.prompt].map((c, i) => (
              <span key={i} className={i < typed ? "text-primary text-glow" : "text-muted-foreground"}>{c}</span>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mb-2 hidden md:block">Type the code: 0-9 A-F</p>
          <div className="grid grid-cols-8 gap-1 md:hidden">
            {[...HEX].map((c) => <button key={c} className={smallBtn} onPointerDown={tap(c)}>{c}</button>)}
          </div>
        </>
      )}

      {qte.kind === "gauge" && qte.zone && (
        <>
          <div className="relative h-10 bg-border/60 mb-3">
            <div className="absolute inset-y-0 bg-primary/30" style={{ left: `${qte.zone.good[0] * 100}%`, width: `${(qte.zone.good[1] - qte.zone.good[0]) * 100}%` }} />
            <div className="absolute inset-y-0 bg-primary" style={{ left: `${qte.zone.perfect[0] * 100}%`, width: `${(qte.zone.perfect[1] - qte.zone.perfect[0]) * 100}%` }} />
            <div className="absolute inset-y-0 w-1 bg-amber-300 shadow-[0_0_8px_theme(colors.amber.300)]" style={{ left: `calc(${progress * 100}% - 2px)` }} />
          </div>
          <p className="text-[10px] text-muted-foreground text-center mb-2 hidden md:block">[SPACE] to strike</p>
          <button className={bigBtn + " md:hidden"} onPointerDown={tap("press")}>STRIKE</button>
        </>
      )}

      {qte.kind === "combo" && (
        <>
          <div className="text-3xl text-center mb-3 tracking-widest min-h-[2.5rem]">
            {active < 0
              ? [...qte.prompt].map((a, i) => <span key={i} className="text-amber-300">{ARROW_ICON[a]}</span>)
              : [...qte.prompt].map((a, i) => <span key={i} className={i < typed ? "text-primary text-glow" : "text-muted-foreground"}>{i < typed ? ARROW_ICON[a] : "?"}</span>)}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mb-2">{active < 0 ? "Memorise..." : "Repeat it! (arrows / WASD)"}</p>
          <div className="grid grid-cols-3 gap-1 w-48 mx-auto md:hidden">
            <div /><button className={smallBtn} onPointerDown={tap("U")}>▲</button><div />
            <button className={smallBtn} onPointerDown={tap("L")}>◄</button>
            <button className={smallBtn} onPointerDown={tap("D")}>▼</button>
            <button className={smallBtn} onPointerDown={tap("R")}>►</button>
          </div>
        </>
      )}

      {qte.kind === "brace" && (
        <>
          <div className={`text-center text-2xl font-bold mb-3 ${active >= 0 ? "text-destructive animate-pulse" : "text-muted-foreground"}`}>
            {active >= 0 ? "!! BRACE !!" : "...wait for it..."}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mb-2 hidden md:block">[SPACE] on the cue. Too early = miss.</p>
          <button className={bigBtn + " md:hidden"} onPointerDown={tap("press")}>BRACE</button>
        </>
      )}

      {qte.kind === "grab" && (
        <>
          <div className="text-center text-2xl font-bold mb-2 text-destructive">
            🖐 {"▮".repeat(Math.min(typed, qte.presses ?? 8))}{"▯".repeat(Math.max(0, (qte.presses ?? 8) - typed))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mb-2 hidden md:block">Mash [SPACE]!</p>
          <button className={bigBtn + " md:hidden"} onPointerDown={tap("press")}>GRAB!</button>
        </>
      )}

      {qte.kind === "shell" && (
        <form onSubmit={(e) => { e.preventDefault(); input(command); }} className="space-y-2 text-xs">
          <p className="text-destructive break-words">{qte.prompt}</p>
          <p className="text-muted-foreground">// hint: {qte.hint}</p>
          <div className="flex items-center gap-2 border border-border bg-background px-2">
            <span className="text-primary shrink-0">$</span>
            <input
              autoFocus
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Shell command"
              className="flex-1 min-w-0 bg-transparent py-2 text-foreground outline-none"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">Type the command · Enter to run</p>
        </form>
      )}
    </div>
  );
};

export default QtePanel;
