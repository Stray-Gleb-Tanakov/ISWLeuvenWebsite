import { useEffect, useRef, useState } from "react";
import type { ChanCall } from "@/game/types";
import IswChanPortrait from "@/components/IswChanPortrait";

/* A call with ISW-Chan: her face, what was said, and a prompt. Esc or "bye" hangs up. */
const CallPanel = ({ call, over, onSay, onHangUp }: { call: ChanCall; over: boolean; onSay: (text: string) => void; onHangUp: () => void }) => {
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [call.said.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || over) return;
    onSay(input);
    setInput("");
  };

  const [eyes, mouth] = call.convo.face;
  return (
    <div className={`border bg-card p-3 font-mono text-xs space-y-2 ${over ? "border-destructive" : "border-pink-400/60"}`}>
      <div className="flex justify-between">
        <span className="text-pink-400 font-bold">☎ ISW-Chan {over ? "— DISCONNECTED" : "— on the line"}</span>
        {!over && <button onClick={onHangUp} className="text-muted-foreground hover:text-pink-400">[hang up]</button>}
      </div>
      <div className="flex justify-center">
        <IswChanPortrait eyes={eyes} mouth={mouth} crop className={`text-[5px] sm:text-[7px] ${over ? "text-red-400" : "text-pink-300"}`} />
      </div>
      <div ref={logRef} className="max-h-40 overflow-y-auto space-y-1" aria-live="polite">
        {call.said.map((line, i) => (
          <p key={i} className={line.who === "her" ? "text-pink-300" : "text-foreground"}>
            {line.who === "her" ? "ISW-Chan: " : "> "}{line.text}
          </p>
        ))}
      </div>
      {over ? (
        <p className="text-destructive font-bold">ISW-Chan kicked you out of the mainframe. Press [R] to restart.</p>
      ) : (
        <form onSubmit={submit} className="flex gap-2">
          <span className="text-primary self-center">&gt;</span>
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") onHangUp(); }}
            placeholder="ask her anything..."
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

export default CallPanel;
