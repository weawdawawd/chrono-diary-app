import { supabase } from "@/integrations/supabase/client";

const KEY = "patrol_offline_scans_v1";

export type QueuedScan = {
  user_id: string;
  point_id: string;
  scan_method: "qr" | "nfc";
  session_id: string | null;
  route_id: string | null;
  lat: number | null;
  lng: number | null;
  distance_m: number | null;
  valid: boolean;
  scanned_at: string;
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
  const rows = read();
  if (!rows.length) return 0;
  const { error } = await supabase.from("patrol_scans").insert(rows as any);
  if (error) {
    console.error("[patrol-offline] flush failed", error);
    return 0;
  }
  write([]);
  return rows.length;
};

export const initOfflineSync = () => {
  const tryFlush = () => {
    if (navigator.onLine) flushQueue();
  };
  window.addEventListener("online", tryFlush);
  tryFlush();
  return () => window.removeEventListener("online", tryFlush);
};
