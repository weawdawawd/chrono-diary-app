import { supabase } from "@/integrations/supabase/client";

const KEY = "patrol_offline_scans_v2";
const LEGACY_KEY = "patrol_offline_scans_v1";

export type QueuedScan = {
  payload: string | null;
  nfcId: string | null;
  lat: number | null;
  lng: number | null;
  sessionId: string | null;
  routeId: string | null;
  scannedAt: string;
};

const read = (): QueuedScan[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

const write = (rows: QueuedScan[]) => localStorage.setItem(KEY, JSON.stringify(rows));

export const queueScan = (scan: QueuedScan) => {
  const rows = read();
  rows.push(scan);
  write(rows);
};

export const queueCount = () => read().length;

export const flushQueue = async (): Promise<number> => {
  // Drop any legacy (insecure) queued rows from previous client versions.
  try { localStorage.removeItem(LEGACY_KEY); } catch {}
  const rows = read();
  if (!rows.length) return 0;
  const remaining: QueuedScan[] = [];
  let sent = 0;
  for (const r of rows) {
    const { error } = await supabase.rpc("record_patrol_scan", {
      _payload: r.payload,
      _nfc_id: r.nfcId,
      _lat: r.lat,
      _lng: r.lng,
      _session_id: r.sessionId,
      _route_id: r.routeId,
      _scanned_at: r.scannedAt,
    } as any);
    if (error) {
      // permanent errors (invalid signature etc.): drop. transient: keep.
      if (/(invalid|signature|unknown|forbidden|not authenticated)/i.test(error.message)) {
        console.warn("[patrol-offline] dropping invalid queued scan", error.message);
      } else {
        remaining.push(r);
      }
    } else {
      sent++;
    }
  }
  write(remaining);
  return sent;
};

export const initOfflineSync = () => {
  const tryFlush = () => {
    if (navigator.onLine) flushQueue();
  };
  window.addEventListener("online", tryFlush);
  tryFlush();
  return () => window.removeEventListener("online", tryFlush);
};
