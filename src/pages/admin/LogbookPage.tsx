import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookText, Search, MapPin, ArrowLeft, ChevronRight } from "lucide-react";
import GuardLog from "@/components/GuardLog";

type Obj = { name: string; entryCount?: number };

export default function LogbookPage() {
  const { user } = useAuth();
  const [objects, setObjects] = useState<Obj[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [globals, shiftRows, entries] = await Promise.all([
        supabase.from("global_locations" as any).select("name").order("name"),
        supabase.from("shifts").select("location"),
        supabase.from("guard_log_entries" as any).select("location_name"),
      ]);
      const counts = new Map<string, number>();
      (entries.data ?? []).forEach((e: any) => {
        counts.set(e.location_name, (counts.get(e.location_name) ?? 0) + 1);
      });
      const names = new Set<string>();
      (globals.data ?? []).forEach((g: any) => names.add(g.name));
      (shiftRows.data ?? []).forEach((s: any) => s.location && names.add(s.location));
      (entries.data ?? []).forEach((e: any) => names.add(e.location_name));
      const list = Array.from(names).sort().map((n) => ({ name: n, entryCount: counts.get(n) ?? 0 }));
      setObjects(list);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return objects;
    return objects.filter((o) => o.name.toLowerCase().includes(q));
  }, [objects, query]);

  if (selected && user) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="h-8 -ml-2" onClick={() => setSelected(null)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Zurück zur Suche
        </Button>
        <GuardLog locationName={selected} userId={user.id} canWrite isPlanner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookText className="w-5 h-5 text-primary" />
        <h1 className="font-display font-bold text-xl">Wachbuch</h1>
      </div>

      <Card className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Objekt suchen…"
            className="pl-9 h-10"
            autoFocus
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Tippe einen Objektnamen ein und öffne das Wachbuch dieses Objekts.
        </p>
      </Card>

      {loading ? (
        <p className="text-xs text-muted-foreground text-center py-6 animate-pulse">Lade…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {query ? `Kein Objekt passt zu „${query}“.` : "Noch keine Objekte angelegt."}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => (
            <button
              key={o.name}
              onClick={() => setSelected(o.name)}
              className="w-full text-left p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/50 transition-colors flex items-center gap-3"
            >
              <MapPin className="w-4 h-4 text-accent shrink-0" />
              <span className="flex-1 font-medium text-sm truncate">{o.name}</span>
              {!!o.entryCount && (
                <Badge variant="secondary" className="text-[10px]">{o.entryCount} Einträge</Badge>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
