import { BookOpen, FileText, Link as LinkIcon, ExternalLink } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import BackButton from "@/components/BackButton";
import { resources, Resource } from "@/data/site-data";

const categoryConfig = {
  exams: { icon: <FileText className="w-5 h-5" />, label: "Exam Resources" },
  courses: { icon: <BookOpen className="w-5 h-5" />, label: "Course Materials" },
  tools: { icon: <LinkIcon className="w-5 h-5" />, label: "Useful Tools" },
} as const;

const ResourceCard = ({ resource }: { resource: Resource }) => (
  <a
    href={resource.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group bg-card border border-border p-4 hover:border-primary hover:bg-secondary transition-colors block"
  >
    <div className="flex items-center justify-between">
      <h3 className="text-primary font-bold group-hover:text-glow">{resource.title}</h3>
      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </div>
    <p className="text-muted-foreground text-sm mt-2"># {resource.description}</p>
  </a>
);

const Resources = () => {
  const categories = ["exams", "courses", "tools"] as const;

  return (
    <PageLayout>
      <div className="py-8 sm:py-16 px-4">
        <div className="container-terminal">
          {/* Header */}
          <header className="mb-8">
            <BackButton />
            <h1 className="text-xl sm:text-2xl text-primary text-glow mt-4">
              <span className="text-muted-foreground">user@iswleuven:~$</span> cat ./resources
            </h1>
            <div className="h-px bg-border w-full mt-4" />
          </header>

          {/* Resources by category */}
          {categories.map((category) => {
            const items = resources.filter((r) => r.category === category);
            if (!items.length) return null;
            const { icon, label } = categoryConfig[category];

            return (
              <section key={category} className="mb-10">
                <h2 className="text-lg text-primary mb-4 flex items-center gap-2">
                  {icon}
                  <span className="text-muted-foreground">$</span> ./{label.toLowerCase().replace(" ", "_")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.map((r) => <ResourceCard key={r.id} resource={r} />)}
                </div>
              </section>
            );
          })}

          {/* Footer */}
          <footer className="mt-8 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">TIP:</span> Have a useful resource? Contact the PR-meester.
            </p>
          </footer>
        </div>
      </div>
    </PageLayout>
  );
};

export default Resources;
