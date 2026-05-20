import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CalendarClock, Plus, Trash2, MapPin, Clock, Navigation, Shield, ShieldCheck, ShieldAlert, ClipboardList, Shirt, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

type Profile = { user_id: string; email: string | null; display_name: string | null };
type GlobalLocation = {
  id: string; name: string; address: string | null;
  lat: number | null; lng: number | null; geofence_radius_m: number;
};
type Shift = {
  id: string; employee_user_id: string; date: string;
  start_time: string; end_time: string; location: string;
  address: string | null;
  lat: number | null; lng: number | null; geofence_radius_m: number | null;
  note: string | null;
  requires_location: boolean;
  location_consent_at: string | null;
  location_consent_declined: boolean;
  start_location_lat: number | null; start_location_lng: number | null;
  end_location_lat: number | null; end_location_lng: number | null;
  service_type: "security" | "cleaning";
  assignment_status: "pending" | "accepted" | "declined";
  responded_at: string | null;
};
type LocPing = { shift_id: string; lat: number; lng: number; recorded_at: string };

export default function ShiftsPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [employeeIds, setEmployeeIds] = useState<Set<string>>(new Set());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [latestLoc, setLatestLoc] = useState<Record<string, LocPing>>({});
  const [globalLocations, setGlobalLocations] = useState<GlobalLocation[]>([]);
  const [savedActivities, setSavedActivities] = useState<string[]>([]);

  const [open, setOpen] = useState(false);
  const [empId, setEmpId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("16:00");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radius, setRadius] = useState<number | null>(null);
  const [activity, setActivity] = useState("");
  const [requiresLocation, setRequiresLocation] = useState(false);
  const [serviceType, setServiceType] = useState<"security" | "cleaning">("security");
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    const [{ data: p }, { data: r }, { data: s }, { data: l }, { data: gl }, { data: ga }] = await Promise.all([
      supabase.from("profiles").select("user_id, email, display_name"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("shifts").select("*").order("date", { ascending: false }).order("start_time"),
      supabase.from("shift_locations").select("shift_id, lat, lng, recorded_at").order("recorded_at", { ascending: false }),
      supabase.from("global_locations").select("id, name, address, lat, lng, geofence_radius_m").order("name"),
      supabase.from("global_activities").select("name").order("name"),
    ]);
    setProfiles(p ?? []);
    const empIds = new Set<string>();
    (r ?? []).forEach((row: any) => { if (row.role === "employee") empIds.add(row.user_id); });
    setEmployeeIds(empIds);
    setShifts((s ?? []) as Shift[]);
    const map: Record<string, LocPing> = {};
    (l ?? []).forEach((row: any) => { if (!map[row.shift_id]) map[row.shift_id] = row; });
    setLatestLoc(map);
    setGlobalLocations((gl ?? []) as GlobalLocation[]);
    setSavedActivities((ga ?? []).map((x: any) => x.name));
  };

  useEffect(() => { refresh(); }, []);

  const employees = useMemo(
    () => profiles.filter((p) => employeeIds.has(p.user_id)),
    [profiles, employeeIds]
  );
  const empLabel = (uid: string) => {
    const p = profiles.find((x) => x.user_id === uid);
    return p?.display_name || p?.email || uid.slice(0, 8);
  };

  // Wenn Name eines bekannten Objekts gewählt wird → Adresse/Koords/Radius übernehmen
  const onLocationChange = (val: string) => {
    setLocation(val);
    const match = globalLocations.find((g) => g.name.toLowerCase() === val.toLowerCase());
    if (match) {
      setAddress(match.address ?? "");
      setLat(match.lat);
      setLng(match.lng);
      setRadius(match.geofence_radius_m);
    }
  };

  const create = async () => {
    if (!user) return;
    if (!empId || !location.trim()) { toast.error("Mitarbeiter und Objekt erforderlich"); return; }
    if (end <= start) { toast.error("Endzeit muss nach Startzeit sein"); return; }
    setCreating(true);
    try {
      const { error } = await supabase.from("shifts").insert({
        employee_user_id: empId,
        created_by: user.id,
        date, start_time: start, end_time: end,
        location: location.trim(),
        address: address.trim() || null,
        lat, lng,
        geofence_radius_m: radius,
        note: activity.trim() || null,
        requires_location: requiresLocation,
        service_type: serviceType,
      });
      if (error) throw error;
      toast.success("Bestellung erstellt");
      setOpen(false);
      setEmpId(""); setLocation(""); setAddress(""); setLat(null); setLng(null);
      setRadius(null); setActivity(""); setRequiresLocation(false); setServiceType("security");
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Fehler");
    } finally { setCreating(false); }
  };

  const remove = async (id: string) => {
    await supabase.from("shifts").delete().eq("id", id);
    refresh();
  };

  const isActive = (s: Shift) => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (s.date !== today) return false;
    const t = now.toTimeString().slice(0, 8);
    return s.start_time <= t && s.end_time >= t;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-lg">Bestellungen</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Neue Bestellung</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Bestellung zuweisen</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Art *</Label>
                <Select value={serviceType} onValueChange={(v) => setServiceType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security">🛡️ Security</SelectItem>
                    <SelectItem value="cleaning">🧹 Reinigung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mitarbeiter *</Label>
                <Select value={empId} onValueChange={setEmpId}>
                  <SelectTrigger><SelectValue placeholder="Wählen…" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.user_id} value={e.user_id}>
                        {e.display_name || e.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Datum *</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start *</Label>
                  <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ende *</Label>
                  <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Objekt / Ort *</Label>
                <Input
                  list="shift-locations"
                  value={location}
                  onChange={(e) => onLocationChange(e.target.value)}
                  placeholder="z.B. Filiale Hauptstraße 12"
                />
                <datalist id="shift-locations">
                  {globalLocations.map((g) => <option key={g.id} value={g.name} />)}
                </datalist>
                {address && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {address}
                    {lat != null && lng != null && ` · ${radius ?? 0} m Geofence`}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Adresse (optional, wird dem Mitarbeiter angezeigt)</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Straße, PLZ, Ort"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tätigkeit (optional)</Label>
                <Input
                  list="shift-activities"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  placeholder="z.B. Maler-Arbeiten"
                />
                <datalist id="shift-activities">
                  {savedActivities.map((n) => <option key={n} value={n} />)}
                </datalist>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="space-y-0.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Standort-Pflicht
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Mitarbeiter muss Standort-Freigabe akzeptieren, sonst werden die Stunden nicht angerechnet.
                  </p>
                </div>
                <Switch checked={requiresLocation} onCheckedChange={setRequiresLocation} />
              </div>
              <Button className="w-full" onClick={create} disabled={creating}>
                {creating ? "Erstelle…" : "Schicht erstellen"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {shifts.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">Noch keine Schichten geplant.</Card>
      ) : (
        <div className="space-y-2">
          {shifts.map((s) => {
            const active = isActive(s);
            const loc = latestLoc[s.id];
            return (
              <Card
                key={s.id}
                className={`p-3 space-y-1.5 border-l-4 ${
                  s.assignment_status === "accepted"
                    ? "border-l-emerald-500 bg-emerald-500/5"
                    : s.assignment_status === "declined"
                    ? "border-l-destructive bg-destructive/5"
                    : "border-l-muted-foreground/40"
                } ${active ? "ring-1 ring-primary/40" : ""}`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-semibold uppercase tracking-wide">
                    {s.service_type === "cleaning" ? "🧹 Reinigung" : "🛡️ Security"}
                  </span>
                  <span className="font-medium text-sm flex-1 truncate">{empLabel(s.employee_user_id)}</span>
                  {s.assignment_status === "accepted" && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Besetzt
                    </span>
                  )}
                  {s.assignment_status === "declined" && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-semibold">
                      <XCircle className="w-3 h-3" /> Nicht besetzt
                    </span>
                  )}
                  {s.assignment_status === "pending" && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-semibold">
                      <HelpCircle className="w-3 h-3" /> Offen
                    </span>
                  )}
                  {active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">LIVE</span>}
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(s.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {format(parseISO(s.date), "EEE, d. MMM", { locale: de })} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {s.location}
                </div>
                {s.address && (
                  <p className="text-[11px] text-muted-foreground pl-5">{s.address}</p>
                )}
                {s.note && (
                  <div className="text-xs text-muted-foreground pl-5">↳ {s.note}</div>
                )}
                {s.requires_location ? (
                  s.location_consent_declined ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">
                      <ShieldAlert className="w-3 h-3" /> Abgelehnt – Stunden zählen nicht
                    </span>
                  ) : s.location_consent_at ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-medium">
                      <ShieldCheck className="w-3 h-3" /> Standort freigegeben
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-medium">
                      <Shield className="w-3 h-3" /> Pflicht – Freigabe ausstehend
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    Standort optional
                  </span>
                )}
                {(s.start_location_lat || s.end_location_lat) && (
                  <div className="flex gap-3 text-[10px] text-muted-foreground pt-1">
                    {s.start_location_lat != null && s.start_location_lng != null && (
                      <a
                        href={`https://www.google.com/maps?q=${s.start_location_lat},${s.start_location_lng}`}
                        target="_blank" rel="noreferrer"
                        className="hover:underline text-emerald-600"
                      >
                        🟢 Start-Standort
                      </a>
                    )}
                    {s.end_location_lat != null && s.end_location_lng != null && (
                      <a
                        href={`https://www.google.com/maps?q=${s.end_location_lat},${s.end_location_lng}`}
                        target="_blank" rel="noreferrer"
                        className="hover:underline text-destructive"
                      >
                        🔴 End-Standort
                      </a>
                    )}
                  </div>
                )}
                {active && loc && (
                  <a
                    href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline pt-1"
                  >
                    <Navigation className="w-3 h-3" />
                    Live-Standort ({loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}) · {format(new Date(loc.recorded_at), "HH:mm:ss")}
                  </a>
                )}
                {active && !loc && (
                  <p className="text-[11px] text-muted-foreground italic">Warte auf Standort…</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
