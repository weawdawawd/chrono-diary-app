import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Clock, User as UserIcon, ExternalLink } from "lucide-react";

type Session = {
  id: string;
  user_id: string;
  object_location: string;
  start_time: string;
  end_time: string | null;
  start_lat: number | null;
  start_lng: number | null;
  end_lat: number | null;
  end_lng: number | null;
  status: "active" | "finished";
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string; email: string }>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("shift_sessions" as any)
      .select("*")
      .order("start_time", { ascending: false })
      .limit(200);
    const list = (data ?? []) as any as Session[];
    setSessions(list);

    const ids = Array.from(new Set(list.map((s) => s.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", ids);
      const map: Record<string, { name: string; email: string }> = {};
      (profs ?? []).forEach((p: any) => {
        map[p.user_id] = { name: p.display_name || p.email || "—", email: p.email || "" };
      });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  const active = sessions.filter((s) => s.status === "active");
  const finished = sessions.filter((s) => s.status === "finished");

  const Row = ({ s }: { s: Session }) => {
    const p = profiles[s.user_id];
    const dur = s.end_time
      ? Math.round((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000)
      : Math.round((Date.now() - new Date(s.start_time).getTime()) / 60000);
    return (
      <Card className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <UserIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{p?.name || s.user_id.slice(0, 8)}</div>
              <div className="text-[11px] text-muted-foreground truncate">{p?.email}</div>
            </div>
          </div>
          {s.status === "active" ? (
            <Badge className="bg-green-600 hover:bg-green-600">
              <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse" /> LIVE
            </Badge>
          ) : (
            <Badge variant="secondary">Beendet</Badge>
          )}
        </div>

        <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="w-3 h-3" /> {s.object_location}
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-muted/40 rounded p-2">
            <div className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Start</div>
            <div>{new Date(s.start_time).toLocaleString("de-DE")}</div>
            {s.start_lat != null && (
              <a
                href={`https://www.google.com/maps?q=${s.start_lat},${s.start_lng}`}
                target="_blank" rel="noreferrer"
                className="text-primary inline-flex items-center gap-1 font-mono"
              >
                {s.start_lat.toFixed(5)}, {s.start_lng?.toFixed(5)} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          <div className="bg-muted/40 rounded p-2">
            <div className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Ende</div>
            <div>{s.end_time ? new Date(s.end_time).toLocaleString("de-DE") : "—"}</div>
            {s.end_lat != null && (
              <a
                href={`https://www.google.com/maps?q=${s.end_lat},${s.end_lng}`}
                target="_blank" rel="noreferrer"
                className="text-primary inline-flex items-center gap-1 font-mono"
              >
                {s.end_lat.toFixed(5)}, {s.end_lng?.toFixed(5)} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground">
          Dauer: {Math.floor(dur / 60)}h {dur % 60}min
        </div>
      </Card>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Schicht-Sessions</h1>
        <p className="text-sm text-muted-foreground">Start/Ende mit GPS-Nachweis. Auto-Refresh alle 30s.</p>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Aktiv ({active.length})</TabsTrigger>
          <TabsTrigger value="finished">Beendet ({finished.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-2 mt-3">
          {loading ? <p className="text-sm text-muted-foreground">Lade…</p>
            : active.length === 0 ? <p className="text-sm text-muted-foreground">Keine aktiven Sessions.</p>
            : active.map((s) => <Row key={s.id} s={s} />)}
        </TabsContent>
        <TabsContent value="finished" className="space-y-2 mt-3">
          {finished.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine beendeten Sessions.</p>
            : finished.map((s) => <Row key={s.id} s={s} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
