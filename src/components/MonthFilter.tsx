import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Props {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  isAll: boolean;
}

export default function MonthFilter({ month, onPrev, onNext, onReset, isAll }: Props) {
  return (
    <div className="flex items-center justify-between bg-card border rounded-xl px-3 py-2 shadow-sm">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrev} aria-label="Vorheriger Monat">
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <button
        onClick={onReset}
        className="flex items-center gap-2 text-sm font-display font-semibold text-foreground hover:text-accent transition-colors"
        aria-label="Filter zurücksetzen — alle Einträge anzeigen"
      >
        <CalendarRange className="w-4 h-4" />
        {isAll ? "Alle Einträge" : format(month, "MMMM yyyy", { locale: de })}
      </button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNext} aria-label="Nächster Monat">
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
