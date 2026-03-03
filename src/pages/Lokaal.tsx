import PageLayout from "@/components/PageLayout";
import BackButton from "@/components/BackButton";
import { lokaalBlocks, LokaalBlock, foodCategories, FoodCategory } from "@/data/site-data";

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

const FoodCard = ({ category }: { category: FoodCategory }) => (
  <article className="bg-card border border-border hover:border-primary transition-colors p-4 sm:p-6">
    <h3 className="text-primary text-glow font-bold text-lg mb-4 flex items-center gap-2">
      <span>{category.emoji}</span>
      {category.title}
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-primary/50">
            <th className="text-left text-primary text-glow font-bold py-3 pr-4">Item</th>
            <th className="text-right text-primary text-glow font-bold py-3 px-4">Non-Member</th>
            <th className="text-right text-primary text-glow font-bold py-3 pl-4">Member</th>
          </tr>
        </thead>
        <tbody>
          {category.items.map((item) => (
            <tr
              key={item.id}
              className={`border-b border-border/30 last:border-0 hover:bg-primary/5 transition-colors ${!item.available ? 'opacity-50' : ''}`}
            >
              <td className="py-3 pr-4 text-foreground font-medium">
                {item.name}
                {!item.available && (
                  <span className="ml-2 text-xs text-yellow-400 text-glow">(Tijdelijk niet beschikbaar)</span>
                )}
              </td>
              <td className="py-3 px-4 text-right text-muted-foreground">{item.priceNonMember}</td>
              <td className="py-3 pl-4 text-right text-primary text-glow font-bold">{item.priceMember}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

        {/* Food & Drinks Grid */}
        <div className="mt-8 space-y-4">
          <h2 className="text-xl text-primary text-glow font-bold">
            <span className="mr-2">🍕</span>
            Food & Drinks
          </h2>
          {foodCategories.map((category) => (
            <FoodCard key={category.id} category={category} />
          ))}
        </div>
        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary"></span> 
          </p>
        </footer>
      </div>
    </div>
  </PageLayout>
);
export default Lokaal;