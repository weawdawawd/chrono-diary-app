import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type Shift = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  requires_location: boolean | null;
  location_consent_at: string | null;
  location_consent_declined: boolean | null;
};

/**
 * Sends GPS pings to shift_locations every 60s while the user is inside an
 * active shift window AND has accepted location consent. If the shift does
 * not require location and the user has not consented, no pings are sent.
 */
export function useLiveLocationDuringShift(userId: string | undefined) {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    if (!("geolocation" in navigator)) return;

    let cancelled = false;

    const findActiveShift = (shifts: Shift[]): Shift | null => {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const t = now.toTimeString().slice(0, 8);
      return (
        shifts.find(
          (s) => s.date === today && s.start_time <= t && s.end_time >= t
        ) ?? null
      );
    };

    const sendPing = (shiftId: string) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await supabase.from("shift_locations" as any).insert({
            shift_id: shiftId,
            user_id: userId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 }
      );
    };

    const tick = async () => {
      const { data } = await supabase
        .from("shifts")
        .select(
          "id, date, start_time, end_time, requires_location, location_consent_at, location_consent_declined"
        )
        .eq("employee_user_id", userId);
      if (cancelled) return;
      const active = findActiveShift((data ?? []) as Shift[]);
      if (!active) return;
      // Only send if consent is granted
      if (!active.location_consent_at || active.location_consent_declined)
        return;
      sendPing(active.id);
    };

    tick();
    intervalRef.current = window.setInterval(tick, 60_000);

    return () => {
      cancelled = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [userId]);
}
