import { Calendar, MapPin, Clock } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import BackButton from "@/components/BackButton";
import { events } from "@/data/site-data";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const Events = () => (
  <PageLayout>
    <div className="py-8 sm:py-16 px-4">
      <div className="container-terminal">
        {/* Header */}
        <header className="mb-8">
          <BackButton />
          <h1 className="text-xl sm:text-2xl text-primary text-glow mt-4">
            <span className="text-muted-foreground">user@iswleuven:~$</span> cat ./events
          </h1>
          <div className="h-px bg-border w-full mt-4" />
        </header>

        {/* Events list */}
        <div className="space-y-4">
          {events.map((event) => (
            <article key={event.id} className="bg-card border border-border hover:border-primary transition-colors p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-primary text-glow font-bold text-lg">{event.title}</h3>
                  <p className="text-muted-foreground text-sm mt-2"># {event.description}</p>
                </div>
                <div className="flex flex-col gap-1 text-xs sm:text-sm text-muted-foreground sm:text-right">
                  <span className="flex items-center gap-2 sm:justify-end">
                    <Calendar className="w-4 h-4 text-primary" />
                    {formatDate(event.date)}
                  </span>
                  <span className="flex items-center gap-2 sm:justify-end">
                    <Clock className="w-4 h-4 text-primary" />
                    {event.time}
                  </span>
                  <span className="flex items-center gap-2 sm:justify-end">
                    <MapPin className="w-4 h-4 text-primary" />
                    {event.location}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary">INFO:</span> {events.length} events loaded.
          </p>
        </footer>
      </div>
    </div>
  </PageLayout>
);

export default Events;
