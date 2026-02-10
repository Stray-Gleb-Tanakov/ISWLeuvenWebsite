import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";


const ASCII_LOGO = `
 ██╗███████╗██╗    ██╗    ██╗     ███████╗██╗   ██╗██╗   ██╗███████╗███╗   ██╗
 ██║██╔════╝██║    ██║    ██║     ██╔════╝██║   ██║██║   ██║██╔════╝████╗  ██║
 ██║███████╗██║ █╗ ██║    ██║     █████╗  ██║   ██║██║   ██║█████╗  ██╔██╗ ██║
 ██║╚════██║██║███╗██║    ██║     ██╔══╝  ██║   ██║╚██╗ ██╔╝██╔══╝  ██║╚██╗██║
 ██║███████║╚███╔███╔╝    ███████╗███████╗╚██████╔╝ ╚████╔╝ ███████╗██║ ╚████║
 ╚═╝╚══════╝ ╚══╝╚══╝     ╚══════╝╚══════╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═══╝
`;

const WELCOME_TEXT = "Welcome to the ISW Terminal";
const SUBTEXT = "Initialize connection...";

const TerminalHero = () => {
  const [displayedWelcome, setDisplayedWelcome] = useState("");
  const [displayedSubtext, setDisplayedSubtext] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [phase, setPhase] = useState<"welcome" | "subtext" | "done">("welcome");

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (phase === "welcome") {
      if (displayedWelcome.length < WELCOME_TEXT.length) {
        timeout = setTimeout(() => {
          setDisplayedWelcome(WELCOME_TEXT.slice(0, displayedWelcome.length + 1));
        }, 50);
      } else {
        timeout = setTimeout(() => setPhase("subtext"), 300);
      }
    } else if (phase === "subtext") {
      if (displayedSubtext.length < SUBTEXT.length) {
        timeout = setTimeout(() => {
          setDisplayedSubtext(SUBTEXT.slice(0, displayedSubtext.length + 1));
        }, 50);
      } else {
        setPhase("done");
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedWelcome, displayedSubtext, phase]);

  const scrollToContent = () => {
    document.getElementById("commands")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      {/* ASCII Logo */}
      {/* Logo */}
      
      <pre className="ascii-art hidden sm:block mb-8 select-none" aria-hidden="true">
        {ASCII_LOGO}
      </pre>

      {/* Mobile-friendly title */}
      <h1 className="sm:hidden text-2xl font-bold text-primary text-glow mb-8">ISW LEUVEN</h1>

      {/* Terminal window */}
      <div className="w-full max-w-2xl bg-card border border-primary border-glow p-4 sm:p-6">
        {/* Terminal header */}
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
          <div className="w-3 h-3 rounded-full bg-[hsl(0_84%_60%)]" />
          <div className="w-3 h-3 rounded-full bg-[hsl(45_93%_47%)]" />
          <div className="w-3 h-3 rounded-full bg-[hsl(120_100%_50%)]" />
          <span className="ml-2 text-muted-foreground text-xs sm:text-sm">terminal@iswleuven:~</span>
        </div>

        {/* Terminal content */}
        <div className="space-y-2 text-sm sm:text-base">
          <div className="flex">
            <span className="text-muted-foreground mr-2">$</span>
            <span className="text-primary text-glow">
              {displayedWelcome}
              {phase === "welcome" && showCursor && <span className="cursor-blink">█</span>}
            </span>
          </div>

          {phase !== "welcome" && (
            <div className="flex">
              <span className="text-muted-foreground mr-2">$</span>
              <span className="text-accent">
                {displayedSubtext}
                {phase === "subtext" && showCursor && <span className="cursor-blink">█</span>}
              </span>
            </div>
          )}

          {phase === "done" && (
            <div className="flex">
              <span className="text-muted-foreground mr-2">$</span>
              <span className="text-primary text-glow">
                Ready for input<span className="cursor-blink">█</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-8 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors scroll-pulse"
        aria-label="Scroll to content"
      >
        <span className="text-xs sm:text-sm">SCROLL FOR COMMANDS</span>
        <ChevronDown className="w-6 h-6 animate-bounce" />
      </button>
    </section>
  );
};

export default TerminalHero;
