import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  userId: string;
  fallbackText?: string;
  size?: number;
}

export default function AvatarUpload({ userId, fallbackText, size = 80 }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from("profiles").select("avatar_url").eq("user_id", userId).maybeSingle();
    setUrl((data as any)?.avatar_url ?? null);
  };

  useEffect(() => { load(); }, [userId]);

  const upload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Bild max. 5 MB"); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", userId);
      if (updErr) throw updErr;
      setUrl(publicUrl);
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
      <div
        className="relative rounded-full overflow-hidden bg-primary/15 flex items-center justify-center font-semibold text-primary shrink-0"
        style={{ width: size, height: size, fontSize: size / 2.5 }}
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
      </div>
      <div className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
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
    </div>
  );
}
