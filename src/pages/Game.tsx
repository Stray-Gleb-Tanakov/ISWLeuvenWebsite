import { useState } from "react";
import { useLocation } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import BackButton from "@/components/BackButton";
import GameTerminal from "@/components/GameTerminal";
import Leaderboard from "@/components/Leaderboard";
import { useFoundFlags } from "@/hooks/UseFoundFlags";

const Game = () => {
  const { found, submit } = useFoundFlags();
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const konami = (useLocation().state as { konami?: boolean } | null)?.konami;

  return (
    <PageLayout>
      <div className="min-h-screen flex flex-col items-center px-4 py-4">
        <div className="w-full max-w-4xl mb-2">
          <BackButton />
        </div>
        <h1 className="text-xl font-mono text-primary text-glow mb-1">
          <span className="text-muted-foreground">$</span> ./mainframe_breach
        </h1>
        <p className="text-muted-foreground text-xs font-mono mb-3">
          // A cyberpunk terminal RPG — escape the corrupted mainframe
        </p>
        {konami && (
          <p className="text-pink-400 text-xs font-mono mb-3">[ISW-Chan] ↑↑↓↓←→←→BA? Cheat codes don't work in MY mainframe. ...Come in anyway.</p>
        )}
        <div className="w-full max-w-5xl">
          <GameTerminal found={found} onSubmitFlag={submit} onScoreSubmitted={() => setLeaderboardKey((k) => k + 1)} />
        </div>
        <div className="w-full max-w-5xl mt-6 mb-8">
          <Leaderboard refreshKey={leaderboardKey} />
        </div>
      </div>
    </PageLayout>
  );
};

export default Game;
