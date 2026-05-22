import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookText, Send, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

type Entry = {
  id: string;
  content: string;
  created_at: string;
  author_user_id: string;
  author_name?: string;
};

interface Props {
  locationName: string;
  shiftId?: string;
  userId: string;
  /** When true the user can write entries (accepted shift or planner). */
  canWrite: boolean;
  compact?: boolean;
}

export default function GuardLog({ locationName, shiftId, userId, canWrite, compact }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("guard_log_entries" as any)
      .select("id, content, created_at, author_user_id")
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
      setEntries(list);
    }
    setLoading(false);
  }, [locationName]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    const text = content.trim();
    if (!text) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("guard_log_entries" as any).insert({
        location_name: locationName,
        shift_id: shiftId ?? null,
        author_user_id: userId,
        content: text,
      });
      if (error) throw error;
      setContent("");
      toast.success("Eintrag gespeichert");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("guard_log_entries" as any).delete().eq("id", id);
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

      {canWrite && (
        <div className="space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Beobachtung, Vorfall, Übergabe…"
            rows={3}
            className="text-sm resize-none"
          />
          <div className="flex justify-end">
            <Button size="sm" className="h-8" disabled={busy || !content.trim()} onClick={submit}>
              <Send className="w-3.5 h-3.5 mr-1.5" /> Eintragen
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
          {entries.map((e) => (
            <div key={e.id} className="p-2.5 rounded-md bg-muted/40 border border-border/40 space-y-1">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">{e.author_name || "Mitarbeiter"}</span>
                <span>·</span>
                <span>{format(parseISO(e.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                {e.author_user_id === userId && (
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={() => remove(e.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap leading-snug">{e.content}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
