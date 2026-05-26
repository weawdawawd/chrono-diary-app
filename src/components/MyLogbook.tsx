import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookText, ChevronRight, ArrowLeft, MapPin } from "lucide-react";
import GuardLog from "@/components/GuardLog";

interface Props {
  userId: string;
}

type Obj = { location: string; shiftId?: string; eligible: boolean };

export default function MyLogbook({ userId }: Props) {
  const [objects, setObjects] = useState<Obj[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Obj | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [shiftsRes, sessionsRes] = await Promise.all([
        supabase
          .from("shifts")
          .select("id, location, date, assignment_status")
          .eq("employee_user_id", userId)
          .eq("assignment_status", "accepted")
          .order("date", { ascending: false })
          .limit(200),
        supabase
          .from("shift_sessions" as any)
          .select("id, object_location, status")
          .eq("user_id", userId)
          .order("start_time", { ascending: false })
          .limit(100),
      ]);

      const map = new Map<string, Obj>();
      (shiftsRes.data ?? []).forEach((s: any) => {
        if (!map.has(s.location)) map.set(s.location, { location: s.location, shiftId: s.id, eligible: true });
      });
      (sessionsRes.data ?? []).forEach((ss: any) => {
        if (ss.object_location && !map.has(ss.object_location)) {
          map.set(ss.object_location, { location: ss.object_location, eligible: true });
        }
      });
      setObjects(Array.from(map.values()));
      setLoading(false);
    })();
  }, [userId]);

  if (selected) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" size="sm" className="h-8 -ml-2" onClick={() => setSelected(null)}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Zurück
        </Button>
        <GuardLog
          locationName={selected.location}
          shiftId={selected.shiftId}
          userId={userId}
          canWrite={selected.eligible}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BookText className="w-5 h-5 text-primary" />
        <h2 className="font-display font-semibold">Wachbuch</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Wähle ein Objekt, um deine Einträge zu sehen oder neue zu erfassen. Andere Mitarbeiter sehen deine Einträge nicht.
      </p>
      {loading ? (
        <p className="text-xs text-muted-foreground text-center py-6 animate-pulse">Lade…</p>
      ) : objects.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Noch keine Objekte. Du musst eine Schicht angenommen oder eingestempelt haben.
        </Card>
      ) : (
        <div className="space-y-2">
          {objects.map((o) => (
            <button
              key={o.location}
              onClick={() => setSelected(o)}
              className="w-full text-left p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/50 transition-colors flex items-center gap-3"
            >
              <MapPin className="w-4 h-4 text-accent shrink-0" />
              <span className="flex-1 font-medium text-sm truncate">{o.location}</span>
              <Badge variant="secondary" className="text-[10px]">Eintragen</Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
