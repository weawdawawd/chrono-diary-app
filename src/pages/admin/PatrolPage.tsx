import { useEffect, useMemo, useRef, useState } from "react";
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
  History, Nfc, ScanLine, X, ChevronDown, ChevronRight, RefreshCw, ArrowUp, ArrowDown,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Point {
  id: string; name: string; code: string; location: string;
  nfc_id: string | null; order_index: number; active: boolean;
  lat?: number | null; lng?: number | null;
}
interface RouteRow { id: string; name: string; location: string; required_rounds: number; required_points: number; active: boolean; }
interface ScanRow {
  id: string;
  scanned_at: string;
  scan_method: string;
  user_id: string;
  distance_m: number | null;
  valid: boolean;
  point: { name: string; location: string } | null;
  user: { display_name: string | null; email: string | null } | null;
}

const escapeHtml = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const signedPayload = async (pointId: string): Promise<string> => {
  const { data, error } = await supabase.rpc("sign_patrol_qr", { _point_id: pointId } as any);
  if (error || !data) throw error || new Error("sign failed");
  return data as unknown as string;
};

export default function PatrolPage() {
  const { user } = useAuth();
  const [points, setPoints] = useState<Point[]>([]);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [pointDialog, setPointDialog] = useState(false);
  const [routeDialog, setRouteDialog] = useState(false);
  const [editPoint, setEditPoint] = useState<Point | null>(null);
  const [openLocations, setOpenLocations] = useState<Record<string, boolean>>({});

  // scan filters
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [filterValid, setFilterValid] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");

  const load = async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("patrol_points").select("*").order("location").order("order_index"),
      supabase.from("patrol_routes").select("*").order("location"),
    ]);
    setPoints((p as Point[]) || []);
    setRoutes((r as RouteRow[]) || []);
  };

  const loadScans = async () => {
    const { data, error } = await supabase
      .from("patrol_scans")
      .select("id, scanned_at, scan_method, user_id, distance_m, valid, point:patrol_points(name, location)")
      .order("scanned_at", { ascending: false })
      .limit(500);
    if (error) { toast.error(error.message); return; }
    const rows = (data as any[]) || [];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const profileMap: Record<string, { display_name: string | null; email: string | null }> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles").select("user_id, display_name, email").in("user_id", userIds);
      (profs || []).forEach((p: any) => { profileMap[p.user_id] = { display_name: p.display_name, email: p.email }; });
    }
    setScans(rows.map((r) => ({ ...r, user: profileMap[r.user_id] || null })));
  };

  useEffect(() => { load(); loadScans(); }, []);

  useEffect(() => {
    const ch = supabase.channel("patrol_scans_admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "patrol_scans" }, () => loadScans())
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
      const { error } = await supabase.from("patrol_points").insert({ ...data, code, created_by: user.id } as any);
      if (error) return toast.error(error.message);
    }
    toast.success("Punkt gespeichert");
    setPointDialog(false); setEditPoint(null);
    load();
  };

  const delPoint = async (id: string) => {
    const { error } = await supabase.from("patrol_points").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Punkt gelöscht"); load();
  };

  const saveRoute = async (data: Partial<RouteRow> & { pointIds: string[] }) => {
    if (!user) return;
    const { pointIds, ...routeData } = data;
    const { data: inserted, error } = await supabase
      .from("patrol_routes")
      .insert({ ...routeData, required_points: pointIds.length, created_by: user.id } as any)
      .select("id").single();
    if (error) return toast.error(error.message);
    if (pointIds.length) {
      const rows = pointIds.map((pid, i) => ({ route_id: (inserted as any).id, point_id: pid, order_index: i }));
      const { error: rpErr } = await supabase.from("patrol_route_points" as any).insert(rows as any);
      if (rpErr) toast.warning("Route gespeichert, Punkte konnten nicht zugeordnet werden");
    }
    toast.success("Rundgang gespeichert"); setRouteDialog(false); load();
  };

  const delRoute = async (id: string) => {
    await supabase.from("patrol_routes").delete().eq("id", id);
    load();
  };

  const printQR = async (pt: Point) => {
    let payload: string;
    try { payload = await signedPayload(pt.id); }
    catch (e: any) { toast.error(`QR-Signatur fehlgeschlagen: ${e?.message || e}`); return; }
    const dataUrl = await QRCode.toDataURL(payload, { width: 400, margin: 2 });
    const w = window.open("", "_blank");
    if (!w) return toast.error("Popup blockiert");
    w.document.write(`<html><head><title>QR ${escapeHtml(pt.name)}</title>
      <style>body{font-family:sans-serif;text-align:center;padding:40px;}img{width:300px;}h2{margin:10px 0 4px;}p{color:#555;margin:0;}code{font-family:monospace;background:#eee;padding:2px 6px;border-radius:4px;font-size:11px;}</style>
      </head><body>
      <h2>${escapeHtml(pt.name)}</h2>
      <p>${escapeHtml(pt.location)}</p>
      <img src="${dataUrl}" alt="QR Code" />
      <p><code>${escapeHtml(pt.code)}</code></p>
      <script>setTimeout(()=>window.print(),300)</script>
      </body></html>`);
    w.document.close();
  };

  const printAllForLocation = async (location: string) => {
    const list = points.filter((p) => p.location === location && p.active);
    if (!list.length) return;
    const items = await Promise.all(list.map(async (pt) => {
      const payload = await signedPayload(pt.id).catch(() => pt.code);
      const url = await QRCode.toDataURL(payload, { width: 320, margin: 2 });
      return `<div class="card"><h3>${escapeHtml(pt.name)}</h3><p>${escapeHtml(pt.location)}</p><img src="${url}" alt="QR Code"/><code>${escapeHtml(pt.code)}</code></div>`;
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
  const toggleLoc = (loc: string) => setOpenLocations((o) => ({ ...o, [loc]: !o[loc] }));

  const userOptions = useMemo(() => {
    const map = new Map<string, string>();
    scans.forEach((s) => {
      if (s.user_id) map.set(s.user_id, s.user?.display_name || s.user?.email || s.user_id.slice(0, 6));
    });
    return Array.from(map.entries());
  }, [scans]);

  const filteredScans = scans.filter((s) => {
    if (filterUser !== "all" && s.user_id !== filterUser) return false;
    if (filterMethod !== "all" && s.scan_method !== filterMethod) return false;
    if (filterValid === "valid" && !s.valid) return false;
    if (filterValid === "invalid" && s.valid) return false;
    if (filterFrom && s.scanned_at < new Date(filterFrom).toISOString()) return false;
    if (filterTo && s.scanned_at > new Date(filterTo + "T23:59:59").toISOString()) return false;
    return true;
  });
  const scanLocations = Array.from(new Set(filteredScans.map((s) => s.point?.location).filter(Boolean) as string[])).sort();

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
          <Card className="p-3 grid gap-2 sm:grid-cols-5">
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger><SelectValue placeholder="Mitarbeiter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                {userOptions.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Methoden</SelectItem>
                <SelectItem value="nfc">NFC</SelectItem>
                <SelectItem value="qr">QR</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterValid} onValueChange={setFilterValid}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="valid">Gültig</SelectItem>
                <SelectItem value="invalid">Ungültig</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{filteredScans.length} Scans</p>
            <Button size="sm" variant="outline" onClick={loadScans} className="gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Aktualisieren
            </Button>
          </div>
          {scanLocations.length === 0 && <p className="text-sm text-muted-foreground">Keine Scans.</p>}
          {scanLocations.map((loc) => {
            const list = filteredScans.filter((s) => s.point?.location === loc);
            const open = openLocations[loc] ?? false;
            return (
              <Card key={loc} className="overflow-hidden">
                <button onClick={() => toggleLoc(loc)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition">
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
                          <span className="text-xs text-muted-foreground ml-2">· {s.user?.display_name || s.user?.email || "Unbekannt"}</span>
                          {s.distance_m != null && (
                            <span className="text-[10px] text-muted-foreground ml-2">{Math.round(s.distance_m)} m</span>
                          )}
                        </span>
                        {!s.valid && <span className="text-[10px] uppercase bg-amber-500/20 text-amber-600 px-1.5 rounded">ungültig</span>}
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
      <RouteDialog open={routeDialog} onOpenChange={setRouteDialog} onSave={saveRoute} points={points} />
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
    } else { stopQR(); stopNFC(); }
  }, [open, initial]);

  const startQR = async () => {
    try {
      setQrScanning(true);
      await new Promise((r) => setTimeout(r, 50));
      qrRef.current = new Html5Qrcode("patrol-admin-qr");
      await qrRef.current.start(
        { facingMode: "environment" }, { fps: 10, qrbox: { width: 220, height: 220 } },
        async (text) => { setCode(text.trim()); toast.success("QR übernommen"); await stopQR(); },
        () => {}
      );
    } catch (e: any) { toast.error(e?.message || "Kamera nicht verfügbar"); setQrScanning(false); }
  };
  const stopQR = async () => { try { await qrRef.current?.stop(); await qrRef.current?.clear(); } catch {} qrRef.current = null; setQrScanning(false); };
  const startNFC = async () => {
    try {
      const NDEF = (window as any).NDEFReader;
      if (!NDEF) { toast.error("NFC nicht verfügbar"); return; }
      const reader = new NDEF();
      const ctrl = new AbortController(); nfcAbortRef.current = ctrl; setNfcReading(true);
      await reader.scan({ signal: ctrl.signal });
      toast.info("NFC-Karte anhalten…");
      reader.onreading = (event: any) => {
        const id = event.serialNumber || "";
        if (id) { setNfcId(id); toast.success("NFC-ID übernommen"); }
        else if (event.message?.records?.length) {
          try { setNfcId(new TextDecoder().decode(event.message.records[0].data)); toast.success("NFC-Daten übernommen"); } catch {}
        }
        stopNFC();
      };
    } catch (e: any) { toast.error(e?.message || "NFC-Fehler"); setNfcReading(false); }
  };
  const stopNFC = () => { try { nfcAbortRef.current?.abort(); } catch {} nfcAbortRef.current = null; setNfcReading(false); };

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
            <Label>Code (intern)</Label>
            <div className="flex gap-2">
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Leer = automatisch" />
              {!qrScanning ? (
                <Button type="button" variant="outline" onClick={startQR} className="gap-1 shrink-0"><ScanLine className="w-4 h-4" /> QR</Button>
              ) : (
                <Button type="button" variant="destructive" onClick={stopQR} className="gap-1 shrink-0"><X className="w-4 h-4" /> Stop</Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Der gedruckte QR enthält eine signierte Payload und ist nicht einfach kopierbar.</p>
            <div id="patrol-admin-qr" className={qrScanning ? "mt-2 rounded-lg overflow-hidden border" : "hidden"} />
          </div>

          <div>
            <Label>NFC-Tag ID</Label>
            <div className="flex gap-2">
              <Input value={nfcId} onChange={(e) => setNfcId(e.target.value)} placeholder="Karte einlesen oder Seriennummer" />
              {!nfcReading ? (
                <Button type="button" variant="outline" onClick={startNFC} disabled={!nfcSupported} className="gap-1 shrink-0"><Nfc className="w-4 h-4" /> Karte</Button>
              ) : (
                <Button type="button" variant="destructive" onClick={stopNFC} className="gap-1 shrink-0"><X className="w-4 h-4" /> Stop</Button>
              )}
            </div>
            {!nfcSupported && <p className="text-[11px] text-muted-foreground mt-1">NFC nur in nativer App / Chrome Android verfügbar.</p>}
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

function RouteDialog({ open, onOpenChange, onSave, points }: { open: boolean; onOpenChange: (v: boolean) => void; onSave: (d: any) => void; points: Point[] }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [rounds, setRounds] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => { if (open) { setName(""); setLocation(""); setRounds(1); setSelectedIds([]); } }, [open]);

  const availablePoints = location ? points.filter((p) => p.location === location && p.active) : points.filter((p) => p.active);
  const locations = Array.from(new Set(points.map((p) => p.location))).sort();

  const toggle = (id: string) => {
    setSelectedIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };
  const move = (idx: number, dir: -1 | 1) => {
    setSelectedIds((s) => {
      const next = [...s];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return s;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Neuer Rundgang</DialogTitle>
          <DialogDescription>Punkte auswählen und in gewünschter Reihenfolge ordnen.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div>
            <Label>Objekt *</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger><SelectValue placeholder="Objekt wählen" /></SelectTrigger>
              <SelectContent>
                {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Runden pro Schicht</Label>
            <Input type="number" min={1} value={rounds} onChange={(e) => setRounds(parseInt(e.target.value) || 1)} />
          </div>

          {location && (
            <div>
              <Label>Punkte ({selectedIds.length} ausgewählt)</Label>
              <div className="border rounded-lg divide-y mt-1">
                {availablePoints.map((p) => {
                  const checked = selectedIds.includes(p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                      <Checkbox checked={checked} onCheckedChange={() => toggle(p.id)} />
                      <span className="flex-1">{p.name}</span>
                    </div>
                  );
                })}
                {!availablePoints.length && <p className="px-3 py-2 text-xs text-muted-foreground">Keine Punkte für dieses Objekt</p>}
              </div>
            </div>
          )}

          {selectedIds.length > 0 && (
            <div>
              <Label>Reihenfolge</Label>
              <ol className="border rounded-lg divide-y mt-1">
                {selectedIds.map((id, i) => {
                  const p = points.find((x) => x.id === id);
                  return (
                    <li key={id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                      <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                      <span className="flex-1">{p?.name}</span>
                      <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === selectedIds.length - 1}><ArrowDown className="w-3.5 h-3.5" /></Button>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button disabled={!name || !location} onClick={() => onSave({ name, location, required_rounds: rounds, pointIds: selectedIds })}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
