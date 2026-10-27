import PageLayout from "@/components/PageLayout";
import BackButton from "@/components/BackButton";
import GameTerminal from "@/components/GameTerminal";

const Game = () => (
  <PageLayout>
    <div className="h-screen flex flex-col items-center px-4 py-4 overflow-hidden">
      <div className="w-full max-w-4xl mb-2">
        <BackButton />
      </div>
      <h1 className="text-xl font-mono text-primary text-glow mb-1">
        <span className="text-muted-foreground">$</span> ./mainframe_breach
      </h1>
      <p className="text-muted-foreground text-xs font-mono mb-3">
        // A cyberpunk terminal RPG — escape the corrupted mainframe
      </p>
      <div className="flex-1 w-full max-w-5xl min-h-0">
        <GameTerminal />
      </div>
    </div>
  </PageLayout>
);

export default Game;
