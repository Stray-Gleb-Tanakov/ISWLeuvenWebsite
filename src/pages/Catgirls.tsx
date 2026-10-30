import PageLayout from "@/components/PageLayout";
import BackButton from "@/components/BackButton";
import catgirl1 from "@/assets/catgirl-1.png";
import catgirl2 from "@/assets/catgirl-2.png";
import catgirl3 from "@/assets/catgirl-3.png";
import { xorReveal } from "@/game/flags";

/* Mini CTF: "Director's Cut". Only screen readers (and inspect element) get ISW-Chan's caption */
const CAPTION = "KyElCUAuJi0mRzomLTlFNiYrDw==";

const Catgirls = () => (
  <PageLayout>
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 py-12">
      <BackButton />
      <h1 className="text-2xl font-mono text-primary text-glow">
        <span className="text-muted-foreground">$</span> cat ~/catgirls/*
      </h1>
      <img src={catgirl1} alt={`A-10 catgirl goes brrrt. ISW-Chan's caption, for screen readers only: ${xorReveal(CAPTION, "brrrt")}`} className="max-w-lg w-full rounded border border-border" />
      <img src={catgirl2} alt="Genetically engineered catgirls" className="max-w-lg w-full rounded border border-border" />
      <img src={catgirl3} alt="A catgirl in a maid outfit" className="max-w-lg w-full rounded border border-border" />
      {/* Mini CTF: "Voicemail". The audio hides its flag in the spectrogram */}
      <div className="max-w-lg w-full border border-border bg-card p-4 font-mono text-xs space-y-2">
        <p className="text-primary">📼 1 new voicemail from ISW-Chan</p>
        <p className="text-muted-foreground">// she sounded like she was trying to show us something</p>
        <audio controls preload="none" src="/audio/voicemail_isw-chan.wav" className="w-full" />
        <a href="/audio/voicemail_isw-chan.wav" download className="text-primary underline">voicemail_isw-chan.wav</a>
      </div>
    </div>
  </PageLayout>
);

export default Catgirls;
