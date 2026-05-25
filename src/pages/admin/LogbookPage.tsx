import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BookText } from "lucide-react";
import GuardLog from "@/components/GuardLog";

type Loc = { id: string; name: string };

export default function LogbookPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Loc[]>([]);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    (async () => {
      // Build object list from catalog + distinct shift locations
      const [globals, shiftRows] = await Promise.all([
        supabase.from("global_locations" as any).select("id, name").order("name"),
        supabase.from("shifts").select("location").order("location"),
      ]);
      const names = new Set<string>();
      (globals.data ?? []).forEach((g: any) => names.add(g.name));
      (shiftRows.data ?? []).forEach((s: any) => s.location && names.add(s.location));
      const list = Array.from(names).sort().map((n) => ({ id: n, name: n }));
      setLocations(list);
      if (list.length && !selected) setSelected(list[0].name);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookText className="w-5 h-5 text-primary" />
        <h1 className="font-display font-bold text-xl">Wachbuch</h1>
      </div>

      <Card className="p-4 space-y-2">
        <Label className="text-xs font-semibold">Objekt wählen</Label>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Objekt auswählen…" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {locations.length === 0 && (
          <p className="text-xs text-muted-foreground pt-2">Noch keine Objekte angelegt.</p>
        )}
      </Card>

      {selected && user && (
        <GuardLog locationName={selected} userId={user.id} canWrite isPlanner />
      )}
    </div>
  );
}
