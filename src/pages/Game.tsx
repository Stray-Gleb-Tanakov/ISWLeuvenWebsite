import PageLayout from "@/components/PageLayout";
import BackButton from "@/components/BackButton";
import GameTerminal from "@/components/GameTerminal";
const Game = () => (
  <PageLayout>
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-4xl mb-4">
        <BackButton />
      </div>
      <h1 className="text-xl font-mono text-primary text-glow mb-1">
        <span className="text-muted-foreground">$</span> ./mainframe_breach
      </h1>
      <p className="text-muted-foreground text-xs font-mono mb-6">
        // A cyberpunk terminal RPG — escape the corrupted mainframe
      </p>
      <GameTerminal />
    </div>
  </PageLayout>
);
export default Game;
