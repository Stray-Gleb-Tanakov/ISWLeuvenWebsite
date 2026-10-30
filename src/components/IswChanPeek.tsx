import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { xorReveal } from "@/game/flags";

/* Now and then ISW-Chan peeks in from the edge of the screen and ducks away.
   Mini CTF "Peekaboo": catch her (click) 10 times. */

const CATCHES_KEY = "isw_chan_caught";
export const CATCHES_NEEDED = 10;
const PEEK_CHANCE = 0.25;       // per page visit
const DELAY_MS = [8000, 30000]; // when she shows up after you land on a page
const VISIBLE_MS = 2600;
const SECRET = "OTYyECJWOig4MTojUjAwP0NWLlovJRI=";

const CAUGHT_LINES = [
  "!! i wasn't looking. i was. leave me alone.",
  "how. HOW.",
  "you're fast. i'm faster. this doesn't count.",
  "...that tickles.",
  "stop catching me, it's undignified.",
  "ok fine you win this one.",
];

type Edge = "left" | "right" | "bottom";

function readCatches(): number {
  try { return Number(localStorage.getItem(CATCHES_KEY)) || 0; } catch { return 0; }
}

export function caughtLine(count: number): string {
  if (count >= CATCHES_NEEDED) return `fine. FINE. ${count} times. take it and stop: ${xorReveal(SECRET, "peekaboo")}`;
  return `${CAUGHT_LINES[count % CAUGHT_LINES.length]} (${count}/${CATCHES_NEEDED})`;
}

const IswChanPeek = () => {
  const { pathname } = useLocation();
  const [peek, setPeek] = useState<{ edge: Edge; at: number } | null>(null);
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    setPeek(null);
    if (pathname === "/mainframe_breach" || Math.random() >= PEEK_CHANCE) return;
    const delay = DELAY_MS[0] + Math.random() * (DELAY_MS[1] - DELAY_MS[0]);
    const edges: Edge[] = ["left", "right", "bottom"];
    const show = setTimeout(() => setPeek({ edge: edges[Math.floor(Math.random() * 3)], at: 20 + Math.random() * 60 }), delay);
    const hide = setTimeout(() => setPeek(null), delay + VISIBLE_MS);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [pathname]);

  useEffect(() => {
    if (!line) return;
    const t = setTimeout(() => setLine(null), line.includes("ISW{") ? 20000 : 3500);
    return () => clearTimeout(t);
  }, [line]);

  const caught = () => {
    const count = readCatches() + 1;
    try { localStorage.setItem(CATCHES_KEY, String(count)); } catch { /* she forgets */ }
    setPeek(null);
    setLine(caughtLine(count));
  };

  const pos = peek
    ? peek.edge === "bottom" ? { left: `${peek.at}%`, bottom: 0 } : { [peek.edge]: 0, top: `${peek.at}%` }
    : {};

  return (
    <>
      {peek && (
        <button
          onClick={caught}
          aria-label="ISW-Chan is peeking. Catch her!"
          className={`isw-peek isw-peek-${peek.edge} fixed z-50 font-mono text-pink-400 text-xs leading-none bg-transparent`}
          style={pos}
        >
          <pre>{peek.edge === "left" ? "\\_/\\\n o.o)\n  > )" : peek.edge === "right" ? " /\\_/\n(o.o \n( <  " : " /\\_/\\ \n( o.o )"}</pre>
        </button>
      )}
      {line && (
        <div role="status" className="fixed z-50 bottom-4 left-1/2 -translate-x-1/2 max-w-[90vw] border border-pink-400 bg-card px-3 py-2 font-mono text-xs text-pink-300 break-words" onClick={() => setLine(null)}>
          [ISW-Chan] {line}
        </div>
      )}
    </>
  );
};

export default IswChanPeek;
