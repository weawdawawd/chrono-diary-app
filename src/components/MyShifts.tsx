import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarClock, MapPin, Clock, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

type Shift = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  requires_location: boolean;
  location_consent_at: string | null;
  location_consent_declined: boolean;
};

export default function MyShifts({ userId }: { userId: string }) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchShifts = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("shifts")
      .select(
        "id, date, start_time, end_time, location, requires_location, location_consent_at, location_consent_declined"
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

  const accept = async (s: Shift) => {
    setBusy(s.id);
    try {
      // Trigger native browser permission prompt up-front
      await new Promise<void>((resolve, reject) => {
        if (!("geolocation" in navigator)) return reject(new Error("Kein GPS verfügbar"));
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 15_000 }
        );
      });
      const { error } = await supabase
        .from("shifts")
        .update({
          location_consent_at: new Date().toISOString(),
          location_consent_declined: false,
        })
        .eq("id", s.id);
      if (error) throw error;
      toast.success("Standort-Freigabe aktiv");
      fetchShifts();
    } catch (err: any) {
      toast.error(err.message || "Standort-Zugriff verweigert");
    } finally {
      setBusy(null);
    }
  };

  const decline = async (s: Shift) => {
    setBusy(s.id);
    try {
      const { error } = await supabase
        .from("shifts")
        .update({
          location_consent_declined: true,
          location_consent_at: null,
        })
        .eq("id", s.id);
      if (error) throw error;
      toast.warning("Stunden werden für diese Schicht nicht angerechnet");
      fetchShifts();
    } finally {
      setBusy(null);
    }
  };

  if (shifts.length === 0) return null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarClock className="w-5 h-5 text-primary" />
        <h2 className="font-display font-semibold">Meine Schichten</h2>
      </div>
      <div className="space-y-2">
        {shifts.map((s) => {
          const active = isActive(s);
          const needsConsent =
            s.requires_location && !s.location_consent_at && !s.location_consent_declined;
          const declined = s.requires_location && s.location_consent_declined;
          const accepted = s.requires_location && !!s.location_consent_at;

          return (
            <div
              key={s.id}
              className={`p-3 rounded-lg space-y-1.5 ${
                active ? "bg-primary/10 border border-primary/30" : "bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                {format(parseISO(s.date), "EEE, d. MMM", { locale: de })} ·{" "}
                {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                {active && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" /> {s.location}
              </div>

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
                      Diese Schicht erfordert Standort-Freigabe. Ohne Freigabe werden die Stunden
                      nicht angerechnet.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={busy === s.id}
                        onClick={() => accept(s)}
                      >
                        Akzeptieren
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={busy === s.id}
                        onClick={() => decline(s)}
                      >
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
  );
}
