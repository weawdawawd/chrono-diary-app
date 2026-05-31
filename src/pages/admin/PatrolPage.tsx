import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Plus, Trash2, Printer, QrCode, MapPin, Route, Edit2,
  History, Nfc, ScanLine, X, ChevronDown, ChevronRight, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Point {
  id: string; name: string; code: string; location: string;
  nfc_id: string | null; order_index: number; active: boolean;
}
interface Route { id: string; name: string; location: string; required_rounds: number; required_points: number; active: boolean; }
interface ScanRow {
  id: string;
  scanned_at: string;
  scan_method: string;
  user_id: string;
  point: { name: string; location: string } | null;
  user: { display_name: string | null; email: string | null } | null;
}

const escapeHtml = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export default function PatrolPage() {
  const { user } = useAuth();
  const [points, setPoints] = useState<Point[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [pointDialog, setPointDialog] = useState(false);
  const [routeDialog, setRouteDialog] = useState(false);
  const [editPoint, setEditPoint] = useState<Point | null>(null);
  const [openLocations, setOpenLocations] = useState<Record<string, boolean>>({});

  const load = async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("patrol_points").select("*").order("location").order("order_index"),
      supabase.from("patrol_routes").select("*").order("location"),
    ]);
    setPoints((p as Point[]) || []);
    setRoutes((r as Route[]) || []);
  };

  const loadScans = async () => {
    const { data, error } = await supabase
      .from("patrol_scans")
      .select("id, scanned_at, scan_method, user_id, point:patrol_points(name, location)")
      .order("scanned_at", { ascending: false })
      .limit(500);
    if (error) { toast.error(error.message); return; }
    const rows = (data as any[]) || [];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    let profileMap: Record<string, { display_name: string | null; email: string | null }> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", userIds);
      (profs || []).forEach((p: any) => {
        profileMap[p.user_id] = { display_name: p.display_name, email: p.email };
      });
    }
    setScans(rows.map((r) => ({ ...r, user: profileMap[r.user_id] || null })));
  };

  useEffect(() => { load(); loadScans(); }, []);

  // Realtime: new scans appear immediately (webhook-like live feed)
  useEffect(() => {
    const ch = supabase
      .channel("patrol_scans_admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "patrol_scans" },
        () => loadScans()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const savePoint = async (data: Partial<Point>) => {
    if (!user) return;
    if (editPoint) {
      const { error } = await supabase.from("patrol_points").update(data).eq("id", editPoint.id);
      if (error) return toast.error(error.message);
    } else {
      const code = data.code || crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
      const { error } = await supabase.from("patrol_points").insert({
        ...data, code, created_by: user.id,
      } as any);
      if (error) return toast.error(error.message);
    }
    toast.success("Punkt gespeichert");
    setPointDialog(false); setEditPoint(null);
    load();
  };

  const delPoint = async (id: string) => {
    const { error } = await supabase.from("patrol_points").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Punkt gelöscht");
    load();
  };

  const saveRoute = async (data: Partial<Route>) => {
    if (!user) return;
    const { error } = await supabase.from("patrol_routes").insert({ ...data, created_by: user.id } as any);
    if (error) return toast.error(error.message);
    toast.success("Route gespeichert"); setRouteDialog(false); load();
  };
  const delRoute = async (id: string) => {
    await supabase.from("patrol_routes").delete().eq("id", id);
    load();
  };

  const printQR = async (pt: Point) => {
    const dataUrl = await QRCode.toDataURL(pt.code, { width: 400, margin: 2 });
    const w = window.open("", "_blank");
    if (!w) return toast.error("Popup blockiert");
    w.document.write(`<html><head><title>QR ${escapeHtml(pt.name)}</title>
      <style>body{font-family:sans-serif;text-align:center;padding:40px;}img{width:300px;}h2{margin:10px 0 4px;}p{color:#555;margin:0;}code{font-family:monospace;background:#eee;padding:2px 6px;border-radius:4px;}</style>
      </head><body>
      <h2>${escapeHtml(pt.name)}</h2>
      <p>${escapeHtml(pt.location)}</p>
      <img src="${dataUrl}" />
      <p><code>${escapeHtml(pt.code)}</code></p>
      <script>setTimeout(()=>window.print(),300)</script>
      </body></html>`);
    w.document.close();
  };

  const printAllForLocation = async (location: string) => {
    const list = points.filter((p) => p.location === location && p.active);
    if (!list.length) return;
    const items = await Promise.all(list.map(async (pt) => {
      const url = await QRCode.toDataURL(pt.code, { width: 320, margin: 2 });
      return `<div class="card"><h3>${escapeHtml(pt.name)}</h3><p>${escapeHtml(pt.location)}</p><img src="${url}"/><code>${escapeHtml(pt.code)}</code></div>`;
    }));
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>QR ${escapeHtml(location)}</title>
      <style>body{font-family:sans-serif;margin:20px;}
      .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;}
      .card{border:1px solid #ccc;border-radius:8px;padding:14px;text-align:center;break-inside:avoid;}
      .card img{width:220px;}h3{margin:0 0 4px;}p{color:#555;margin:0 0 8px;font-size:13px;}
      code{font-family:monospace;font-size:11px;background:#eee;padding:2px 6px;border-radius:4px;}
      </style></head><body>
      <h2>Patrouille — ${escapeHtml(location)}</h2>
      <div class="grid">${items.join("")}</div>
      <script>setTimeout(()=>window.print(),400)</script>
      </body></html>`);
    w.document.close();
  };

  const locations = Array.from(new Set(points.map((p) => p.location))).sort();
  const scanLocations = Array.from(new Set(scans.map((s) => s.point?.location).filter(Boolean) as string[])).sort();

  const toggleLoc = (loc: string) => setOpenLocations((o) => ({ ...o, [loc]: !o[loc] }));

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2"><QrCode className="w-5 h-5" /> Patrouille</h1>
      </div>

      <Tabs defaultValue="points">
        <TabsList>
          <TabsTrigger value="points"><MapPin className="w-4 h-4 mr-1.5" />Punkte</TabsTrigger>
          <TabsTrigger value="routes"><Route className="w-4 h-4 mr-1.5" />Rundgänge</TabsTrigger>
          <TabsTrigger value="scans"><History className="w-4 h-4 mr-1.5" />Scans</TabsTrigger>
        </TabsList>

        <TabsContent value="points" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditPoint(null); setPointDialog(true); }} className="gap-1"><Plus className="w-4 h-4" />Punkt</Button>
          </div>
          {locations.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Punkte angelegt.</p>}
          {locations.map((loc) => (
            <Card key={loc} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{loc}</h3>
                <Button size="sm" variant="outline" onClick={() => printAllForLocation(loc)} className="gap-1">
                  <Printer className="w-3.5 h-3.5" /> Alle drucken
                </Button>
              </div>
              <ul className="divide-y">
                {points.filter((p) => p.location === loc).map((pt) => (
                  <li key={pt.id} className="py-2 flex items-center gap-2 text-sm">
                    <span className="flex-1">
                      <span className="font-medium">{pt.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 font-mono">{pt.code}</span>
                      {pt.nfc_id && <span className="text-xs text-blue-500 ml-2">NFC</span>}
                    </span>
                    <Button size="icon" variant="ghost" onClick={() => printQR(pt)}><Printer className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditPoint(pt); setPointDialog(true); }}><Edit2 className="w-4 h-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Punkt löschen?</AlertDialogTitle>
                          <AlertDialogDescription>"{pt.name}" wird endgültig gelöscht.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction onClick={() => delPoint(pt.id)}>Löschen</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="routes" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setRouteDialog(true)} className="gap-1"><Plus className="w-4 h-4" />Rundgang</Button>
          </div>
          {routes.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Rundgänge.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {routes.map((r) => (
              <Card key={r.id} className="p-4 flex items-start gap-3">
                <div className="flex-1">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.location}</div>
                  <div className="text-sm mt-1">{r.required_rounds}× Runde · {r.required_points} Punkte</div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rundgang löschen?</AlertDialogTitle>
                      <AlertDialogDescription>"{r.name}" wird endgültig gelöscht.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={() => delRoute(r.id)}>Löschen</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scans" className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Live-Übersicht aller Scans, gruppiert nach Objekt.</p>
            <Button size="sm" variant="outline" onClick={loadScans} className="gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Aktualisieren
            </Button>
          </div>
          {scanLocations.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Scans.</p>}
          {scanLocations.map((loc) => {
            const list = scans.filter((s) => s.point?.location === loc);
            const open = openLocations[loc] ?? false;
            return (
              <Card key={loc} className="overflow-hidden">
                <button
                  onClick={() => toggleLoc(loc)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition"
                >
                  <div className="flex items-center gap-2">
                    {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{loc}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{list.length} Scan{list.length !== 1 && "s"}</span>
                </button>
                {open && (
                  <ul className="divide-y border-t">
                    {list.map((s) => (
                      <li key={s.id} className="px-4 py-2 flex items-center gap-2 text-sm">
                        <span className="flex-1">
                          <span className="font-medium">{s.point?.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            · {s.user?.display_name || s.user?.email || "Unbekannt"}
                          </span>
                        </span>
                        <span className="text-[10px] uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">{s.scan_method}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(s.scanned_at).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      <PointDialog
        open={pointDialog} onOpenChange={(o) => { setPointDialog(o); if (!o) setEditPoint(null); }}
        onSave={savePoint} initial={editPoint}
      />
      <RouteDialog open={routeDialog} onOpenChange={setRouteDialog} onSave={saveRoute} />
    </div>
  );
}

function PointDialog({ open, onOpenChange, onSave, initial }: any) {
  const [name, setName] = useState(""); const [location, setLocation] = useState("");
  const [code, setCode] = useState(""); const [nfcId, setNfcId] = useState("");
  const [qrScanning, setQrScanning] = useState(false);
  const [nfcReading, setNfcReading] = useState(false);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const nfcAbortRef = useRef<AbortController | null>(null);
  const nfcSupported = typeof (window as any).NDEFReader !== "undefined";

  useEffect(() => {
    if (open) {
      setName(initial?.name || ""); setLocation(initial?.location || "");
      setCode(initial?.code || ""); setNfcId(initial?.nfc_id || "");
    } else {
      stopQR(); stopNFC();
    }
  }, [open, initial]);

  const startQR = async () => {
    try {
      setQrScanning(true);
      const id = "patrol-admin-qr";
      // wait one tick for div to mount
      await new Promise((r) => setTimeout(r, 50));
      qrRef.current = new Html5Qrcode(id);
      await qrRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (text) => {
          setCode(text.trim());
          toast.success("QR übernommen");
          await stopQR();
        },
        () => {}
      );
    } catch (e: any) {
      toast.error(e?.message || "Kamera nicht verfügbar");
      setQrScanning(false);
    }
  };
  const stopQR = async () => {
    try { await qrRef.current?.stop(); await qrRef.current?.clear(); } catch {}
    qrRef.current = null;
    setQrScanning(false);
  };

  const startNFC = async () => {
    try {
      const NDEF = (window as any).NDEFReader;
      if (!NDEF) { toast.error("NFC nicht verfügbar (nur Chrome Android / App)"); return; }
      const reader = new NDEF();
      const ctrl = new AbortController();
      nfcAbortRef.current = ctrl;
      setNfcReading(true);
      await reader.scan({ signal: ctrl.signal });
      toast.info("NFC-Karte anhalten…");
      reader.onreading = (event: any) => {
        const id = event.serialNumber || "";
        if (id) {
          setNfcId(id);
          toast.success("NFC-ID übernommen");
        } else if (event.message?.records?.length) {
          try {
            const rec = event.message.records[0];
            const text = new TextDecoder().decode(rec.data);
            setNfcId(text);
            toast.success("NFC-Daten übernommen");
          } catch {}
        }
        stopNFC();
      };
    } catch (e: any) {
      toast.error(e?.message || "NFC-Fehler");
      setNfcReading(false);
    }
  };
  const stopNFC = () => {
    try { nfcAbortRef.current?.abort(); } catch {}
    nfcAbortRef.current = null;
    setNfcReading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Punkt bearbeiten" : "Neuer Punkt"}</DialogTitle>
          <DialogDescription>QR scannen oder NFC-Karte einlesen, oder manuell eintragen.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Eingang Nord" /></div>
          <div><Label>Objekt / Standort *</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="z.B. Hauptgebäude" /></div>

          <div>
            <Label>Code (QR-Inhalt)</Label>
            <div className="flex gap-2">
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Leer = automatisch" />
              {!qrScanning ? (
                <Button type="button" variant="outline" onClick={startQR} className="gap-1 shrink-0">
                  <ScanLine className="w-4 h-4" /> QR
                </Button>
              ) : (
                <Button type="button" variant="destructive" onClick={stopQR} className="gap-1 shrink-0">
                  <X className="w-4 h-4" /> Stop
                </Button>
              )}
            </div>
            <div id="patrol-admin-qr" className={qrScanning ? "mt-2 rounded-lg overflow-hidden border" : "hidden"} />
          </div>

          <div>
            <Label>NFC-Tag ID</Label>
            <div className="flex gap-2">
              <Input value={nfcId} onChange={(e) => setNfcId(e.target.value)} placeholder="Karte einlesen oder Seriennummer" />
              {!nfcReading ? (
                <Button type="button" variant="outline" onClick={startNFC} disabled={!nfcSupported} className="gap-1 shrink-0">
                  <Nfc className="w-4 h-4" /> Karte
                </Button>
              ) : (
                <Button type="button" variant="destructive" onClick={stopNFC} className="gap-1 shrink-0">
                  <X className="w-4 h-4" /> Stop
                </Button>
              )}
            </div>
            {!nfcSupported && (
              <p className="text-[11px] text-muted-foreground mt-1">NFC nur in nativer App / Chrome Android verfügbar.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button disabled={!name || !location} onClick={() => onSave({ name, location, code: code || undefined, nfc_id: nfcId || null })}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RouteDialog({ open, onOpenChange, onSave }: any) {
  const [name, setName] = useState(""); const [location, setLocation] = useState("");
  const [rounds, setRounds] = useState(1); const [pts, setPts] = useState(0);
  useEffect(() => { if (open) { setName(""); setLocation(""); setRounds(1); setPts(0); } }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuer Rundgang</DialogTitle>
          <DialogDescription>Anzahl Runden und Punkte pro Schicht festlegen.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Objekt *</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Runden pro Schicht</Label><Input type="number" min={1} value={rounds} onChange={(e) => setRounds(parseInt(e.target.value) || 1)} /></div>
            <div><Label>Punkte pro Runde</Label><Input type="number" min={0} value={pts} onChange={(e) => setPts(parseInt(e.target.value) || 0)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button disabled={!name || !location} onClick={() => onSave({ name, location, required_rounds: rounds, required_points: pts })}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
