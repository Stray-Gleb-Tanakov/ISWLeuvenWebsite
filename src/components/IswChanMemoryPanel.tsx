import { useState } from "react";
import { DIARY } from "@/game/diary";
import { AFFECTION_CAP, exportMemory, importMemory, moodLine, saveMemory, type IswChanMemory } from "@/game/memory";

/* Class screen: what ISW-Chan thinks of you, with a memory dump you can export and import */
const IswChanMemoryPanel = ({ memory, onChange }: { memory: IswChanMemory; onChange: (m: IswChanMemory) => void }) => {
  const [mode, setMode] = useState<"closed" | "export" | "import" | "diary">("closed");
  const [dump, setDump] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const filled = Math.round((Math.min(memory.affection, 100) / 100) * 20);

  const doImport = () => {
    const r = importMemory(dump);
    setReply(r.line);
    if (r.ok) { saveMemory(r.memory); onChange(r.memory); }
  };

  return (
    <div className="border border-pink-400/40 p-2 space-y-1 text-[10px] font-mono">
      <p className="text-pink-400">[ISW-Chan] {moodLine(memory)}</p>
      <p className="text-muted-foreground">
        affection [{"♥".repeat(filled)}{"·".repeat(20 - filled)}] {memory.affection}%{memory.affection === AFFECTION_CAP ? " (max)" : ""} · {memory.runs} runs · {memory.wins} escapes · diary {memory.diary.length}/{DIARY.length}
      </p>
      <div className="flex gap-1">
        <button className="border border-border px-2 py-1 hover:border-pink-400" onClick={() => { setMode("export"); setDump(exportMemory(memory)); setReply(null); }}>export memory</button>
        <button className="border border-border px-2 py-1 hover:border-pink-400" onClick={() => { setMode("import"); setDump(""); setReply(null); }}>import memory</button>
        {memory.diary.length > 0 && <button className="border border-border px-2 py-1 hover:border-pink-400" onClick={() => { setMode("diary"); setReply(null); }}>read diary</button>}
        {mode !== "closed" && <button className="border border-border px-2 py-1" onClick={() => setMode("closed")}>close</button>}
      </div>
      {mode === "diary" && (
        <div className="space-y-2 border border-border p-2 max-h-56 overflow-y-auto">
          {DIARY.map((page, i) => memory.diary.includes(i) ? (
            <div key={i}>
              <p className="text-pink-400">📖 page {i + 1} · {page.date}</p>
              {page.lines.map((l, j) => <p key={j} className="text-foreground/80">{l}</p>)}
            </div>
          ) : (
            <p key={i} className="text-muted-foreground">📖 page {i + 1} · torn out (somewhere on floor {i + 1})</p>
          ))}
          {memory.diary.length === DIARY.length && <p className="text-pink-400">[ISW-Chan] ...you read all of it. that's. ok. that's fine. don't look at me.</p>}
        </div>
      )}
      {(mode === "export" || mode === "import") && (
        <textarea
          aria-label="ISW-Chan memory dump"
          value={dump}
          readOnly={mode === "export"}
          onChange={(e) => setDump(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          rows={3}
          spellCheck={false}
          className="w-full bg-background border border-border p-1 break-all"
          placeholder="paste a memory dump"
        />
      )}
      {mode === "import" && <button className="border border-pink-400 text-pink-400 px-2 py-1" onClick={doImport}>restore</button>}
      {reply && <p className="text-pink-400">[ISW-Chan] {reply}</p>}
    </div>
  );
};

export default IswChanMemoryPanel;
