import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type Shift = { id: string; date: string; start_time: string; end_time: string };

/**
 * Sends GPS pings to shift_locations every 2 minutes while the user
 * is currently inside one of their assigned shift windows.
 * Outside of shift hours, no location is collected.
 */
export function useLiveLocationDuringShift(userId: string | undefined) {
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const activeShiftRef = useRef<Shift | null>(null);

  useEffect(() => {
    if (!userId) return;
    if (!("geolocation" in navigator)) return;

    let cancelled = false;

    const findActiveShift = (shifts: Shift[]): Shift | null => {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const t = now.toTimeString().slice(0, 8);
      return shifts.find((s) => s.date === today && s.start_time <= t && s.end_time >= t) ?? null;
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
        .select("id, date, start_time, end_time")
        .eq("employee_user_id", userId);
      if (cancelled) return;
      const active = findActiveShift((data ?? []) as Shift[]);
      activeShiftRef.current = active;
      if (active) sendPing(active.id);
    };

    tick();
    intervalRef.current = window.setInterval(tick, 120_000);

    return () => {
      cancelled = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [userId]);
}
