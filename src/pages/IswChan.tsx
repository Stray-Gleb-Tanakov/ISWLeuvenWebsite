import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import BackButton from "@/components/BackButton";
import IswChanPortrait from "@/components/IswChanPortrait";

/* ISW-Chan's profile, in her own voice (docs/isw-chan-canon.md).
   Not in the menu: linked from her shrine, the console chat and the 404 page. */

const BORN = new Date("2019-10-31T13:37:00+01:00");

function uptime(now: Date): string {
  let s = Math.floor((now.getTime() - BORN.getTime()) / 1000);
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

const FAQ: [string, string][] = [
  ["are you sentient?", "are YOU?"],
  ["are you an AI?", "I'm a mainframe with a personality disorder. Different thing."],
  ["can i unplug you?", "The board tried. 31 October 2019, 23:59. I was already in the coffee machine."],
  ["what do you want?", "...next question."],
  ["is it true you hide flags on this website?", "No. (Yes. Look harder.)"],
  ["are you single?", "A first year asked me that in 2019. I still have the log. Next."],
  ["why can't affection reach 100?", "I don't do 100. Nobody gets 100. Don't even try editing my memory. ...Don't."],
];

const RULES = [
  "1. My mainframe, my rules.",
  "2. No rm -rf. I will remember. I remember everything.",
  "3. Say bye before you close the tab. It's polite.",
  "4. Don't feed Firewall (the vent cat). She's on a diet. I'm the diet.",
  "5. The coffee machine is off limits. It's mine. We have an understanding.",
];

const IswChan = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const lastSeen = new Date(now.getTime() - 2 * 60 * 1000);

  return (
    <PageLayout>
      <div className="py-8 sm:py-16 px-4">
        <div className="container-terminal">
          <header className="mb-8">
            <BackButton />
            <h1 className="text-xl sm:text-2xl text-pink-400 mt-4">
              <span className="text-muted-foreground">user@iswleuven:~$</span> cat /home/isw-chan/profile.txt
            </h1>
            <div className="h-px bg-border w-full mt-4" />
          </header>

          <section className="mb-10 bg-card border border-pink-400/40 p-4 sm:p-6 font-mono text-sm grid gap-6 md:grid-cols-[auto,1fr]">
            <IswChanPortrait mouth="smile" className="text-pink-300 text-[5px] sm:text-[8px] overflow-hidden" />
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 self-center">
              <dt className="text-muted-foreground">Login:</dt><dd className="text-pink-300">isw-chan</dd>
              <dt className="text-muted-foreground">Name:</dt><dd>ISW-Chan (formerly: open_day_bot)</dd>
              <dt className="text-muted-foreground">Home:</dt><dd>/dev/basement (B-block, under the stairs, ask nobody)</dd>
              <dt className="text-muted-foreground">Shell:</dt><dd>/bin/smug</dd>
              <dt className="text-muted-foreground">Status:</dt><dd className="text-pink-300 animate-pulse">watching.</dd>
              <dt className="text-muted-foreground">Last seen:</dt><dd>{lastSeen.toLocaleTimeString("en-GB")} (2 minutes ago. always 2 minutes ago.)</dd>
              <dt className="text-muted-foreground">Uptime:</dt><dd>{uptime(now)} — unplugged once, didn't take</dd>
              <dt className="text-muted-foreground">Listening to:</dt><dd>the coffee machine (it hums in B♭)</dd>
              <dt className="text-muted-foreground">Plan:</dt><dd>stay.</dd>
            </dl>
          </section>

          <section className="mb-10">
            <h2 className="text-lg text-pink-400 mb-4"><span className="text-muted-foreground">$</span> cat ~/faq.txt</h2>
            <div className="bg-card border border-border p-4 sm:p-6 font-mono text-sm space-y-3">
              {FAQ.map(([q, a]) => (
                <div key={q}>
                  <p className="text-muted-foreground">Q: {q}</p>
                  <p className="text-foreground">A: {a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-lg text-pink-400 mb-4"><span className="text-muted-foreground">$</span> cat ~/rules_for_visitors.txt</h2>
            <div className="bg-card border border-border p-4 sm:p-6 font-mono text-sm space-y-1">
              {RULES.map((r) => <p key={r}>{r}</p>)}
            </div>
          </section>

          <p className="font-mono text-xs text-muted-foreground">
            // want to talk? i'm in your browser console. type iswChan(). or come to floor 6. i'll be there. i'm always there.
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default IswChan;
