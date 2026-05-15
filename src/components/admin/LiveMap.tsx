import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { format } from "date-fns";

// Fix default icon paths (Vite/bundler)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type LivePoint = {
  user_id: string;
  shift_id: string;
  lat: number;
  lng: number;
  recorded_at: string;
  label: string;
  location: string;
  stale: boolean;
};

type WaitingShift = {
  shift_id: string;
  label: string;
  location: string;
  reason: string;
};

export default function LiveMap() {
  const [points, setPoints] = useState<LivePoint[]>([]);
  const [waiting, setWaiting] = useState<WaitingShift[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const t = new Date().toTimeString().slice(0, 8);

    const [{ data: shifts }, { data: locs }, { data: profiles }] = await Promise.all([
      supabase
        .from("shifts")
        .select(
          "id, employee_user_id, location, start_time, end_time, date, requires_location, location_consent_at, location_consent_declined"
        )
        .eq("date", today)
        .lte("start_time", t)
        .gte("end_time", t),
      supabase
        .from("shift_locations")
        .select("shift_id, user_id, lat, lng, recorded_at")
        .order("recorded_at", { ascending: false })
        .limit(500),
      supabase.from("profiles").select("user_id, email, display_name"),
    ]);

    const profileMap = new Map(
      (profiles ?? []).map((p: any) => [p.user_id, p.display_name || p.email || "?"])
    );
    const shiftMap = new Map((shifts ?? []).map((s: any) => [s.id, s]));

    // pick latest ping per shift
    const latest = new Map<string, any>();
    (locs ?? []).forEach((row: any) => {
      if (!shiftMap.has(row.shift_id)) return;
      if (!latest.has(row.shift_id)) latest.set(row.shift_id, row);
    });

    const tenMinAgo = Date.now() - 10 * 60_000;
    const result: LivePoint[] = Array.from(latest.values()).map((row: any) => {
      const shift = shiftMap.get(row.shift_id) as any;
      return {
        user_id: row.user_id,
        shift_id: row.shift_id,
        lat: row.lat,
        lng: row.lng,
        recorded_at: row.recorded_at,
        label: profileMap.get(row.user_id) || "Mitarbeiter",
        location: shift?.location || "",
        stale: new Date(row.recorded_at).getTime() < tenMinAgo,
      };
    });

    // Schichten mit Standort-Pflicht aber (noch) ohne Ping
    const wait: WaitingShift[] = (shifts ?? [])
      .filter((s: any) => !latest.has(s.id))
      .map((s: any) => {
        let reason = "Wartet auf Standort…";
        if (s.requires_location) {
          if (s.location_consent_declined) reason = "Mitarbeiter hat Standort abgelehnt";
          else if (!s.location_consent_at) reason = "Freigabe noch nicht akzeptiert";
          else reason = "Freigegeben – App des Mitarbeiters geschlossen?";
        } else {
          reason = "Schicht ohne Standort-Pflicht";
        }
        return {
          shift_id: s.id,
          label: profileMap.get(s.employee_user_id) || "Mitarbeiter",
          location: s.location,
          reason,
        };
      });

    setPoints(result);
    setWaiting(wait);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const center: [number, number] =
    points.length > 0 ? [points[0].lat, points[0].lng] : [51.1657, 10.4515];

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h2 className="font-display font-semibold text-sm">Live-Karte</h2>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {points.length} aktiv · auto-refresh 30s
        </span>
      </div>
      <div className="h-72 rounded-lg overflow-hidden border border-border">
        <MapContainer
          center={center}
          zoom={points.length > 0 ? 12 : 6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p) => (
            <Marker key={p.shift_id} position={[p.lat, p.lng]} opacity={p.stale ? 0.5 : 1}>
              <Popup>
                <div className="text-xs space-y-0.5">
                  <div className="font-semibold">{p.label}</div>
                  <div className="text-muted-foreground">{p.location}</div>
                  <div className={p.stale ? "text-amber-500" : "text-muted-foreground"}>
                    {p.stale ? "Zuletzt gesehen: " : ""}
                    {format(new Date(p.recorded_at), "HH:mm:ss")}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      {!loading && points.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Aktuell keine aktiven Live-Standorte.
        </p>
      )}
      {waiting.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-border">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Wartende Schichten
          </p>
          {waiting.map((w) => (
            <div key={w.shift_id} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-muted/40">
              <span className="truncate">
                <span className="font-medium">{w.label}</span>
                <span className="text-muted-foreground"> · {w.location}</span>
              </span>
              <span className="text-amber-500 ml-2 shrink-0">{w.reason}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
