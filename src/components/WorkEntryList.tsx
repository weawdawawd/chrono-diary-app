import { WorkEntry, calculateDuration } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Calendar, Trash2, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

interface Props {
  entries: WorkEntry[];
  onDelete: (id: string) => void;
}

export default function WorkEntryList({ entries, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="font-display text-lg">Noch keine Einträge</p>
        <p className="text-sm mt-1">Füge deinen ersten Arbeitseintrag hinzu.</p>
      </div>
    );
  }

  // Group by date
  const grouped = entries.reduce<Record<string, WorkEntry[]>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-accent" />
            <h3 className="font-display font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              {format(parseISO(date), "EEEE, d. MMMM yyyy", { locale: de })}
            </h3>
          </div>
          <div className="space-y-2">
            {grouped[date].map((entry, i) => (
              <Card
                key={entry.id}
                className="group bg-card hover:shadow-md transition-all"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {entry.startTime} – {entry.endTime}
                          <span className="text-muted-foreground font-normal">
                            ({calculateDuration(entry.startTime, entry.endTime)})
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 text-accent" />
                          {entry.location}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                        {entry.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive shrink-0"
                      onClick={() => onDelete(entry.id)}
                      aria-label="Eintrag löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
