import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Siren, Navigation } from "lucide-react";

type NearbyAlert = {
  id: string;
  user_id: string;
  display_name: string;
  lat: number;
  lng: number;
  message: string | null;
  distance_m: number;
  created_at: string;
};

/**
 * Zeigt SOS-Alarme von Kollegen in 1 km Umkreis. Position wird aus dem
 * letzten Geo-Fix geholt (während aktiver Schicht ohnehin verfügbar).
 */
export default function SosBanner({ userId }: { userId: string }) {
  const [alerts, setAlerts] = useState<NearbyAlert[]>([]);

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    const check = async () => {
      if (!("geolocation" in navigator)) return;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { data, error } = await supabase.rpc("get_nearby_active_sos", {
            _lat: pos.coords.latitude,
            _lng: pos.coords.longitude,
          });
          if (cancelled) return;
          if (error) {
            console.error("[sos-banner] rpc error", error);
            return;
          }
          // Eigene Alarme rausfiltern
          setAlerts(((data ?? []) as NearbyAlert[]).filter((a) => a.user_id !== userId));
        },
        () => { /* still try realtime */ },
        { enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: 10_000 }
      );
    };

    check();
    intervalId = window.setInterval(check, 60_000);

    const channel = supabase
      .channel("sos-alerts-employee")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sos_alerts" },
        () => check()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sos_alerts" },
        () => check()
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <Alert key={a.id} className="border-destructive bg-destructive/10">
          <Siren className="w-4 h-4 text-destructive" />
          <AlertTitle className="text-destructive font-bold">
            NOTRUF von {a.display_name} · {Math.round(a.distance_m)} m
          </AlertTitle>
          <AlertDescription className="space-y-2">
            {a.message && <p className="text-sm">{a.message}</p>}
            <div className="flex gap-2">
              <Button size="sm" asChild>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation className="w-3.5 h-3.5 mr-1" />
                  Route
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
