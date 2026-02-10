import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TerminalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}

const TerminalButton = ({ children, onClick, href, className }: TerminalButtonProps) => {
  const baseClasses = cn(
    "terminal-btn",
    "block w-full px-4 py-3 sm:py-4",
    "bg-secondary border border-primary",
    "text-primary text-left font-mono text-sm sm:text-base",
    "hover:bg-primary hover:text-primary-foreground",
    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
    "transition-all duration-200",
    className
  );

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        <span className="flex items-center gap-2">
          <span className="text-muted-foreground">$</span>
          {children}
        </span>
      </a>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      <span className="flex items-center gap-2">
        <span className="text-muted-foreground">$</span>
        {children}
      </span>
    </button>
  );
};

export default TerminalButton;
