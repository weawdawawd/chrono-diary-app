import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarClock, MapPin, Clock, Shield, ShieldAlert, ShieldCheck, Navigation, AlertTriangle, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import SosButton from "@/components/SosButton";

type Shift = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  geofence_radius_m: number | null;
  requires_location: boolean;
  location_consent_at: string | null;
  location_consent_declined: boolean;
  service_type: "security" | "cleaning";
  assignment_status: "pending" | "accepted" | "declined" | "cancelled";
};

// Haversine in metres
function distanceM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function MyShifts({ userId, mode = "all" }: { userId: string; mode?: "all" | "today-consent" }) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [outsideMeters, setOutsideMeters] = useState<number | null>(null);
  const outsideAlertedRef = useRef(false);

  const fetchShifts = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("shifts")
      .select(
        "id, date, start_time, end_time, location, address, lat, lng, geofence_radius_m, requires_location, location_consent_at, location_consent_declined, service_type, assignment_status"
      )
      .eq("employee_user_id", userId)
      .gte("date", today)
      .order("date")
      .order("start_time");
    setShifts((data ?? []) as Shift[]);
  }, [userId]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const isActive = (s: Shift) => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (s.date !== today) return false;
    const t = now.toTimeString().slice(0, 8);
    return s.start_time <= t && s.end_time >= t;
  };

  const activeShift = shifts.find(
    (s) => isActive(s) && s.location_consent_at && !s.location_consent_declined
  );

  // Geofence-Überwachung während aktiver Schicht
  useEffect(() => {
    if (!activeShift || activeShift.lat == null || activeShift.lng == null || !activeShift.geofence_radius_m) {
      setOutsideMeters(null);
      outsideAlertedRef.current = false;
      return;
    }
    if (!("geolocation" in navigator)) return;

    const check = (pos: GeolocationPosition) => {
      const d = distanceM(
        pos.coords.latitude, pos.coords.longitude,
        activeShift.lat!, activeShift.lng!
      );
      const radius = activeShift.geofence_radius_m!;
      if (d > radius) {
        const over = Math.round(d - radius);
        setOutsideMeters(over);
        if (!outsideAlertedRef.current) {
          outsideAlertedRef.current = true;
          toast.warning("Geofence verlassen", {
            description: `Du bist ${over} m außerhalb des Einsatzorts „${activeShift.location}“.`,
            duration: 10000,
          });
        }
      } else {
        if (outsideAlertedRef.current) {
          toast.success("Wieder im Einsatzbereich");
        }
        setOutsideMeters(null);
        outsideAlertedRef.current = false;
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      check,
      (err) => console.warn("[geofence] watch error", err),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 30_000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeShift?.id, activeShift?.lat, activeShift?.lng, activeShift?.geofence_radius_m]);

  const accept = async (s: Shift) => {
    setBusy(s.id);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!("geolocation" in navigator)) return reject(new Error("NO_GPS"));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 15_000,
        });
      });
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from("shifts")
        .update({
          location_consent_at: nowIso,
          location_consent_declined: false,
          start_location_lat: pos.coords.latitude,
          start_location_lng: pos.coords.longitude,
          start_location_at: nowIso,
        })
        .eq("id", s.id);
      if (error) throw error;
      const { error: insErr } = await supabase.from("shift_locations" as any).insert({
        shift_id: s.id,
        user_id: userId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
      if (insErr) console.error("[shift-location] initial ping insert failed", insErr);
      toast.success("Standort-Freigabe aktiv – Live-Übertragung läuft");
      fetchShifts();
    } catch (err: any) {
      if (err?.code === 1 || /denied/i.test(err?.message ?? "")) {
        toast.error("Standort blockiert", {
          description: "Bitte erlaube den Standortzugriff in den Browser-Einstellungen.",
          duration: 8000,
        });
      } else if (err?.code === 3) {
        toast.error("GPS-Timeout – bitte erneut versuchen");
      } else if (err?.message === "NO_GPS") {
        toast.error("Dieses Gerät unterstützt kein GPS");
      } else {
        toast.error(err?.message || "Standort-Zugriff fehlgeschlagen");
      }
    } finally {
      setBusy(null);
    }
  };

  const decline = async (s: Shift) => {
    setBusy(s.id);
    try {
      const { error } = await supabase
        .from("shifts")
        .update({ location_consent_declined: true, location_consent_at: null })
        .eq("id", s.id);
      if (error) throw error;
      toast.warning("Stunden werden für diese Schicht nicht angerechnet");
      fetchShifts();
    } finally {
      setBusy(null);
    }
  };

  const respondAssignment = async (s: Shift, status: "accepted" | "declined") => {
    setBusy(s.id);
    try {
      const { error } = await supabase
        .from("shifts")
        .update({ assignment_status: status, responded_at: new Date().toISOString() })
        .eq("id", s.id);
      if (error) throw error;
      toast.success(status === "accepted" ? "Schicht angenommen" : "Schicht abgelehnt");
      fetchShifts();
    } catch (err: any) {
      toast.error(err.message || "Fehler");
    } finally {
      setBusy(null);
    }
  };

  if (shifts.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);

  // "today-consent" mode: nur Heute-Schichten mit ausstehender Standort-Freigabe anzeigen
  if (mode === "today-consent") {
    const todayConsentShifts = shifts.filter(
      (s) => s.date === today && s.requires_location && !s.location_consent_at && !s.location_consent_declined
    );
    if (todayConsentShifts.length === 0 && !activeShift && outsideMeters === null) return null;
    return (
      <div className="space-y-3">
        {activeShift && <SosButton userId={userId} activeShiftId={activeShift.id} />}
        {outsideMeters !== null && (
          <Alert className="border-amber-500 bg-amber-500/10">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-sm">
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                Geofence verlassen – {outsideMeters} m außerhalb.
              </span>{" "}
              Bitte zurück zum Einsatzort.
            </AlertDescription>
          </Alert>
        )}
        {todayConsentShifts.map((s) => (
          <Alert key={s.id} className="border-amber-500/60 bg-amber-500/10">
            <Shield className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-sm space-y-2">
              <p>
                <span className="font-semibold">Heute {s.start_time.slice(0,5)}–{s.end_time.slice(0,5)} · {s.location}:</span>{" "}
                Standort-Freigabe erforderlich, sonst werden die Stunden nicht angerechnet.
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="h-8" disabled={busy === s.id} onClick={() => accept(s)}>
                  Standort freigeben
                </Button>
                <Button size="sm" variant="outline" className="h-8" disabled={busy === s.id} onClick={() => decline(s)}>
                  Ablehnen
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeShift && <SosButton userId={userId} activeShiftId={activeShift.id} />}

      {outsideMeters !== null && (
        <Alert className="border-amber-500 bg-amber-500/10">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-sm">
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              Geofence verlassen – {outsideMeters} m außerhalb.
            </span>{" "}
            Bitte zurück zum Einsatzort. Der Admin wurde über deinen Standort informiert.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold">Meine Schichten</h2>
        </div>
        <div className="space-y-2">
          {shifts.map((s) => {
            const active = isActive(s);
            const isToday = s.date === today;
            const needsConsent = isToday && s.requires_location && !s.location_consent_at && !s.location_consent_declined;
            const declined = s.requires_location && s.location_consent_declined;
            const accepted = s.requires_location && !!s.location_consent_at;

            return (
              <div
                key={s.id}
                className={`p-3 rounded-lg space-y-1.5 border-l-4 ${
                  s.assignment_status === "accepted"
                    ? "border-l-emerald-500"
                    : s.assignment_status === "declined"
                    ? "border-l-destructive opacity-70"
                    : s.assignment_status === "cancelled"
                    ? "border-l-muted-foreground opacity-60"
                    : "border-l-amber-500"
                } ${active ? "bg-primary/10 border-y border-r border-primary/30" : "bg-muted/40"}`}
              >
                <div className="flex items-center gap-2 flex-wrap text-sm font-medium">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/60 font-semibold uppercase tracking-wide">
                    {s.service_type === "cleaning" ? "🧹 Reinigung" : "🛡️ Security"}
                  </span>
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {format(parseISO(s.date), "EEE, d. MMM", { locale: de })} ·{" "}
                  {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                  {active && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                      LIVE
                    </span>
                  )}
                </div>
                {s.assignment_status === "cancelled" && (
                  <Alert className="border-muted-foreground/40 bg-muted/60 p-2.5">
                    <AlertDescription className="text-xs font-medium flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      Diese Schicht wurde vom Admin storniert.
                    </AlertDescription>
                  </Alert>
                )}
                {s.assignment_status === "pending" && (
                  <Alert className="border-amber-500/60 bg-amber-500/10 p-2.5">
                    <AlertDescription className="text-xs space-y-2">
                      <p className="font-medium flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                        Kannst du diese Schicht übernehmen?
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs flex-1" disabled={busy === s.id} onClick={() => respondAssignment(s, "accepted")}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Annehmen
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs flex-1" disabled={busy === s.id} onClick={() => respondAssignment(s, "declined")}>
                          <XCircle className="w-3 h-3 mr-1" /> Ablehnen
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                {s.assignment_status === "accepted" && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Angenommen
                  </span>
                )}
                {s.assignment_status === "declined" && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-semibold">
                    <XCircle className="w-3 h-3" /> Abgelehnt
                  </span>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {s.location}
                </div>
                {s.address && (
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-muted-foreground pl-5">{s.address}</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline shrink-0"
                    >
                      <Navigation className="w-3 h-3" /> Route
                    </a>
                  </div>
                )}

                {s.requires_location && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {accepted && (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <ShieldCheck className="w-3 h-3" /> Standort freigegeben
                      </span>
                    )}
                    {declined && (
                      <span className="flex items-center gap-1 text-destructive">
                        <ShieldAlert className="w-3 h-3" /> Abgelehnt – Stunden zählen nicht
                      </span>
                    )}
                    {needsConsent && (
                      <span className="flex items-center gap-1 text-amber-500">
                        <Shield className="w-3 h-3" /> Freigabe erforderlich
                      </span>
                    )}
                  </div>
                )}

                {needsConsent && (
                  <Alert className="mt-2 p-2.5">
                    <AlertDescription className="text-xs space-y-2">
                      <p>
                        Diese Schicht erfordert Standort-Freigabe. Ohne Freigabe werden die Stunden nicht angerechnet.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs" disabled={busy === s.id} onClick={() => accept(s)}>
                          Akzeptieren
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy === s.id} onClick={() => decline(s)}>
                          Ablehnen
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {active && accepted && (
                  <p className="text-[11px] text-muted-foreground italic">
                    Live-Standort wird an deinen Admin gesendet. App geöffnet lassen.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
