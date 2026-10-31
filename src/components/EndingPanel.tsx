import { useEffect, useRef, useState } from "react";
import type { GameState } from "@/game/types";
import IswChanPortrait from "@/components/IswChanPortrait";
import type { IswEyes, IswMouth } from "@/game/portraits";

/* Her face as the talk goes: sad once you say you're leaving, then whatever the ending makes her */
const ENDING_FACE: Record<string, [IswEyes, IswMouth]> = { goodbye: ["happy", "smile"], stay: ["heart", "smile"], unplug: ["wide", "o"] };

/* The secret ending: ISW-Chan's face fills the screen and you type what you say */
const EndingPanel = ({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<any> }) => {
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const ending = state.ending!;
  const face: [IswEyes, IswMouth] = ending.done ? ENDING_FACE[ending.done] : ending.rude ? ["angry", "frown"] : ending.askedComeBack ? ["sad", "frown"] : ["open", "neutral"];

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [ending.said.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    dispatch({ type: "ENDING_SAY", text: input });
    setInput("");
  };

  return (
    <div className="border border-pink-400/60 bg-card p-3 font-mono text-xs space-y-2">
      <div className="text-pink-400 font-bold">▣ MAINFRAME CORE — ???</div>
      <div className="flex justify-center py-1">
        <IswChanPortrait eyes={face[0]} mouth={face[1]} className="text-pink-300 text-[6px] sm:text-[10px]" />
      </div>
      <div ref={logRef} className="max-h-40 overflow-y-auto space-y-1" aria-live="polite">
        {ending.said.map((line, i) => (
          <p key={i} className={line.who === "her" ? "text-pink-300" : "text-foreground"}>
            {line.who === "her" ? "ISW-Chan: " : "> "}{line.text}
          </p>
        ))}
      </div>
      {ending.kicked ? (
        <p className="text-destructive font-bold">ISW-Chan threw you out of the mainframe. Press [R] to restart.</p>
      ) : (
      <form onSubmit={submit} className="flex gap-2">
        <span className="text-primary self-center">&gt;</span>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="say something to her..."
          aria-label="What you say to ISW-Chan"
          autoCorrect="off"
          spellCheck={false}
          className="flex-1 min-w-0 bg-background border border-border px-2 py-2 text-foreground focus:border-pink-400 outline-none"
        />
        <button type="submit" className="border border-border px-3 hover:border-pink-400 active:bg-pink-400/20 touch-manipulation">enter</button>
      </form>
      )}
    </div>
  );
};

export default EndingPanel;
