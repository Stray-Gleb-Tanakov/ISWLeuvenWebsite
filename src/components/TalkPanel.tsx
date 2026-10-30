/* ====================================================
   Social Engineer view: first-person ASCII of the room,
   a portrait of whoever you're talking to, and a prompt
   where you type what you do or say.
   ==================================================== */

import { useMemo, useState } from "react";
import type { GameState } from "@/game/types";
import { SCENES, NPCS, presentNpcs } from "@/game/talk";
import { raycast, type Cell } from "@/game/raycaster";
import { PORTRAITS } from "@/game/portraits";

interface TalkPanelProps {
  state: GameState;
  dispatch: React.Dispatch<any>;
  narrow: boolean;
}

/* Merge neighbouring cells with the same colour into one span */
function runs(row: Cell[]): { cls: string; text: string }[] {
  const out: { cls: string; text: string }[] = [];
  for (const cell of row) {
    const last = out[out.length - 1];
    if (last && last.cls === cell.cls) last.text += cell.ch;
    else out.push({ cls: cell.cls, text: cell.ch });
  }
  return out;
}

const TalkPanel = ({ state, dispatch, narrow }: TalkPanelProps) => {
  const [input, setInput] = useState("");
  const talk = state.talk!;
  const scene = SCENES[talk.scene];
  const width = narrow ? 34 : 56;
  const height = narrow ? 11 : 14;

  const sprites = scene.sprites?.(talk, state);
  const spriteKey = JSON.stringify(sprites);
  const view = useMemo(
    () => raycast(state.maps[0], scene.view.x, scene.view.y, scene.view.angle, width, height, sprites),
    [state.maps, scene, width, height, spriteKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const npc = talk.npc ? NPCS[talk.npc] : null;
  const suspicion = npc ? talk.suspicion[npc.id] ?? 0 : 0;
  const trust = npc ? talk.memory?.[npc.id]?.trust ?? 0 : 0;
  // The portrait only shows while you're talking to someone; otherwise they're an emoticon in the room
  const portraitKey = npc ? (suspicion >= 60 && npc.angryPortrait ? npc.angryPortrait : npc.portrait) : null;
  const present = presentNpcs(state);

  // In a conversation their face fills the screen. ISW-Chan and the officer are ~70-column
  // conversions (square-ish cells like the originals); the hand-drawn ones are ~20 columns
  const big = portraitKey?.startsWith("isw_chan") || portraitKey?.startsWith("guard");
  const portraitSize = big ? "leading-none text-[6px] sm:text-[10px]" : "leading-tight text-[13px] sm:text-[20px]";
  const portraitColor = portraitKey === "guard_angry" ? "text-red-400" : portraitKey === "guard" ? "text-sky-200" : "text-pink-300";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    dispatch({ type: "TALK_INPUT", text: input });
    setInput("");
  };

  const chips = npc
    ? ["hi", "bye"]
    : ["look", ...present.map((p) => `talk to ${p.words[0]}`), ...scene.exits.map((x) => `go ${x.words[0]}`), "help"];

  return (
    <div className="border border-border bg-card p-3 font-mono text-xs space-y-2">
      <div className="flex justify-between gap-2">
        <span className="text-primary text-glow font-bold">▣ {scene.title}</span>
        {npc?.convinced && (
          <span className="flex gap-3">
            <span className="text-primary">trust {trust}%</span>
            <span className={suspicion >= 60 ? "text-destructive animate-pulse" : "text-amber-300"}>suspicion {suspicion}%</span>
          </span>
        )}
      </div>
      {npc && portraitKey ? (
        /* Conversation: only their face, centred */
        <div className="flex flex-col items-center gap-2 py-2">
          <pre className={`${portraitColor} select-none ${portraitSize}`} aria-label={npc.name}>{PORTRAITS[portraitKey].join("\n")}</pre>
          {npc.convinced && (
            <div className="w-full max-w-md space-y-1" aria-hidden="true">
              <div className="h-1.5 bg-border"><div className="h-full bg-primary transition-all" style={{ width: `${trust}%` }} /></div>
              <div className="h-1.5 bg-border"><div className="h-full bg-destructive transition-all" style={{ width: `${suspicion}%` }} /></div>
            </div>
          )}
        </div>
      ) : (
        <pre className="rc-view leading-none text-[10px] sm:text-[13px] select-none overflow-hidden" aria-hidden="true">
          {view.map((row, r) => <div key={r}>{runs(row).map((run, i) => <span key={i} className={run.cls}>{run.text}</span>)}</div>)}
        </pre>
      )}
      {npc ? (
        <p className="text-pink-300">Talking to {npc.name}. Type anything.</p>
      ) : present.length > 0 && (
        <p className="text-muted-foreground">
          Here:{" "}
          {present.map((p, i) => (
            <span key={p.id}>{i > 0 && " · "}<span className="text-pink-300">{p.emote}</span> {p.name.split(" //")[0]}</span>
          ))}
          <span className="text-muted-foreground/60"> (talk to them)</span>
        </p>
      )}
      <form onSubmit={submit} className="flex gap-2">
        <span className="text-primary self-center">&gt;</span>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={npc ? "say something..." : "what do you do?"}
          aria-label={npc ? "What you say" : "What you do"}
          autoCorrect="off"
          spellCheck={false}
          className="flex-1 min-w-0 bg-background border border-border px-2 py-2 text-foreground focus:border-primary outline-none"
        />
        <button type="submit" className="border border-border px-3 hover:border-primary active:bg-primary/20 touch-manipulation">enter</button>
      </form>
      <div className="flex flex-wrap gap-1">
        {chips.map((c) => (
          <button key={c} onClick={() => dispatch({ type: "TALK_INPUT", text: c })} className="border border-border px-2 py-1 text-[10px] text-muted-foreground hover:border-primary hover:text-primary touch-manipulation">
            {c}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TalkPanel;
