import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { LOST_CIPHER } from "@/game/flags";
import IswChanPortrait from "@/components/IswChanPortrait";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found! We're probably still busy making this ;3 Teehee</p>
        {/* ISW-Chan took over the 404 page. She just watches you. And blinks. */}
        <div className="mb-2 flex justify-center">
          <IswChanPortrait className="text-pink-300 text-[5px] sm:text-[7px]" label="ISW-Chan, watching you" />
        </div>
        <p className="mb-4 font-mono text-xs text-pink-400">
          [ISW-Chan] you're lost. good. stay. · <a href="/isw-chan" className="underline">who?</a>
        </p>
        <p className="mb-4 font-mono text-xs text-muted-foreground/60 max-w-xl mx-auto break-words">
          // lost? read our ./mission. recovery coordinates:<br />
          {LOST_CIPHER}
        </p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
