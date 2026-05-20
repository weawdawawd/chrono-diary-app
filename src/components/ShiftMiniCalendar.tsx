import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ShiftLike = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  assignment_status: "pending" | "accepted" | "declined" | "cancelled";
  service_type?: "security" | "cleaning";
  location?: string;
};

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstWeekday(y: number, m: number) {
  const d = new Date(y, m, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function ShiftMiniCalendar({
  shifts,
  initialDate,
  compact = false,
}: {
  shifts: ShiftLike[];
  initialDate?: Date;
  compact?: boolean;
}) {
  const today = new Date();
  const start = initialDate ?? today;
  const [year, setYear] = useState(start.getFullYear());
  const [month, setMonth] = useState(start.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const m: Record<string, ShiftLike[]> = {};
    for (const s of shifts) (m[s.date] ||= []).push(s);
    return m;
  }, [shifts]);

  const dim = daysInMonth(year, month);
  const first = firstWeekday(year, month);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const prev = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); setSelected(null); };
  const next = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); setSelected(null); };

  const dotColor = (status: ShiftLike["assignment_status"]) =>
    status === "accepted" ? "bg-emerald-500" : status === "declined" ? "bg-destructive" : "bg-amber-500";

  const selectedShifts = selected ? byDate[selected] ?? [] : [];

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className={`flex items-center justify-between border-b ${compact ? "px-2 py-1.5" : "px-3 py-2"}`}>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prev}><ChevronLeft className="w-3.5 h-3.5" /></Button>
        <span className="text-xs font-semibold">{MONTHS[month]} {year}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={next}><ChevronRight className="w-3.5 h-3.5" /></Button>
      </div>
      <div className="grid grid-cols-7 px-1.5 pt-1.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[9px] font-medium text-muted-foreground py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 px-1.5 pb-1.5 gap-0.5">
        {Array.from({ length: first }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: dim }).map((_, i) => {
          const day = i + 1;
          const dStr = toDateStr(year, month, day);
          const sh = byDate[dStr] ?? [];
          const isToday = dStr === todayStr;
          const isSelected = dStr === selected;
          // Day background color follows the "best" status
          const hasAccepted = sh.some((s) => s.assignment_status === "accepted");
          const hasPending = sh.some((s) => s.assignment_status === "pending");
          const hasDeclined = sh.some((s) => s.assignment_status === "declined");
          const bg = hasAccepted
            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
            : hasPending
            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
            : hasDeclined
            ? "bg-destructive/15 text-destructive"
            : "";
          return (
            <button
              key={day}
              onClick={() => setSelected(isSelected ? null : dStr)}
              className={`relative flex flex-col items-center justify-center rounded h-9 text-[11px] transition-all
                ${bg || "hover:bg-muted"}
                ${isToday ? "ring-1 ring-primary" : ""}
                ${isSelected ? "ring-2 ring-accent" : ""}
              `}
            >
              <span className={`font-medium ${isToday ? "font-bold" : ""}`}>{day}</span>
              {sh.length > 0 && (
                <div className="absolute bottom-0.5 flex gap-0.5">
                  {sh.slice(0, 3).map((s, idx) => (
                    <span key={idx} className={`w-1 h-1 rounded-full ${dotColor(s.assignment_status)}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {selected && selectedShifts.length > 0 && (
        <div className="border-t p-2 space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium">
            {new Date(selected + "T00:00").toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          {selectedShifts.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 text-[11px]">
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor(s.assignment_status)}`} />
              <span className="font-medium">{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</span>
              {s.service_type && (
                <span className="text-muted-foreground">{s.service_type === "cleaning" ? "🧹" : "🛡️"}</span>
              )}
              {s.location && <span className="text-muted-foreground truncate">· {s.location}</span>}
            </div>
          ))}
        </div>
      )}
      <div className="border-t px-2 py-1.5 flex items-center gap-3 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Besetzt</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Offen</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-destructive" />Abgelehnt</span>
      </div>
    </div>
  );
}
