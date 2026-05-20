import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, MapPin, Briefcase, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type LocationItem = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  geofence_radius_m: number;
};

type ActivityItem = { id: string; name: string };

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() < 13 ? 14 : map.getZoom());
  }, [center, map]);
  return null;
}

function LocationDialog({
  item,
  onClose,
  onSaved,
}: {
  item: LocationItem | null; // null = neu
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState(item?.name ?? "");
  const [address, setAddress] = useState(item?.address ?? "");
  const [lat, setLat] = useState<number | null>(item?.lat ?? null);
  const [lng, setLng] = useState<number | null>(item?.lng ?? null);
  const [radius, setRadius] = useState<number>(item?.geofence_radius_m ?? 200);
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);

  const center: [number, number] =
    lat != null && lng != null ? [lat, lng] : [51.1657, 10.4515];

  const geocode = async () => {
    if (!address.trim()) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          address
        )}`,
        { headers: { Accept: "application/json" } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        setLat(parseFloat(data[0].lat));
        setLng(parseFloat(data[0].lon));
        toast.success("Adresse gefunden");
      } else {
        toast.error("Adresse nicht gefunden");
      }
    } catch (e: any) {
      toast.error(e.message || "Geocoding fehlgeschlagen");
    } finally {
      setGeocoding(false);
    }
  };

  const save = async () => {
    if (!name.trim() || !user) {
      toast.error("Name ist erforderlich");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        address: address.trim() || null,
        lat,
        lng,
        geofence_radius_m: radius,
      };
      if (item) {
        const { error } = await supabase
          .from("global_locations")
          .update(payload)
          .eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("global_locations")
          .insert({ ...payload, created_by: user.id });
        if (error) throw error;
      }
      toast.success(item ? "Aktualisiert" : "Hinzugefügt");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Fehler");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{item ? "Objekt bearbeiten" : "Neues Objekt"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Baustelle Müllerstraße" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Adresse</Label>
          <div className="flex gap-2">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Müllerstraße 12, 10557 Berlin"
            />
            <Button size="sm" variant="outline" onClick={geocode} disabled={geocoding || !address.trim()}>
              <Search className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Adresse eingeben und Lupe drücken, oder auf der Karte tippen
          </p>
        </div>
        <div className="h-52 rounded-lg overflow-hidden border border-border">
          <MapContainer center={center} zoom={lat != null ? 14 : 6} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onClick={(la, ln) => { setLat(la); setLng(ln); }} />
            {lat != null && lng != null && (
              <>
                <RecenterMap center={[lat, lng]} />
                <Marker position={[lat, lng]} />
                {radius > 0 && (
                  <Circle
                    center={[lat, lng]}
                    radius={radius}
                    pathOptions={{ color: "#3b82f6", fillOpacity: 0.15 }}
                  />
                )}
              </>
            )}
          </MapContainer>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Geofence-Radius</Label>
            <span className="text-xs font-medium">{radius} m</span>
          </div>
          <Slider
            value={[radius]}
            min={0}
            max={2000}
            step={25}
            onValueChange={(v) => setRadius(v[0])}
          />
          <p className="text-[10px] text-muted-foreground">
            0 = kein Geofence. Wird auf der Live-Karte als Kreis um das Objekt angezeigt.
          </p>
        </div>
        {lat != null && lng != null && (
          <p className="text-[10px] text-muted-foreground">
            Koordinaten: {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        )}
        <Button className="w-full" onClick={save} disabled={saving}>
          {saving ? "Speichere…" : "Speichern"}
        </Button>
      </div>
    </DialogContent>
  );
}

function LocationsCard() {
  const [items, setItems] = useState<LocationItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LocationItem | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("global_locations")
      .select("id, name, address, lat, lng, geofence_radius_m")
      .order("name");
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((data ?? []) as LocationItem[]);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Objekt löschen?")) return;
    const { error } = await supabase.from("global_locations").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" />
        <h2 className="font-display font-semibold text-sm">Objekte / Standorte</h2>
        <span className="text-xs text-muted-foreground ml-auto">{items.length}</span>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogTrigger asChild>
          <Button size="sm" onClick={() => setEditing(null)} className="w-full">
            <Plus className="w-4 h-4 mr-1" /> Neues Objekt
          </Button>
        </DialogTrigger>
        {dialogOpen && (
          <LocationDialog
            item={editing}
            onClose={() => { setDialogOpen(false); setEditing(null); }}
            onSaved={load}
          />
        )}
      </Dialog>

      <div className="space-y-1">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground">Noch keine Objekte angelegt.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="p-2 rounded bg-muted/40 space-y-0.5">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium flex-1 truncate">{item.name}</span>
              <Button
                size="icon" variant="ghost" className="h-7 w-7"
                onClick={() => { setEditing(item); setDialogOpen(true); }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(item.id)}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
            {item.address && (
              <p className="text-[11px] text-muted-foreground truncate">{item.address}</p>
            )}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {item.lat != null && item.lng != null ? (
                <span>📍 {item.lat.toFixed(4)}, {item.lng.toFixed(4)}</span>
              ) : (
                <span className="text-amber-500">⚠ keine Koordinaten</span>
              )}
              <span>· Geofence {item.geofence_radius_m} m</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ActivitiesCard() {
  const { user } = useAuth();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [name, setName] = useState("");

  const load = async () => {
    const { data } = await supabase.from("global_activities").select("id, name").order("name");
    setItems((data ?? []) as ActivityItem[]);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const t = name.trim();
    if (!t || !user) return;
    const { error } = await supabase.from("global_activities").insert({ name: t, created_by: user.id });
    if (error) { toast.error(error.message); return; }
    setName(""); toast.success("Hinzugefügt"); load();
  };

  const remove = async (id: string) => {
    await supabase.from("global_activities").delete().eq("id", id);
    load();
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-primary" />
        <h2 className="font-display font-semibold text-sm">Tätigkeiten</h2>
        <span className="text-xs text-muted-foreground ml-auto">{items.length}</span>
      </div>
      <div className="flex gap-2">
        <Input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Maler-Arbeiten"
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button size="sm" onClick={add}><Plus className="w-4 h-4" /></Button>
      </div>
      <div className="space-y-1">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground">Noch nichts hinzugefügt.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/40">
            <span className="truncate">{item.name}</span>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(item.id)}>
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
          Globale Liste mit Adresse und Geofence pro Objekt.
        </p>
      </div>
      <LocationsCard />
      <ActivitiesCard />
    </div>
  );
}
