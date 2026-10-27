import { useEffect, useState, useMemo } from "react";
import { codeSnippets } from "@/data/site-data";

interface FloatingWindow {
  id: number;
  snippet: typeof codeSnippets[number];
  x: number;
  delay: number;
  duration: number;
  opacity: number;
  scale: number;
}

let nextId = 0;

const FloatingCodeWindows = () => {
  const [windows, setWindows] = useState<FloatingWindow[]>([]);

    // Divide the screen into columns so windows don't overlap horizontally
  const columns = useMemo(() => [5, 25, 45, 65, 82], []);
  const colIndex = useMemo(() => ({ current: 0 }), []);
  const getNextX = () => {
    const base = columns[colIndex.current % columns.length];
    colIndex.current++;
    return base + (Math.random() * 12 - 6); // slight jitter within column
  };
  useEffect(() => {
    // Spawn initial windows
    const initial = Array.from({ length: 4 }, () => createWindow(true, getNextX()));
    setWindows(initial);

    const interval = setInterval(() => {
      setWindows((prev) => {
        const filtered = prev.length > 8 ? prev.slice(-6) : prev;
        return [...filtered, createWindow(false, getNextX())];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {windows.map((w) => (
        <div
          key={w.id}
          className="absolute floating-code-window"
          style={{
            left: `${w.x}%`,
            bottom: "-200px",
            animationDelay: `${w.delay}s`,
            animationDuration: `${w.duration}s`,
            opacity: w.opacity,
            transform: `scale(${w.scale})`,
          }}
        >
          <div className="bg-card/60 border border-border/40 backdrop-blur-sm p-3 max-w-[280px] rounded-none">
            {/* Mini titlebar */}
            <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-border/30">
              <div className="w-2 h-2 rounded-full bg-destructive/60" />
              <div className="w-2 h-2 rounded-full bg-accent/60" />
              <div className="w-2 h-2 rounded-full bg-primary/60" />
              <span className="ml-1.5 text-muted-foreground text-[10px]">{w.snippet.filename}</span>
            </div>
            {/* Code */}
            <pre className="text-[10px] sm:text-[11px] leading-relaxed text-muted-foreground/70 whitespace-pre overflow-hidden">
              {w.snippet.code}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
};

function createWindow(initialSpawn: boolean, x: number): FloatingWindow {
  const snippet = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
  return {
    id: nextId++,
    snippet,
    x,
    delay: initialSpawn ? Math.random() * 8 : 0,
    duration: 18 + Math.random() * 14,
    opacity: 0.3 + Math.random() * 0.25,
    scale: 0.7 + Math.random() * 0.4,
  };
}


export default FloatingCodeWindows;
