import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScanLine, Nfc, X, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = { userId: string };

interface PatrolPoint {
  id: string;
  name: string;
  code: string;
  location: string;
}

export default function PatrolScanner({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<{ name: string; location: string } | null>(null);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  useEffect(() => {
    setNfcSupported(typeof (window as any).NDEFReader !== "undefined");
  }, []);

  const loadRecent = async () => {
    const { data } = await supabase
      .from("patrol_scans")
      .select("id, scanned_at, scan_method, point:patrol_points(name, location)")
      .eq("user_id", userId)
      .order("scanned_at", { ascending: false })
      .limit(10);
    setRecentScans(data || []);
  };

  useEffect(() => {
    if (open) loadRecent();
  }, [open, userId]);

  const recordScan = async (code: string, method: "qr" | "nfc", byNfcId = false) => {
    const col = byNfcId ? "nfc_id" : "code";
    const { data: point, error } = await supabase
      .from("patrol_points")
      .select("*")
      .eq(col, code)
      .eq("active", true)
      .maybeSingle();
    if (error || !point) {
      toast.error("Punkt nicht gefunden");
      return;
    }
    let lat: number | null = null, lng: number | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })
      );
      lat = pos.coords.latitude; lng = pos.coords.longitude;
    } catch {}
    const { error: insErr } = await supabase.from("patrol_scans").insert({
      user_id: userId,
      point_id: (point as any).id,
      scan_method: method,
      lat, lng,
    });
    if (insErr) { toast.error("Speichern fehlgeschlagen"); return; }
    setLastScan({ name: (point as any).name, location: (point as any).location });
    toast.success(`Punkt "${(point as any).name}" erfasst`);
    loadRecent();
  };

  const startQR = async () => {
    try {
      setScanning(true);
      const id = "patrol-qr-region";
      qrRef.current = new Html5Qrcode(id);
      await qrRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (text) => {
          await stopQR();
          await recordScan(text.trim(), "qr");
        },
        () => {}
      );
    } catch (e: any) {
      toast.error(e?.message || "Kamera nicht verfügbar");
      setScanning(false);
    }
  };

  const stopQR = async () => {
    try { await qrRef.current?.stop(); await qrRef.current?.clear(); } catch {}
    qrRef.current = null;
    setScanning(false);
  };

  const startNFC = async () => {
    try {
      const NDEF = (window as any).NDEFReader;
      if (!NDEF) { toast.error("NFC nicht verfügbar"); return; }
      const reader = new NDEF();
      await reader.scan();
      toast.info("NFC-Tag anhalten…");
      reader.onreading = async (event: any) => {
        const id = event.serialNumber || "";
        // Try NFC ID first, else read text record
        let payload = id;
        if (!id && event.message?.records?.length) {
          const rec = event.message.records[0];
          payload = new TextDecoder().decode(rec.data);
        }
        await recordScan(payload, "nfc", !!id);
      };
    } catch (e: any) {
      toast.error(e?.message || "NFC-Fehler");
    }
  };

  useEffect(() => {
    if (!open && scanning) stopQR();
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="w-full gap-2">
        <ScanLine className="w-4 h-4" /> Patrouille scannen
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ScanLine className="w-4 h-4" /> Patrouille</DialogTitle>
            <DialogDescription>QR-Code scannen oder NFC-Tag anhalten</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {!scanning ? (
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={startQR} className="gap-2"><ScanLine className="w-4 h-4" /> QR scannen</Button>
                <Button onClick={startNFC} disabled={!nfcSupported} variant="secondary" className="gap-2">
                  <Nfc className="w-4 h-4" /> NFC
                </Button>
              </div>
            ) : (
              <Button onClick={stopQR} variant="destructive" className="w-full gap-2">
                <X className="w-4 h-4" /> Scan abbrechen
              </Button>
            )}
            {!nfcSupported && (
              <p className="text-[11px] text-muted-foreground">NFC nur in nativer App / Chrome Android verfügbar.</p>
            )}

            <div id="patrol-qr-region" className={scanning ? "rounded-lg overflow-hidden border" : "hidden"} />

            {lastScan && (
              <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <div className="text-sm">
                  <div className="font-medium">{lastScan.name}</div>
                  <div className="text-xs text-muted-foreground">{lastScan.location}</div>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-medium mb-1.5">Letzte Scans</p>
              {recentScans.length === 0 ? (
                <p className="text-xs text-muted-foreground">Noch keine Scans</p>
              ) : (
                <ul className="space-y-1 max-h-48 overflow-auto">
                  {recentScans.map((s) => (
                    <li key={s.id} className="text-xs flex justify-between border-b py-1">
                      <span>{s.point?.name} · {s.point?.location}</span>
                      <span className="text-muted-foreground">{new Date(s.scanned_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
