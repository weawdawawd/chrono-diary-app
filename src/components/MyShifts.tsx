import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { CalendarClock, MapPin, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

type Shift = {
  id: string; date: string; start_time: string; end_time: string; location: string;
};

export default function MyShifts({ userId }: { userId: string }) {
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("shifts")
        .select("id, date, start_time, end_time, location")
        .eq("employee_user_id", userId)
        .gte("date", today)
        .order("date").order("start_time");
      setShifts((data ?? []) as Shift[]);
    })();
  }, [userId]);

  if (shifts.length === 0) return null;

  const isActive = (s: Shift) => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (s.date !== today) return false;
    const t = now.toTimeString().slice(0, 8);
    return s.start_time <= t && s.end_time >= t;
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarClock className="w-5 h-5 text-primary" />
        <h2 className="font-display font-semibold">Meine Schichten</h2>
      </div>
      <div className="space-y-1.5">
        {shifts.map((s) => {
          const active = isActive(s);
          return (
            <div key={s.id} className={`p-2.5 rounded-lg space-y-1 ${active ? "bg-primary/10 border border-primary/30" : "bg-muted/40"}`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                {format(parseISO(s.date), "EEE, d. MMM", { locale: de })} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                {active && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">LIVE</span>}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" /> {s.location}
              </div>
              {active && (
                <p className="text-[11px] text-muted-foreground italic">
                  Dein Standort wird während dieser Schicht an deinen Admin gesendet.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
