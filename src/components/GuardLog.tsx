import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookText, Send, Trash2, Camera, X, ImageIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

type Entry = {
  id: string;
  content: string;
  created_at: string;
  author_user_id: string;
  author_name?: string;
  photo_url?: string | null;
  photo_signed?: string | null;
  incident_type?: string | null;
  incident_at?: string | null;
};

interface Props {
  locationName: string;
  shiftId?: string;
  userId: string;
  /** When true the user can write entries (accepted shift or planner). */
  canWrite: boolean;
  /** Planners / admins see all entries; employees only see their own. */
  isPlanner?: boolean;
  compact?: boolean;
}

const INCIDENT_TYPES = [
  { value: "freitext", label: "Freier Text" },
  { value: "vorfall", label: "Vorfall" },
  { value: "beschaedigung", label: "Beschädigung" },
  { value: "uebergabe", label: "Übergabe" },
  { value: "kontrolle", label: "Kontrolle" },
  { value: "sonstiges", label: "Sonstiges" },
];

export default function GuardLog({ locationName, shiftId, userId, canWrite, isPlanner, compact }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [content, setContent] = useState("");
  const [incidentType, setIncidentType] = useState<string>("freitext");
  const [incidentAt, setIncidentAt] = useState<string>(() => {
    const d = new Date(); d.setSeconds(0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("guard_log_entries" as any)
      .select("id, content, created_at, author_user_id, photo_url, incident_type, incident_at")
      .eq("location_name", locationName)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error("[wachbuch] load failed", error);
      setEntries([]);
    } else {
      const list = (data ?? []) as any as Entry[];
      const ids = Array.from(new Set(list.map((e) => e.author_user_id)));
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", ids);
        const map = new Map((profiles ?? []).map((p: any) => [p.user_id, p.display_name || p.email || "Mitarbeiter"]));
        list.forEach((e) => (e.author_name = map.get(e.author_user_id) || "Mitarbeiter"));
      }
      // Sign photo URLs
      await Promise.all(list.map(async (e) => {
        if (e.photo_url) {
          const { data: signed } = await supabase.storage
            .from("guard-log-photos")
            .createSignedUrl(e.photo_url, 60 * 60);
          e.photo_signed = signed?.signedUrl ?? null;
        }
      }));
      setEntries(list);
    }
    setLoading(false);
  }, [locationName]);

  useEffect(() => { load(); }, [load]);

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast.error("Foto zu groß (max. 8 MB)"); return; }
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    const text = content.trim();
    if (!text) { toast.error("Bitte Beschreibung eingeben"); return; }
    setBusy(true);
    try {
      let photoPath: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
        photoPath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("guard-log-photos")
          .upload(photoPath, photoFile, { contentType: photoFile.type, upsert: false });
        if (upErr) throw upErr;
      }
      const { error } = await supabase.from("guard_log_entries" as any).insert({
        location_name: locationName,
        shift_id: shiftId ?? null,
        author_user_id: userId,
        content: text,
        photo_url: photoPath,
        incident_type: incidentType,
        incident_at: incidentAt ? new Date(incidentAt).toISOString() : null,
      });
      if (error) throw error;

      // Notify admins
      const snippet = text.length > 120 ? text.slice(0, 117) + "…" : text;
      supabase.functions
        .invoke("send-push-notification", {
          body: {
            to_role: "admin",
            exclude_user_id: userId,
            title: "📋 Neuer Vorfall",
            body: `${locationName}: ${snippet}`,
            data: { route: "/admin/logbook" },
          },
        })
        .catch((e) => console.error("[guardlog-push] failed", e));

      setContent("");
      clearPhoto();
      setIncidentType("freitext");
      toast.success("Eintrag gespeichert");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (e: Entry) => {
    if (e.photo_url) {
      await supabase.storage.from("guard-log-photos").remove([e.photo_url]);
    }
    const { error } = await supabase.from("guard_log_entries" as any).delete().eq("id", e.id);
    if (error) toast.error(error.message);
    else { toast.success("Gelöscht"); load(); }
  };

  return (
    <Card className={compact ? "p-3 space-y-3" : "p-4 space-y-4"}>
      <div className="flex items-center gap-2">
        <BookText className="w-4 h-4 text-accent" />
        <h3 className="font-display font-semibold text-sm">Wachbuch · {locationName}</h3>
        <Badge variant="secondary" className="ml-auto text-[10px]">{entries.length}</Badge>
      </div>
      {!isPlanner && (
        <p className="text-[10px] text-muted-foreground -mt-1">
          Du siehst nur deine eigenen Einträge. Andere Mitarbeiter sehen ihre nur selbst.
        </p>
      )}

      {canWrite && (
        <div className="space-y-2 rounded-md border border-border/50 bg-muted/20 p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Vorfall-Typ</Label>
              <Select value={incidentType} onValueChange={setIncidentType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Uhrzeit Vorfall</Label>
              <Input
                type="datetime-local"
                value={incidentAt}
                onChange={(e) => setIncidentAt(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Beobachtung, Vorfall, Beschädigung, Übergabe…"
            rows={3}
            className="text-sm resize-none"
          />

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPickPhoto}
            className="hidden"
          />

          {photoPreview ? (
            <div className="relative inline-block">
              <img src={photoPreview} alt="Foto-Vorschau für Wachbuch-Eintrag" className="h-20 w-20 object-cover rounded-md border" />
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                aria-label="Foto entfernen"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => fileRef.current?.click()}>
              <Camera className="w-3.5 h-3.5 mr-1.5" /> Foto hinzufügen
            </Button>
          )}

          <div className="flex justify-end">
            <Button size="sm" className="h-8" disabled={busy || !content.trim()} onClick={submit}>
              <Send className="w-3.5 h-3.5 mr-1.5" /> {busy ? "Speichere…" : "Eintragen"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground py-3 text-center animate-pulse">Lade…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3 text-center">Noch keine Einträge.</p>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {entries.map((e) => {
            const typeLabel = INCIDENT_TYPES.find((t) => t.value === e.incident_type)?.label;
            return (
              <div key={e.id} className="p-2.5 rounded-md bg-muted/40 border border-border/40 space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                  <span className="font-semibold text-foreground">{e.author_name || "Mitarbeiter"}</span>
                  <span>·</span>
                  <span>{format(parseISO(e.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                  {typeLabel && typeLabel !== "Freier Text" && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{typeLabel}</Badge>
                  )}
                  {e.incident_at && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                      Vorfall: {format(parseISO(e.incident_at), "dd.MM. HH:mm", { locale: de })}
                    </Badge>
                  )}
                  {e.author_user_id === userId && (
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={() => remove(e)} aria-label="Wachbuch-Eintrag löschen">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap leading-snug">{e.content}</p>
                {e.photo_signed && (
                  <a href={e.photo_signed} target="_blank" rel="noreferrer" className="inline-block">
                    <img src={e.photo_signed} alt="Bildanhang zum Wachbuch-Eintrag" className="h-24 w-24 object-cover rounded-md border" />
                  </a>
                )}
                {e.photo_url && !e.photo_signed && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <ImageIcon className="w-3 h-3" /> Foto konnte nicht geladen werden
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
