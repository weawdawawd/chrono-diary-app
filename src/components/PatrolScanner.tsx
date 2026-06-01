import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScanLine, Nfc, X, CheckCircle2, Play, StopCircle, AlertTriangle, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { haversineMeters, getCurrentPosition } from "@/lib/geo";
import { queueScan, flushQueue, initOfflineSync, queueCount } from "@/lib/patrolOfflineQueue";

type Props = { userId: string };

const GEO_RADIUS_M = 50;

interface RouteRow { id: string; name: string; location: string; }
interface RoutePointRow { point_id: string; order_index: number; point: { id: string; name: string; location: string; code: string; nfc_id: string | null; lat: number | null; lng: number | null } | null }

export default function PatrolScanner({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePointRow[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [scannedPointIds, setScannedPointIds] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [pendingCount, setPendingCount] = useState(queueCount());
  const qrRef = useRef<Html5Qrcode | null>(null);
  const nfcAbortRef = useRef<AbortController | null>(null);
  const nfcSupported = typeof (window as any).NDEFReader !== "undefined";

  // offline sync init
  useEffect(() => {
    const cleanup = initOfflineSync();
    const i = window.setInterval(() => setPendingCount(queueCount()), 4000);
    return () => { cleanup(); window.clearInterval(i); };
  }, []);

  // resume active session
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("patrol_sessions" as any)
        .select("id, route_id, started_at")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setSessionId((data as any).id);
        setSessionStartedAt((data as any).started_at);
        setSelectedRoute((data as any).route_id);
        if ((data as any).route_id) await loadRoutePoints((data as any).route_id);
        await loadAlreadyScanned((data as any).id);
      }
    })();
  }, [userId]);

  const loadRoutes = async () => {
    const { data } = await supabase
      .from("patrol_routes")
      .select("id, name, location")
      .eq("active", true)
      .order("location");
    setRoutes((data as RouteRow[]) || []);
  };

  const loadRoutePoints = async (routeId: string) => {
    const { data } = await supabase
      .from("patrol_route_points" as any)
      .select("point_id, order_index, point:patrol_points(id,name,location,code,nfc_id,lat,lng)")
      .eq("route_id", routeId)
      .order("order_index");
    setRoutePoints((data as any) || []);
  };

  const loadAlreadyScanned = async (sid: string) => {
    const { data } = await supabase
      .from("patrol_scans")
      .select("point_id")
      .eq("session_id", sid)
      .eq("valid", true);
    setScannedPointIds(new Set((data || []).map((r: any) => r.point_id)));
  };

  useEffect(() => { if (open) loadRoutes(); }, [open]);

  const startSession = async () => {
    const pos = await getCurrentPosition();
    const { data, error } = await supabase.rpc("start_patrol_session", {
      _route_id: selectedRoute,
      _lat: pos?.lat ?? null,
      _lng: pos?.lng ?? null,
    } as any);
    if (error) { toast.error(error.message); return; }
    setSessionId(data as unknown as string);
    setSessionStartedAt(new Date().toISOString());
    setScannedPointIds(new Set());
    if (selectedRoute) await loadRoutePoints(selectedRoute);
    toast.success("Rundgang gestartet");
  };

  const endSession = async () => {
    if (!sessionId) return;
    await stopQR(); stopNFC();
    const pos = await getCurrentPosition();
    const { data, error } = await supabase.rpc("end_patrol_session", {
      _session_id: sessionId,
      _lat: pos?.lat ?? null,
      _lng: pos?.lng ?? null,
    } as any);
    if (error) { toast.error(error.message); return; }
    const status = data as unknown as string;
    if (status === "completed") toast.success("✅ Rundgang vollständig");
    else toast.warning("❌ Rundgang unvollständig");
    setSessionId(null); setSessionStartedAt(null); setScannedPointIds(new Set());
    setSelectedRoute(null); setRoutePoints([]); setLastResult(null);
  };

  // ---- scan handling ----
  const handleScan = async (raw: string, method: "qr" | "nfc") => {
    const text = raw.trim();
    const payload = method === "qr" ? text : null;
    const nfcId = method === "nfc" ? text : null;

    // Resolve point info for display + route membership (no qr_secret involved)
    let pointMeta: { id: string; name: string; location: string } | null = null;
    if (payload && payload.startsWith("LDN1.")) {
      const { data } = await supabase.rpc("verify_patrol_qr", { _payload: payload } as any);
      const r = (data as any[])?.[0];
      if (r) pointMeta = { id: r.point_id, name: r.name, location: r.location };
    } else if (payload) {
      // Backwards-compat: plain point code printed on older QR labels
      const { data } = await supabase
        .from("patrol_points")
        .select("id,name,location")
        .eq("code", payload)
        .eq("active", true)
        .maybeSingle();
      if (data) pointMeta = data as any;
    } else if (nfcId) {
      const { data } = await supabase
        .from("patrol_points")
        .select("id,name,location")
        .eq("nfc_id", nfcId)
        .eq("active", true)
        .maybeSingle();
      if (data) pointMeta = data as any;
    }

    if (selectedRoute && pointMeta && !routePoints.some((rp) => rp.point_id === pointMeta!.id)) {
      setLastResult({ ok: false, text: `Falscher Punkt: "${pointMeta.name}" gehört nicht zum Rundgang` });
      toast.error("Punkt gehört nicht zum Rundgang");
      return;
    }

    const pos = await getCurrentPosition(4000);
    const scannedAt = new Date().toISOString();
    const queued = {
      payload, nfcId,
      lat: pos?.lat ?? null,
      lng: pos?.lng ?? null,
      sessionId,
      routeId: selectedRoute,
      scannedAt,
    };

    if (!navigator.onLine) {
      queueScan(queued);
      setPendingCount(queueCount());
      toast.info("Offline gespeichert");
    } else {
      const { error } = await supabase.rpc("record_patrol_scan", {
        _payload: payload,
        _nfc_id: nfcId,
        _lat: queued.lat,
        _lng: queued.lng,
        _session_id: sessionId,
        _route_id: selectedRoute,
        _scanned_at: scannedAt,
      } as any);
      if (error) {
        console.error("[patrol-scan] record_patrol_scan failed", error);
        const msg = error.message || "Scan abgelehnt";
        // Only fall back to offline queue on true network failures
        const isNetwork = /failed to fetch|network|networkerror|load failed/i.test(msg);
        if (isNetwork) {
          queueScan(queued);
          setPendingCount(queueCount());
          toast.warning("Konnte nicht senden – offline gespeichert");
        } else {
          toast.error(`Scan abgelehnt: ${msg}`);
          setLastResult({ ok: false, text: msg });
          return;
        }
      }
    }

    if (pointMeta) {
      setScannedPointIds((s) => new Set(s).add(pointMeta!.id));
      // Display distance for user info (server is authoritative)
      let distTxt = "";
      if (pos && pointMeta) {
        const { data: pt } = await supabase
          .from("patrol_points")
          .select("lat,lng")
          .eq("id", pointMeta.id)
          .maybeSingle();
        if (pt?.lat != null && pt?.lng != null) {
          const d = haversineMeters(pos, { lat: pt.lat, lng: pt.lng });
          distTxt = ` · ${Math.round(d)} m`;
        }
      }
      setLastResult({ ok: true, text: `${pointMeta.name} · ${pointMeta.location}${distTxt}` });
    } else {
      setLastResult({ ok: true, text: "Scan erfasst" });
    }
  };


  // ---- QR ----
  const startQR = async () => {
    try {
      setScanning(true);
      await new Promise((r) => setTimeout(r, 50));
      qrRef.current = new Html5Qrcode("patrol-qr-region");
      await qrRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (text) => { await stopQR(); await handleScan(text, "qr"); },
        () => {}
      );
    } catch (e: any) { toast.error(e?.message || "Kamera nicht verfügbar"); setScanning(false); }
  };
  const stopQR = async () => {
    try { await qrRef.current?.stop(); await qrRef.current?.clear(); } catch {}
    qrRef.current = null; setScanning(false);
  };

  // ---- NFC ----
  const startNFC = async () => {
    try {
      const NDEF = (window as any).NDEFReader;
      if (!NDEF) { toast.error("NFC nicht verfügbar"); return; }
      const reader = new NDEF();
      const ctrl = new AbortController();
      nfcAbortRef.current = ctrl;
      await reader.scan({ signal: ctrl.signal });
      toast.info("NFC-Tag anhalten…");
      reader.onreading = async (event: any) => {
        const id = event.serialNumber || "";
        let payload = id;
        if (!id && event.message?.records?.length) {
          payload = new TextDecoder().decode(event.message.records[0].data);
        }
        await handleScan(payload, "nfc");
      };
    } catch (e: any) { toast.error(e?.message || "NFC-Fehler"); }
  };
  const stopNFC = () => { try { nfcAbortRef.current?.abort(); } catch {} nfcAbortRef.current = null; };

  useEffect(() => { if (!open && scanning) stopQR(); }, [open]);

  const sessionActive = !!sessionId;
  const total = routePoints.length;
  const done = routePoints.filter((rp) => scannedPointIds.has(rp.point_id)).length;

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="w-full gap-2">
        <ScanLine className="w-4 h-4" /> Patrouille
        {sessionActive && <span className="ml-1 text-xs bg-primary text-primary-foreground rounded px-1.5">aktiv</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ScanLine className="w-4 h-4" /> Patrouille</DialogTitle>
            <DialogDescription>
              {sessionActive ? "Rundgang läuft – Punkte scannen" : "Rundgang starten und Punkte scannen"}
            </DialogDescription>
          </DialogHeader>

          {!sessionActive ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Rundgang wählen (optional)</label>
                <Select value={selectedRoute ?? "__none"} onValueChange={(v) => setSelectedRoute(v === "__none" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Ohne Route" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Ohne Route</SelectItem>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name} · {r.location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={startSession} className="w-full gap-2"><Play className="w-4 h-4" /> Rundgang starten</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedRoute && total > 0 && (
                <div className="rounded-lg border p-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Fortschritt</span><span>{done} / {total}</span>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${total ? (done/total)*100 : 0}%` }} />
                  </div>
                  <ul className="mt-2 space-y-0.5 max-h-32 overflow-auto text-xs">
                    {routePoints.map((rp) => (
                      <li key={rp.point_id} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${scannedPointIds.has(rp.point_id) ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                        <span className={scannedPointIds.has(rp.point_id) ? "line-through text-muted-foreground" : ""}>{rp.point?.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!scanning ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={startNFC} disabled={!nfcSupported} className="gap-2"><Nfc className="w-4 h-4" /> NFC</Button>
                  <Button onClick={startQR} variant="secondary" className="gap-2"><ScanLine className="w-4 h-4" /> QR</Button>
                </div>
              ) : (
                <Button onClick={stopQR} variant="destructive" className="w-full gap-2"><X className="w-4 h-4" /> Scan abbrechen</Button>
              )}
              {!nfcSupported && (
                <p className="text-[11px] text-muted-foreground">NFC nur in nativer App / Chrome Android verfügbar – QR als Fallback.</p>
              )}

              <div id="patrol-qr-region" className={scanning ? "rounded-lg overflow-hidden border" : "hidden"} />

              {lastResult && (
                <div className={`rounded-lg border p-3 flex items-center gap-2 ${lastResult.ok ? "border-green-500/40 bg-green-500/10" : "border-amber-500/40 bg-amber-500/10"}`}>
                  {lastResult.ok ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  <div className="text-sm">{lastResult.text}</div>
                </div>
              )}

              {pendingCount > 0 && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> {pendingCount} Scan(s) warten auf Sync
                </div>
              )}

              {sessionStartedAt && (
                <p className="text-[11px] text-muted-foreground">
                  Start: {new Date(sessionStartedAt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
                </p>
              )}

              <Button onClick={endSession} variant="outline" className="w-full gap-2">
                <StopCircle className="w-4 h-4" /> Rundgang beenden
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
