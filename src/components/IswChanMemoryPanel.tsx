import { useState } from "react";
import { AFFECTION_CAP, exportMemory, importMemory, moodLine, saveMemory, type IswChanMemory } from "@/game/memory";

/* Class screen: what ISW-Chan thinks of you, with a memory dump you can export and import */
const IswChanMemoryPanel = ({ memory, onChange }: { memory: IswChanMemory; onChange: (m: IswChanMemory) => void }) => {
  const [mode, setMode] = useState<"closed" | "export" | "import">("closed");
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
        affection [{"♥".repeat(filled)}{"·".repeat(20 - filled)}] {memory.affection}%{memory.affection === AFFECTION_CAP ? " (max)" : ""} · {memory.runs} runs · {memory.wins} escapes
      </p>
      <div className="flex gap-1">
        <button className="border border-border px-2 py-1 hover:border-pink-400" onClick={() => { setMode("export"); setDump(exportMemory(memory)); setReply(null); }}>export memory</button>
        <button className="border border-border px-2 py-1 hover:border-pink-400" onClick={() => { setMode("import"); setDump(""); setReply(null); }}>import memory</button>
        {mode !== "closed" && <button className="border border-border px-2 py-1" onClick={() => setMode("closed")}>close</button>}
      </div>
      {mode !== "closed" && (
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
