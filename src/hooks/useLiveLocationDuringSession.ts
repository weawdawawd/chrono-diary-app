import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  isNative,
  startNativeBackgroundLocation,
  stopNativeBackgroundLocation,
} from "@/lib/nativeLocation";

const PING_INTERVAL_MS = 15 * 60_000; // 15 Minuten

/**
 * Sendet GPS-Pings an shift_locations alle 15 Minuten, solange eine
 * Stempel-Schicht (shift_sessions, status='active') des Mitarbeiters läuft.
 * Funktioniert parallel zur geplanten Schicht-Live-Location.
 */
export function useLiveLocationDuringSession(userId: string | undefined) {
  const intervalRef = useRef<number | null>(null);
  const watchRef = useRef<number | null>(null);
  const nativeWatchIdRef = useRef<string | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);
  const activeSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const native = isNative();
    if (!native && !("geolocation" in navigator)) return;

    let cancelled = false;

    const insertPing = async (
      sessionId: string,
      pos: { lat: number; lng: number; accuracy: number }
    ) => {
      const { error } = await supabase.from("shift_locations" as any).insert({
        shift_session_id: sessionId,
        user_id: userId,
        lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy,
      });
      if (error) console.error("[session-loc] ping insert failed", error);
      else console.info("[session-loc] ping sent", { sessionId });
    };

    const sendPing = (sessionId: string) => {
      if (lastPosRef.current) { insertPing(sessionId, lastPosRef.current); return; }
      if (native) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => insertPing(sessionId, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
        (err) => console.error("[session-loc] geo failed", err),
        { enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000 }
      );
    };

    const startWatch = async () => {
      if (native) {
        if (nativeWatchIdRef.current) return;
        nativeWatchIdRef.current = await startNativeBackgroundLocation((loc) => {
          lastPosRef.current = loc;
          const sid = activeSessionRef.current;
          if (sid) insertPing(sid, loc);
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
        (err) => console.error("[session-loc] watch error", err),
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
        .from("shift_sessions" as any)
        .select("id, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();
      if (cancelled) return;
      const sessionId = (data as any)?.id as string | undefined;

      if (!sessionId) {
        activeSessionRef.current = null;
        await stopWatch();
        return;
      }

      if (activeSessionRef.current !== sessionId) {
        activeSessionRef.current = sessionId;
        await startWatch();
        sendPing(sessionId);
        return;
      }
      sendPing(sessionId);
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
