import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, MapPin, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Item = { id: string; name: string };

function CatalogList({
  table,
  title,
  icon: Icon,
  placeholder,
}: {
  table: "global_locations" | "global_activities";
  title: string;
  icon: typeof MapPin;
  placeholder: string;
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");

  const load = async () => {
    const { data, error } = await supabase.from(table).select("id, name").order("name");
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed || !user) return;
    const { error } = await supabase.from(table).insert({ name: trimmed, created_by: user.id });
    if (error) {
      toast.error(error.message);
      return;
    }
    setName("");
    toast.success("Hinzugefügt");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    load();
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="font-display font-semibold text-sm">{title}</h2>
        <span className="text-xs text-muted-foreground ml-auto">{items.length}</span>
      </div>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button size="sm" onClick={add}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-1">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground">Noch nichts hinzugefügt.</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-sm p-2 rounded bg-muted/40"
          >
            <span className="truncate">{item.name}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => remove(item.id)}
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function CatalogPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
      <div>
        <h1 className="font-display font-bold text-lg">Objekte & Tätigkeiten</h1>
        <p className="text-xs text-muted-foreground">
          Globale Liste – wird allen Mitarbeitern als Vorschlag angezeigt.
        </p>
      </div>
      <CatalogList
        table="global_locations"
        title="Objekte / Standorte"
        icon={MapPin}
        placeholder="z.B. Baustelle Müllerstraße"
      />
      <CatalogList
        table="global_activities"
        title="Tätigkeiten"
        icon={Briefcase}
        placeholder="z.B. Maler-Arbeiten"
      />
    </div>
  );
}
