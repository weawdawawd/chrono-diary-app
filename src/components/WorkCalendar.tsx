import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { calculateDurationMinutes } from "@/lib/types";
import type { Tables } from "@/integrations/supabase/types";

type WorkEntry = Tables<"work_entries">;

interface Props {
  entries: WorkEntry[];
  onDayClick?: (date: string) => void;
}

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Mon=0
}

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function WorkCalendar({ entries, onDayClick }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const hoursMap = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((e) => {
      let mins = calculateDurationMinutes(e.start_time, e.end_time);
      if (e.include_break && e.break_minutes) mins = Math.max(0, mins - e.break_minutes);
      map[e.date] = (map[e.date] || 0) + mins;
    });
    return map;
  }, [entries]);

  const selectedEntries = useMemo(() => {
    if (!selectedDay) return [];
    return entries.filter((e) => e.date === selectedDay);
  }, [entries, selectedDay]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
    setSelectedDay(null);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const getHeatColor = (mins: number) => {
    if (mins === 0) return "";
    if (mins < 240) return "bg-primary/15 text-primary";
    if (mins < 480) return "bg-primary/30 text-primary";
    return "bg-primary/50 text-primary-foreground";
  };

  return (
    <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-display font-bold text-sm">
          {MONTHS[month]} {year}
        </h3>
        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 px-2 pb-2 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = toDateStr(year, month, day);
          const mins = hoursMap[dateStr] || 0;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDay;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
              className={`
                relative flex flex-col items-center justify-center rounded-lg h-11 text-xs transition-all
                ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                ${isToday && !isSelected ? "ring-1 ring-accent" : ""}
                ${mins > 0 ? getHeatColor(mins) : "hover:bg-muted"}
              `}
            >
              <span className={`font-medium ${isToday ? "font-bold" : ""}`}>{day}</span>
              {mins > 0 && (
                <span className="text-[8px] leading-none opacity-80">{formatHours(mins)}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t"
          >
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold">
                  {new Date(selectedDay + "T00:00").toLocaleDateString("de-DE", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h4>
                <div className="flex items-center gap-1">
                  {onDayClick && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDayClick(selectedDay)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setSelectedDay(null)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {selectedEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Keine Einträge an diesem Tag.</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedEntries.map((entry) => {
                    let mins = calculateDurationMinutes(entry.start_time, entry.end_time);
                    if (entry.include_break && entry.break_minutes) mins -= entry.break_minutes;
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-xs"
                      >
                        <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="font-medium">
                          {entry.start_time.slice(0, 5)}–{entry.end_time.slice(0, 5)}
                        </span>
                        <span className="text-muted-foreground">({formatHours(Math.max(0, mins))})</span>
                        <span className="truncate flex-1 text-muted-foreground">
                          {entry.description}
                        </span>
                        {entry.location && (
                          <span className="text-muted-foreground shrink-0">📍 {entry.location}</span>
                        )}
                      </div>
                    );
                  })}
                  <div className="text-xs font-medium text-right text-primary pt-1">
                    Gesamt: {formatHours(hoursMap[selectedDay] || 0)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
