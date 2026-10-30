import { HIDDEN_FLAGS, FLAG_POINTS } from "@/game/flags";

/* In-game terminal listing the hidden website flags (U on the map) */
const UplinkPanel = ({ found }: { found: Record<string, string> }) => {
  const count = Object.keys(found).length;
  return (
    <div className="border-2 border-cyan-400/60 bg-card p-3 font-mono text-xs space-y-2">
      <div className="flex justify-between gap-2">
        <span className="text-cyan-400 font-bold">⇅ ISW UPLINK</span>
        <span className="text-primary">{count}/{HIDDEN_FLAGS.length} flags · +{(count * FLAG_POINTS).toLocaleString("en-US")}</span>
      </div>
      <p className="text-muted-foreground">
        // These flags aren't in the mainframe. They're hidden across the ISW website. Find them out there, upload them here.
      </p>
      <ul className="space-y-1">
        {HIDDEN_FLAGS.map((f) => (
          <li key={f.id} className={found[f.id] ? "text-primary" : "text-foreground/80"}>
            [{found[f.id] ? "x" : " "}] <span className="font-bold">{f.title}</span>
            <span className="text-muted-foreground"> — {f.hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UplinkPanel;
