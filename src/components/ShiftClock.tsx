import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Square, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Session = {
  id: string;
  object_location: string;
  start_time: string;
  start_lat: number | null;
  start_lng: number | null;
  status: "active" | "finished";
};

const getPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation nicht verfügbar"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });

export default function ShiftClock({ userId }: { userId: string }) {
  const [active, setActive] = useState<Session | null>(null);
  const [objects, setObjects] = useState<string[]>([]);
  const [selectedObject, setSelectedObject] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadActive = async () => {
    const { data } = await supabase
      .from("shift_sessions" as any)
      .select("id, object_location, start_time, start_lat, start_lng, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    setActive((data as any) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    loadActive();
    supabase
      .from("global_locations")
      .select("name")
      .order("name")
      .then(({ data }) => setObjects((data ?? []).map((l: any) => l.name)));
  }, [userId]);

  const startShift = async () => {
    if (!selectedObject) {
      toast.error("Bitte Objekt auswählen");
      return;
    }
    setBusy(true);
    try {
      const pos = await getPosition().catch(() => null);
      const { data, error } = await supabase
        .from("shift_sessions" as any)
        .insert({
          user_id: userId,
          object_location: selectedObject,
          start_lat: pos?.coords.latitude ?? null,
          start_lng: pos?.coords.longitude ?? null,
          status: "active",
        })
        .select()
        .single();
      if (error) throw error;
      setActive(data as any);
      toast.success("Schicht gestartet");
    } catch (e: any) {
      toast.error(e.message || "Start fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const endShift = async () => {
    if (!active) return;
    setBusy(true);
    try {
      const pos = await getPosition().catch(() => null);
      const { error } = await supabase
        .from("shift_sessions" as any)
        .update({
          end_time: new Date().toISOString(),
          end_lat: pos?.coords.latitude ?? null,
          end_lng: pos?.coords.longitude ?? null,
          status: "finished",
        })
        .eq("id", active.id);
      if (error) throw error;
      setActive(null);
      toast.success("Schicht beendet");
    } catch (e: any) {
      toast.error(e.message || "Ende fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm">Schicht-Stempeluhr</h3>
        {active ? (
          <Badge className="bg-green-600 hover:bg-green-600">
            <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse" /> Schicht aktiv
          </Badge>
        ) : (
          <Badge variant="outline">Inaktiv</Badge>
        )}
      </div>

      {active ? (
        <>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> {active.object_location}
            </div>
            <div>Gestartet: {new Date(active.start_time).toLocaleString("de-DE")}</div>
            {active.start_lat != null && (
              <div className="font-mono text-[10px]">
                GPS: {active.start_lat.toFixed(5)}, {active.start_lng?.toFixed(5)}
              </div>
            )}
          </div>
          <Button onClick={endShift} disabled={busy} variant="destructive" className="w-full">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Square className="w-4 h-4 mr-2" />}
            Schicht beenden
          </Button>
        </>
      ) : (
        <>
          <Select value={selectedObject} onValueChange={setSelectedObject}>
            <SelectTrigger>
              <SelectValue placeholder="Objekt auswählen…" />
            </SelectTrigger>
            <SelectContent>
              {objects.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={startShift} disabled={busy || !selectedObject} className="w-full">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Schicht starten
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Beim Starten und Beenden wird dein GPS-Standort als Nachweis gespeichert.
          </p>
        </>
      )}
    </Card>
  );
}
