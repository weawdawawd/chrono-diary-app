import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  userId: string;
  fallbackText?: string;
  size?: number;
}

async function getCroppedBlob(src: string, area: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const canvas = document.createElement("canvas");
  const size = Math.min(area.width, area.height);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9));
}

export default function AvatarUpload({ userId, fallbackText, size = 80 }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // cropper state
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPx, setAreaPx] = useState<Area | null>(null);

  const load = async () => {
    const { data } = await supabase.from("profiles").select("avatar_url").eq("user_id", userId).maybeSingle();
    setUrl((data as any)?.avatar_url ?? null);
  };

  useEffect(() => { load(); }, [userId]);

  const onFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("Bild max. 10 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setRawSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => setAreaPx(areaPixels), []);

  const saveCropped = async () => {
    if (!rawSrc || !areaPx) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(rawSrc, areaPx);
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", userId);
      if (updErr) throw updErr;
      setUrl(publicUrl);
      setRawSrc(null);
      toast.success("Profilbild aktualisiert");
    } catch (e: any) {
      toast.error(e?.message || "Upload fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", userId);
      if (error) throw error;
      setUrl(null);
      toast.success("Profilbild entfernt");
    } catch (e: any) {
      toast.error(e?.message || "Fehler");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => url && setPreview(true)}
        className="relative rounded-full overflow-hidden bg-primary/15 flex items-center justify-center font-semibold text-primary shrink-0 cursor-pointer disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ width: size, height: size, fontSize: size / 2.5 }}
        disabled={!url}
        aria-label={url ? "Profilbild vergrößern" : "Kein Profilbild"}
      >
        {url ? (
          <img src={url} alt="Profilbild" className="w-full h-full object-cover" />
        ) : (
          (fallbackText || "?").charAt(0).toUpperCase()
        )}
        {busy && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
      </button>
      <div className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
        />
        <Button size="sm" variant="outline" className="h-8 text-xs" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Camera className="w-3.5 h-3.5 mr-1.5" /> {url ? "Ändern" : "Hochladen"}
        </Button>
        {url && (
          <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive" disabled={busy} onClick={remove}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Entfernen
          </Button>
        )}
      </div>

      {/* Crop dialog */}
      <Dialog open={!!rawSrc} onOpenChange={(o) => !o && setRawSrc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bild zuschneiden</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-72 bg-muted rounded-md overflow-hidden">
            {rawSrc && (
              <Cropper
                image={rawSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="px-1">
            <p className="text-xs text-muted-foreground mb-2">Zoom</p>
            <Slider value={[zoom]} min={1} max={4} step={0.05} onValueChange={(v) => setZoom(v[0])} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRawSrc(null)} disabled={busy}>Abbrechen</Button>
            <Button onClick={saveCropped} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-w-lg p-2 bg-transparent border-0 shadow-none">
          {url && <img src={url} alt="Profilbild groß" className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
