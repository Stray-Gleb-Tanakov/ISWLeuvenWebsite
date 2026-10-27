import { sponsors } from "@/data/site-data";

const SponsorsSection = () => (
  <section className="py-16 px-4">
    <div className="container-terminal">
      <h2 className="text-lg text-primary text-glow mb-2">
        <span className="text-muted-foreground">$</span> cat ./sponsors.txt
      </h2>
      <p className="text-muted-foreground text-sm mb-8">// Organizations that support ISW Leuven</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {sponsors.map((sponsor) => (
          <a
            key={sponsor.id}
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border border-border hover:border-primary/50 p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:shadow-[var(--terminal-glow)] group"
          >
            <span className="text-2xl">{sponsor.emoji}</span>
            <span className="text-foreground text-sm font-bold text-center group-hover:text-glow">
              {sponsor.name}
            </span>
            <span className="text-muted-foreground text-xs text-center">{sponsor.description}</span>
          </a>
        ))}
      </div>
    </div>
  </section>
);

export default SponsorsSection;
