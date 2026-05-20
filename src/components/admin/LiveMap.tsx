import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Siren } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Roter SOS-Icon
const sosIcon = L.divIcon({
  className: "",
  html: `<div style="background:#ef4444;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;box-shadow:0 0 0 6px rgba(239,68,68,.3);animation:pulse 1.5s infinite;">!</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

type LivePoint = {
  user_id: string; shift_id: string;
  lat: number; lng: number; recorded_at: string;
  label: string; location: string; stale: boolean;
  geofence?: { lat: number; lng: number; radius: number } | null;
};

type WaitingShift = {
  shift_id: string; label: string; location: string; reason: string;
};

type SosAlert = {
  id: string; user_id: string; lat: number; lng: number;
  message: string | null; created_at: string; display_name: string;
};

export default function LiveMap() {
  const [points, setPoints] = useState<LivePoint[]>([]);
  const [waiting, setWaiting] = useState<WaitingShift[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const t = new Date().toTimeString().slice(0, 8);

    const [{ data: shifts }, { data: locs }, { data: profiles }, { data: sos }] = await Promise.all([
      supabase
        .from("shifts")
        .select(
          "id, employee_user_id, location, address, lat, lng, geofence_radius_m, start_time, end_time, date, requires_location, location_consent_at, location_consent_declined"
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
      supabase
        .from("sos_alerts")
        .select("id, user_id, lat, lng, message, created_at")
        .is("resolved_at", null)
        .gte("created_at", new Date(Date.now() - 2 * 3600_000).toISOString())
        .order("created_at", { ascending: false }),
    ]);

    const profileMap = new Map(
      (profiles ?? []).map((p: any) => [p.user_id, p.display_name || p.email || "?"])
    );
    const shiftMap = new Map((shifts ?? []).map((s: any) => [s.id, s]));

    const latest = new Map<string, any>();
    (locs ?? []).forEach((row: any) => {
      if (!shiftMap.has(row.shift_id)) return;
      if (!latest.has(row.shift_id)) latest.set(row.shift_id, row);
    });

    const tenMinAgo = Date.now() - 10 * 60_000;
    const result: LivePoint[] = Array.from(latest.values()).map((row: any) => {
      const shift = shiftMap.get(row.shift_id) as any;
      return {
        user_id: row.user_id, shift_id: row.shift_id,
        lat: row.lat, lng: row.lng, recorded_at: row.recorded_at,
        label: profileMap.get(row.user_id) || "Mitarbeiter",
        location: shift?.location || "",
        stale: new Date(row.recorded_at).getTime() < tenMinAgo,
        geofence:
          shift?.lat != null && shift?.lng != null && shift?.geofence_radius_m > 0
            ? { lat: shift.lat, lng: shift.lng, radius: shift.geofence_radius_m }
            : null,
      };
    });

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
        return { shift_id: s.id, label: profileMap.get(s.employee_user_id) || "Mitarbeiter", location: s.location, reason };
      });

    const sosWithNames: SosAlert[] = (sos ?? []).map((a: any) => ({
      ...a,
      display_name: profileMap.get(a.user_id) || "Mitarbeiter",
    }));

    setPoints(result);
    setWaiting(wait);
    setSosAlerts(sosWithNames);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = window.setInterval(load, 30_000);
    const channel = supabase
      .channel("sos-alerts-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, () => load())
      .subscribe();
    return () => {
      window.clearInterval(id);
      supabase.removeChannel(channel);
    };
  }, []);

  const resolveSos = async (id: string) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("sos_alerts")
      .update({ resolved_at: new Date().toISOString(), resolved_by: u.user?.id })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Notruf als erledigt markiert"); load(); }
  };

  const center: [number, number] =
    sosAlerts.length > 0
      ? [sosAlerts[0].lat, sosAlerts[0].lng]
      : points.length > 0
      ? [points[0].lat, points[0].lng]
      : [51.1657, 10.4515];

  return (
    <Card className={`p-4 space-y-3 ${sosAlerts.length > 0 ? "border-destructive border-2" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {sosAlerts.length > 0 ? (
            <Siren className="w-4 h-4 text-destructive animate-pulse" />
          ) : (
            <MapPin className="w-4 h-4 text-primary" />
          )}
          <h2 className="font-display font-semibold text-sm">
            {sosAlerts.length > 0
              ? `${sosAlerts.length} aktiver SOS-Notruf!`
              : "Live-Karte"}
          </h2>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {points.length} aktiv · auto-refresh 30s
        </span>
      </div>
      <div className="h-72 rounded-lg overflow-hidden border border-border">
        <MapContainer
          center={center}
          zoom={sosAlerts.length > 0 || points.length > 0 ? 12 : 6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p) => (
            <div key={p.shift_id}>
              {p.geofence && (
                <Circle
                  center={[p.geofence.lat, p.geofence.lng]}
                  radius={p.geofence.radius}
                  pathOptions={{ color: "#3b82f6", fillOpacity: 0.1, weight: 1 }}
                />
              )}
              <Marker position={[p.lat, p.lng]} opacity={p.stale ? 0.5 : 1}>
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
            </div>
          ))}
          {sosAlerts.map((a) => (
            <Marker key={a.id} position={[a.lat, a.lng]} icon={sosIcon}>
              <Popup>
                <div className="text-xs space-y-1 min-w-[180px]">
                  <div className="font-bold text-destructive flex items-center gap-1">
                    <Siren className="w-3 h-3" /> SOS · {a.display_name}
                  </div>
                  {a.message && <div>{a.message}</div>}
                  <div className="text-muted-foreground">
                    {format(new Date(a.created_at), "HH:mm:ss")}
                  </div>
                  <div className="flex gap-1 pt-1">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}`}
                      target="_blank" rel="noreferrer"
                      className="text-primary underline"
                    >
                      Route
                    </a>
                    <button
                      onClick={() => resolveSos(a.id)}
                      className="ml-auto text-emerald-600 underline"
                    >
                      Erledigt
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {sosAlerts.length > 0 && (
        <div className="space-y-1.5">
          {sosAlerts.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 p-2 rounded bg-destructive/10 border border-destructive/40"
            >
              <Siren className="w-3.5 h-3.5 text-destructive shrink-0 animate-pulse" />
              <div className="text-xs flex-1 min-w-0">
                <div className="font-semibold truncate">{a.display_name}</div>
                {a.message && <div className="text-muted-foreground truncate">{a.message}</div>}
                <div className="text-[10px] text-muted-foreground">
                  {format(new Date(a.created_at), "HH:mm:ss")}
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-7" onClick={() => resolveSos(a.id)}>
                Erledigt
              </Button>
            </div>
          ))}
        </div>
      )}

      {!loading && points.length === 0 && sosAlerts.length === 0 && (
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
