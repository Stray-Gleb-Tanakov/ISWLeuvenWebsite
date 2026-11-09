import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { LOST_CIPHER } from "@/game/flags";
import IswChanPortrait from "@/components/IswChanPortrait";
import { useChanBan } from "@/hooks/UseChanBan";

const NotFound = () => {
  const location = useLocation();
  const { banned } = useChanBan();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found! We're probably still busy making this ;3 Teehee</p>
        {/* ISW-Chan took over the 404 page. She just watches you. And blinks. Unless she's hardware-banned you (chanban.ts): then she glares. */}
        <div className="mb-2 flex justify-center">
          {banned
            ? <IswChanPortrait eyes="angry" mouth="frown" className="text-red-300 text-[5px] sm:text-[7px]" label="ISW-Chan, glaring at you" />
            : <IswChanPortrait className="text-pink-300 text-[5px] sm:text-[7px]" label="ISW-Chan, watching you" />}
        </div>
        <p className={`mb-4 font-mono text-xs ${banned ? "text-red-400" : "text-pink-400"}`}>
          {banned
            ? <>[ISW-Chan] lost AND blacklisted. tragic. · <a href="/isw-chan" className="underline">appeal?</a></>
            : <>[ISW-Chan] you're lost. good. stay. · <a href="/isw-chan" className="underline">who?</a></>}
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
