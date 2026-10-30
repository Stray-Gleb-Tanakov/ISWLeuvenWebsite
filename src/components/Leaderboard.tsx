import { useEffect, useState } from "react";
import { fetchLeaderboard, type LeaderboardEntry } from "@/lib/scores";
import { badgeTitle } from "@/game/cosmetics";

/* Top 20 runs; `refreshKey` changes after a submission */
const Leaderboard = ({ refreshKey }: { refreshKey: number }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchLeaderboard()
      .then((rows) => { setEntries(rows); setError(false); })
      .catch(() => setError(true));
  }, [refreshKey]);

  return (
    <section className="border border-border bg-card p-4 font-mono text-xs">
      <h2 className="text-primary text-glow text-sm mb-3">
        <span className="text-muted-foreground">$</span> ./leaderboard --top 20
      </h2>
      {error && <p className="text-destructive">ERROR: leaderboard server unreachable. Try again later.</p>}
      {!error && entries === null && <p className="text-muted-foreground">loading...</p>}
      {entries?.length === 0 && <p className="text-muted-foreground">No runs yet. Be the first.</p>}
      {entries && entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-muted-foreground">
              <tr>
                <th className="pr-3 font-normal">#</th>
                <th className="pr-3 font-normal">name</th>
                <th className="pr-3 font-normal text-right">score</th>
                <th className="pr-3 font-normal">class</th>
                <th className="pr-3 font-normal">floor</th>
                <th className="font-normal">flags</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className={i === 0 ? "text-primary text-glow" : "text-foreground/80"}>
                  <td className="pr-3">{i + 1}</td>
                  <td className="pr-3 break-all">
                    {e.badge && <span className="text-amber-300 mr-1" title={badgeTitle(e.badge) ?? undefined}>{badgeTitle(e.badge)?.split(" ")[0]}</span>}
                    {e.name}
                    {e.badge && <span className="hidden sm:inline text-amber-300/70"> {badgeTitle(e.badge)?.slice(2)}</span>}
                  </td>
                  <td className="pr-3 text-right">{e.score.toLocaleString("en-US")}</td>
                  <td className="pr-3">{e.className}</td>
                  <td className="pr-3">{e.won ? "ESCAPED" : `${e.floor}/6`}</td>
                  <td>{e.flagsFound}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default Leaderboard;
