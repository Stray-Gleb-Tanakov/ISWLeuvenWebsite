/* ====================================================
   Social Engineer view: first-person ASCII of the room,
   a portrait of whoever you're talking to, and a prompt
   where you type what you do or say.
   ==================================================== */

import { useMemo, useState } from "react";
import type { GameState } from "@/game/types";
import { SCENES, NPCS } from "@/game/talk";
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
  // Who's on screen: your conversation partner, or ISW-Chan watching in the east wing
  const portraitKey = npc
    ? (suspicion >= 60 && npc.angryPortrait ? npc.angryPortrait : npc.portrait)
    : talk.scene === "east" ? "isw_chan" : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    dispatch({ type: "TALK_INPUT", text: input });
    setInput("");
  };

  const chips = npc ? ["hi", "I'm from IT", "can I have the keycard?", "bye"] : ["look", ...scene.exits.map((x) => `go ${x.words[0]}`), "help"];

  return (
    <div className="border border-border bg-card p-3 font-mono text-xs space-y-2">
      <div className="flex justify-between gap-2">
        <span className="text-primary text-glow font-bold">▣ {scene.title}</span>
        {npc && npc.enemy && <span className={suspicion >= 60 ? "text-destructive" : "text-amber-300"}>suspicion {suspicion}%</span>}
      </div>
      <div className="flex gap-3 items-start">
        <pre className="rc-view leading-none text-[10px] sm:text-[13px] select-none overflow-hidden" aria-hidden="true">
          {view.map((row, r) => <div key={r}>{runs(row).map((run, i) => <span key={i} className={run.cls}>{run.text}</span>)}</div>)}
        </pre>
        {portraitKey && !narrow && (
          <pre className="text-pink-300 leading-tight text-[10px] select-none shrink-0" aria-label={npc?.name ?? "ISW-Chan"}>{PORTRAITS[portraitKey].join("\n")}</pre>
        )}
      </div>
      {portraitKey && narrow && (
        <pre className="text-pink-300 leading-tight text-[10px] select-none" aria-label={npc?.name ?? "ISW-Chan"}>{PORTRAITS[portraitKey].join("\n")}</pre>
      )}
      {npc && <p className="text-pink-300">Talking to {npc.name}. Type anything.</p>}
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
