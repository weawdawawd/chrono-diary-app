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
};

const PING_INTERVAL_MS = 15 * 60_000; // 15 Minuten

/**
 * Sendet GPS-Pings an shift_locations alle 15 Minuten, solange der Nutzer
 * innerhalb einer aktiven Schicht ist UND Standort-Freigabe erteilt hat.
 *
 * - Web/PWA: `watchPosition` hält die letzte Position aktuell solange der Tab läuft.
 * - Native (Capacitor iOS/Android): `@capacitor-community/background-geolocation`
 *   sendet Standorte auch bei geschlossenem App-Fenster.
 */
export function useLiveLocationDuringShift(userId: string | undefined) {
  const intervalRef = useRef<number | null>(null);
  const watchRef = useRef<number | null>(null);
  const nativeWatchIdRef = useRef<string | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);
  const activeShiftIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const native = isNative();
    if (!native && !("geolocation" in navigator)) return;

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

    const insertPing = async (
      shiftId: string,
      pos: { lat: number; lng: number; accuracy: number }
    ) => {
      const { error } = await supabase.from("shift_locations" as any).insert({
        shift_id: shiftId,
        user_id: userId,
        lat: pos.lat,
        lng: pos.lng,
        accuracy: pos.accuracy,
      });
      if (error) console.error("[shift-location] ping insert failed", error);
      else
        console.info("[shift-location] ping sent", {
          shiftId,
          lat: pos.lat,
          lng: pos.lng,
          native,
        });
    };

    const sendPing = (shiftId: string) => {
      if (lastPosRef.current) {
        insertPing(shiftId, lastPosRef.current);
        return;
      }
      if (native) return; // Native: warten auf nächsten Watcher-Tick
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
          // Beim ersten nativen Fix auch sofort senden
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
          "id, date, start_time, end_time, requires_location, location_consent_at, location_consent_declined"
        )
        .eq("employee_user_id", userId);
      if (cancelled) return;
      const active = findActiveShift((data ?? []) as Shift[]);

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
