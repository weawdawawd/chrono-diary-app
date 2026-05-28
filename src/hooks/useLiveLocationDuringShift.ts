import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  isNative,
  startNativeBackgroundLocation,
  stopNativeBackgroundLocation,
} from "@/lib/nativeLocation";

type Shift = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  requires_location: boolean | null;
  location_consent_at: string | null;
  location_consent_declined: boolean | null;
  end_location_at: string | null;
};

const PING_INTERVAL_MS = 15 * 60_000; // 15 Minuten

/**
 * Sendet GPS-Pings an shift_locations alle 15 Minuten, solange der Nutzer
 * innerhalb einer aktiven Schicht ist UND Standort-Freigabe erteilt hat.
 *
 * Zusätzlich: Wenn eine aktive Schicht endet (Übergang), wird der letzte
 * bekannte Standort einmalig als end_location_* gespeichert.
 */
export function useLiveLocationDuringShift(userId: string | undefined) {
  const intervalRef = useRef<number | null>(null);
  const watchRef = useRef<number | null>(null);
  const nativeWatchIdRef = useRef<string | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);
  const activeShiftIdRef = useRef<string | null>(null);
  const endSavedForShiftRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    const native = isNative();
    if (!native && !("geolocation" in navigator)) return;

    let cancelled = false;

    const findActiveShift = (shifts: Shift[]): Shift | null => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      return (
        shifts.find(
          (s) => s.date === today && s.start_time <= t && s.end_time >= t
        ) ?? null
      );
    };

    const insertPing = async (
      shiftId: string,
      pos: { lat: number; lng: number; accuracy: number }
    ) => {
      const { error } = await supabase.from("shift_locations" as any).insert({
        shift_id: shiftId, user_id: userId,
        lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy,
      });
      if (error) console.error("[shift-location] ping insert failed", error);
      else console.info("[shift-location] ping sent", { shiftId, native });
    };

    const saveEndLocation = async (shiftId: string) => {
      if (endSavedForShiftRef.current.has(shiftId)) return;
      const pos = lastPosRef.current;
      if (!pos) return;
      endSavedForShiftRef.current.add(shiftId);
      const { error } = await supabase
        .from("shifts")
        .update({
          end_location_lat: pos.lat,
          end_location_lng: pos.lng,
          end_location_at: new Date().toISOString(),
        })
        .eq("id", shiftId);
      if (error) {
        console.error("[shift-location] end-location save failed", error);
        endSavedForShiftRef.current.delete(shiftId);
      } else {
        console.info("[shift-location] end-location saved", shiftId);
      }
    };

    const sendPing = (shiftId: string) => {
      if (lastPosRef.current) {
        insertPing(shiftId, lastPosRef.current);
        return;
      }
      if (native) return;
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          insertPing(shiftId, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
        (err) => console.error("[shift-location] ping geolocation failed", err),
        { enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000 }
      );
    };

    const startWatch = async () => {
      if (native) {
        if (nativeWatchIdRef.current) return;
        nativeWatchIdRef.current = await startNativeBackgroundLocation((loc) => {
          lastPosRef.current = loc;
          const shiftId = activeShiftIdRef.current;
          if (shiftId) insertPing(shiftId, loc);
        });
        return;
      }
      if (watchRef.current != null) return;
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          lastPosRef.current = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
        },
        (err) => console.error("[shift-location] watchPosition error", err),
        { enableHighAccuracy: true, maximumAge: 60_000, timeout: 30_000 }
      );
    };

    const stopWatch = async () => {
      if (native) {
        await stopNativeBackgroundLocation(nativeWatchIdRef.current);
        nativeWatchIdRef.current = null;
        return;
      }
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
    };

    const tick = async () => {
      const { data } = await supabase
        .from("shifts")
        .select(
          "id, date, start_time, end_time, requires_location, location_consent_at, location_consent_declined, end_location_at"
        )
        .eq("employee_user_id", userId);
      if (cancelled) return;
      const shifts = (data ?? []) as Shift[];
      const active = findActiveShift(shifts);

      // Wenn vorher eine Schicht aktiv war und jetzt nicht mehr → End-Standort speichern
      const previousActiveId = activeShiftIdRef.current;
      if (previousActiveId && (!active || active.id !== previousActiveId)) {
        await saveEndLocation(previousActiveId);
      }

      if (!active || !active.location_consent_at || active.location_consent_declined) {
        activeShiftIdRef.current = null;
        await stopWatch();
        return;
      }

      if (activeShiftIdRef.current !== active.id) {
        activeShiftIdRef.current = active.id;
        await startWatch();
        sendPing(active.id);
        return;
      }
      sendPing(active.id);
    };

    tick();
    intervalRef.current = window.setInterval(tick, PING_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      stopWatch();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [userId]);
}
