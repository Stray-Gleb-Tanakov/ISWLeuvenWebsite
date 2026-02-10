import TerminalButton from "./TerminalButton";
import { commands, Command } from "@/data/site-data";

const CommandItem = ({ command }: { command: Command }) => (
  <div className="group">
    <TerminalButton href={command.href}>
      <span className="flex items-center justify-between w-full">
        <span className="flex items-center gap-3">
          {command.icon}
          <span className="font-bold">./{command.label}</span>
        </span>
        <span className="text-muted-foreground text-xs hidden sm:inline">[ENTER]</span>
      </span>
    </TerminalButton>
    <p className="mt-2 text-xs sm:text-sm text-muted-foreground pl-4">
      # {command.description}
    </p>
  </div>
);

const CommandGrid = () => (
  <section id="commands" className="min-h-screen flex flex-col justify-center py-16 px-4">
    <div className="container-terminal">
      <header className="mb-8 sm:mb-12">
        <h2 className="text-lg sm:text-xl text-muted-foreground mb-2">
          <span className="text-primary text-glow">user@iswleuven</span>:~$ ls ./commands
        </h2>
        <div className="h-px bg-border w-full" />
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {commands.map((cmd) => <CommandItem key={cmd.id} command={cmd} />)}
      </div>

      <footer className="mt-12 sm:mt-16 pt-4 border-t border-border">
        <p className="text-xs sm:text-sm text-muted-foreground">
          <span className="text-primary">TIP:</span> Navigate using keyboard or mouse.
        </p>
      </footer>
    </div>
  </section>
);

export default CommandGrid;
