import type { PerkId } from "@/game/types";
import { PERKS } from "@/game/perks";

/* Level-up: pick 1 of 3 (keys 1-3 or tap) */
const PerkPanel = ({ choices, onPick }: { choices: PerkId[]; onPick: (index: number) => void }) => (
  <div className="border-2 border-primary bg-card p-3 font-mono text-xs space-y-2">
    <p className="text-primary text-glow font-bold text-sm">▲ LEVEL UP — choose a perk</p>
    <div className="grid gap-2 sm:grid-cols-3">
      {choices.map((id, i) => (
        <button
          key={id}
          onClick={() => onPick(i)}
          className="text-left border border-border hover:border-primary active:bg-primary/20 p-2 touch-manipulation"
        >
          <span className="text-primary font-bold">[{i + 1}] {PERKS[id].name}</span>
          <br />
          <span className="text-muted-foreground">{PERKS[id].description}</span>
        </button>
      ))}
    </div>
  </div>
);

export default PerkPanel;
