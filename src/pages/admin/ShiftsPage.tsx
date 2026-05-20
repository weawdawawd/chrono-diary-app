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
import { CalendarClock, Plus, Trash2, MapPin, Clock, Navigation, Shield, ShieldCheck, ShieldAlert, ClipboardList, Shirt, CheckCircle2, XCircle, HelpCircle, LayoutList, Building2, Search, X, Ban } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ShiftMiniCalendar from "@/components/ShiftMiniCalendar";

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
  assignment_status: "pending" | "accepted" | "declined" | "cancelled";
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

  // Filter
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "accepted" | "declined" | "cancelled">("all");
  const [filterService, setFilterService] = useState<"all" | "security" | "cleaning">("all");
  const [filterEmployee, setFilterEmployee] = useState<string>("all");

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

  // Vorschläge: globale Objekte + bereits genutzte Schicht-Orte (eindeutig)
  const locationSuggestions = useMemo(() => {
    const set = new Map<string, string>(); // lowercase -> original
    globalLocations.forEach((g) => set.set(g.name.toLowerCase(), g.name));
    shifts.forEach((s) => {
      const k = s.location.trim().toLowerCase();
      if (k && !set.has(k)) set.set(k, s.location.trim());
    });
    return Array.from(set.values()).sort();
  }, [globalLocations, shifts]);

  // Vorschläge: globale Tätigkeiten + bereits genutzte Notes
  const activitySuggestions = useMemo(() => {
    const set = new Map<string, string>();
    savedActivities.forEach((n) => set.set(n.toLowerCase(), n));
    shifts.forEach((s) => {
      const n = (s.note ?? "").trim();
      if (n) {
        const k = n.toLowerCase();
        if (!set.has(k)) set.set(k, n);
      }
    });
    return Array.from(set.values()).sort();
  }, [savedActivities, shifts]);

  // Gefilterte Bestellungen
  const filteredShifts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shifts.filter((s) => {
      if (filterStatus !== "all" && s.assignment_status !== filterStatus) return false;
      if (filterService !== "all" && s.service_type !== filterService) return false;
      if (filterEmployee !== "all" && s.employee_user_id !== filterEmployee) return false;
      if (q) {
        const emp = empLabel(s.employee_user_id).toLowerCase();
        const hay = `${s.location} ${s.address ?? ""} ${s.note ?? ""} ${emp} ${s.date}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [shifts, search, filterStatus, filterService, filterEmployee, profiles]);

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
    if (!confirm("Diese Bestellung endgültig löschen?")) return;
    await supabase.from("shifts").delete().eq("id", id);
    refresh();
  };

  const cancel = async (id: string) => {
    if (!confirm("Diese Schicht stornieren? Der Mitarbeiter wird informiert.")) return;
    const { error } = await supabase
      .from("shifts")
      .update({ assignment_status: "cancelled", responded_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Schicht storniert");
    refresh();
  };

  const reactivate = async (id: string) => {
    const { error } = await supabase
      .from("shifts")
      .update({ assignment_status: "pending", responded_at: null })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Schicht reaktiviert");
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
                  {locationSuggestions.map((n) => <option key={n} value={n} />)}
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
                  {activitySuggestions.map((n) => <option key={n} value={n} />)}
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
        <Card className="p-6 text-center text-sm text-muted-foreground">Noch keine Bestellungen.</Card>
      ) : (
        <>
          {/* Filter bar */}
          <Card className="p-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Suche: Objekt, Mitarbeiter, Adresse, Datum…"
                className="h-9 text-sm pl-8 pr-8"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Suche löschen"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="pending">Offen</SelectItem>
                  <SelectItem value="accepted">Besetzt</SelectItem>
                  <SelectItem value="declined">Abgelehnt</SelectItem>
                  <SelectItem value="cancelled">Storniert</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterService} onValueChange={(v) => setFilterService(v as any)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Arten</SelectItem>
                  <SelectItem value="security">🛡️ Security</SelectItem>
                  <SelectItem value="cleaning">🧹 Reinigung</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.user_id} value={e.user_id}>
                      {e.display_name || e.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {filteredShifts.length} von {shifts.length} Bestellungen
              {(search || filterStatus !== "all" || filterService !== "all" || filterEmployee !== "all") && (
                <button
                  onClick={() => { setSearch(""); setFilterStatus("all"); setFilterService("all"); setFilterEmployee("all"); }}
                  className="ml-2 text-primary hover:underline"
                >
                  Filter zurücksetzen
                </button>
              )}
            </p>
          </Card>

          {filteredShifts.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Keine Bestellungen entsprechen den Filterkriterien.
            </Card>
          ) : (
        <Tabs defaultValue="objects">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="objects"><Building2 className="w-3.5 h-3.5 mr-1.5" /> Nach Objekt</TabsTrigger>
            <TabsTrigger value="list"><LayoutList className="w-3.5 h-3.5 mr-1.5" /> Liste</TabsTrigger>
          </TabsList>

          <TabsContent value="objects" className="space-y-3 mt-3">
            {(() => {
              // Group by object (location)
              const groups = new Map<string, Shift[]>();
              for (const s of filteredShifts) {
                const key = s.location.trim();
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key)!.push(s);
              }
              // Sort by total quantity desc
              const sorted = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
              return sorted.map(([loc, list]) => {
                const securityCount = list.filter((x) => x.service_type === "security").length;
                const cleaningCount = list.filter((x) => x.service_type === "cleaning").length;
                const accepted = list.filter((x) => x.assignment_status === "accepted").length;
                const pending = list.filter((x) => x.assignment_status === "pending").length;
                const declined = list.filter((x) => x.assignment_status === "declined").length;
                const address = list.find((x) => x.address)?.address;
                return (
                  <Card key={loc} className="p-3 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{loc}</h3>
                        {address && <p className="text-[11px] text-muted-foreground truncate">{address}</p>}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold shrink-0">
                        {list.length} Schicht{list.length === 1 ? "" : "en"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {securityCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-muted font-medium">🛡️ Security: {securityCount}</span>
                      )}
                      {cleaningCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-muted font-medium">🧹 Reinigung: {cleaningCount}</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-medium">
                        ✓ {accepted} besetzt
                      </span>
                      {pending > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-medium">
                          ? {pending} offen
                        </span>
                      )}
                      {declined > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">
                          ✕ {declined} abgelehnt
                        </span>
                      )}
                    </div>
                    <ShiftMiniCalendar
                      shifts={list.map((s) => ({
                        id: s.id,
                        date: s.date,
                        start_time: s.start_time,
                        end_time: s.end_time,
                        assignment_status: s.assignment_status,
                        service_type: s.service_type,
                      }))}
                    />
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Schichten anzeigen ({list.length})
                      </summary>
                      <div className="mt-2 space-y-1">
                        {list.map((s) => (
                          <div key={s.id} className="flex items-center gap-2 text-[11px] py-1 border-b last:border-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              s.assignment_status === "accepted" ? "bg-emerald-500"
                              : s.assignment_status === "declined" ? "bg-destructive" : "bg-amber-500"
                            }`} />
                            <span className="text-muted-foreground">{format(parseISO(s.date), "dd.MM", { locale: de })}</span>
                            <span>{s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}</span>
                            <span className="flex-1 truncate">{empLabel(s.employee_user_id)}</span>
                            <span className="text-[9px]">{s.service_type === "cleaning" ? "🧹" : "🛡️"}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </Card>
                );
              });
            })()}
          </TabsContent>

          <TabsContent value="list" className="space-y-2 mt-3">
            {filteredShifts.map((s) => {
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
          </TabsContent>
        </Tabs>
          )}
        </>
      )}
    </div>
  );
}
