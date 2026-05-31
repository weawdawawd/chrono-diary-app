import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Printer, QrCode, MapPin, Route, Edit2 } from "lucide-react";
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
  const [pointDialog, setPointDialog] = useState(false);
  const [routeDialog, setRouteDialog] = useState(false);
  const [editPoint, setEditPoint] = useState<Point | null>(null);

  const load = async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("patrol_points").select("*").order("location").order("order_index"),
      supabase.from("patrol_routes").select("*").order("location"),
    ]);
    setPoints((p as Point[]) || []);
    setRoutes((r as Route[]) || []);
  };
  useEffect(() => { load(); }, []);

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

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2"><QrCode className="w-5 h-5" /> Patrouille</h1>
      </div>

      <Tabs defaultValue="points">
        <TabsList>
          <TabsTrigger value="points"><MapPin className="w-4 h-4 mr-1.5" />Punkte</TabsTrigger>
          <TabsTrigger value="routes"><Route className="w-4 h-4 mr-1.5" />Routen</TabsTrigger>
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
            <Button onClick={() => setRouteDialog(true)} className="gap-1"><Plus className="w-4 h-4" />Route</Button>
          </div>
          {routes.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Routen.</p>}
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
                      <AlertDialogTitle>Route löschen?</AlertDialogTitle>
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
  useEffect(() => {
    if (open) {
      setName(initial?.name || ""); setLocation(initial?.location || "");
      setCode(initial?.code || ""); setNfcId(initial?.nfc_id || "");
    }
  }, [open, initial]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Punkt bearbeiten" : "Neuer Punkt"}</DialogTitle>
          <DialogDescription>Code optional (auto-generiert). NFC-ID nur falls vorhanden.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Eingang Nord" /></div>
          <div><Label>Objekt / Standort *</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="z.B. Hauptgebäude" /></div>
          <div><Label>Code (QR-Inhalt)</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Leer = automatisch" /></div>
          <div><Label>NFC-Tag ID (optional)</Label><Input value={nfcId} onChange={(e) => setNfcId(e.target.value)} placeholder="Seriennummer des NFC-Tags" /></div>
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
          <DialogTitle>Neue Route</DialogTitle>
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
