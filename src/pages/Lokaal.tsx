import PageLayout from "@/components/PageLayout";
import BackButton from "@/components/BackButton";
import { lokaalBlocks, LokaalBlock } from "@/data/site-data";
const LokaalCard = ({ block }: { block: LokaalBlock }) => (
  <article className="bg-card border border-border hover:border-primary transition-colors p-4 sm:p-6">
    <h3 className="text-primary text-glow font-bold text-lg mb-4 flex items-center gap-2">
      <span>{block.emoji}</span>
      {block.title}
    </h3>
    <dl className="space-y-2">
      {block.details.map((detail) => (
        <div key={detail.id} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
          <dt className="text-primary text-sm font-bold min-w-[120px]">{detail.key}:</dt>
          <dd className="text-muted-foreground text-sm">{detail.value}</dd>
        </div>
      ))}
    </dl>
  </article>
);
const Lokaal = () => (
  <PageLayout>
    <div className="py-8 sm:py-16 px-4">
      <div className="container-terminal">
        {/* Header */}
        <header className="mb-8">
          <BackButton />
          <h1 className="text-xl sm:text-2xl text-primary text-glow mt-4">
            <span className="text-muted-foreground">user@iswleuven:~$</span> cat ./lokaal
          </h1>
          <div className="h-px bg-border w-full mt-4" />
        </header>
        {/* Lokaal blocks */}
        <div className="space-y-4">
          {lokaalBlocks.map((block) => (
            <LokaalCard key={block.id} block={block} />
          ))}
        </div>
        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary">TIP:</span> To update room info, edit the lokaalBlocks array in site-data.tsx.
          </p>
        </footer>
      </div>
    </div>
  </PageLayout>
);
export default Lokaal;