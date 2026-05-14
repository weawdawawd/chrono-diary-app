import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase, LogOut, ShieldCheck, Plus, Copy, Trash2, Users, Link2,
  ChevronLeft, FileText, FileSpreadsheet, Eye, MapPin, Clock, Coffee, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import DarkModeToggle from "@/components/DarkModeToggle";
import { exportToPDF } from "@/lib/exportPDF";
import { exportToCSV } from "@/lib/exportCSV";
import type { Tables } from "@/integrations/supabase/types";
import { calculateDurationMinutes } from "@/lib/types";

const entryMinutes = (e: { start_time: string; end_time: string; break_minutes: number; include_break: boolean }) => {
  const m = calculateDurationMinutes(e.start_time, e.end_time);
  return e.include_break ? Math.max(0, m - (e.break_minutes ?? 0)) : m;
};

type Profile = { user_id: string; email: string | null; display_name: string | null };
type Invitation = Tables<"invitations">;
type WorkEntry = Tables<"work_entries">;

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [employeeIds, setEmployeeIds] = useState<Set<string>>(new Set());
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [allEntries, setAllEntries] = useState<WorkEntry[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  // Invite form
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creating, setCreating] = useState(false);

  // Filter for entries (month)
  const [filterMonth, setFilterMonth] = useState<string>(""); // "yyyy-MM" or ""

  const refresh = async () => {
    const [{ data: p }, { data: r }, { data: inv }, { data: ent }] = await Promise.all([
      supabase.from("profiles").select("user_id, email, display_name"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("invitations").select("*").order("created_at", { ascending: false }),
      supabase.from("work_entries").select("*").order("date", { ascending: false }).order("start_time", { ascending: false }),
    ]);
    setProfiles(p ?? []);
    const empIds = new Set<string>();
    (r ?? []).forEach((row: any) => { if (row.role === "employee") empIds.add(row.user_id); });
    setEmployeeIds(empIds);
    setInvitations(inv ?? []);
    setAllEntries(ent ?? []);
  };

  useEffect(() => { refresh(); }, []);

  const employees = useMemo(
    () => profiles.filter((p) => employeeIds.has(p.user_id)),
    [profiles, employeeIds]
  );

  const profileLabel = (uid: string) => {
    const p = profiles.find((x) => x.user_id === uid);
    return p?.display_name || p?.email || uid.slice(0, 8);
  };

  const employeeStats = useMemo(() => {
    const map = new Map<string, { count: number; minutes: number }>();
    for (const e of allEntries) {
      const cur = map.get(e.user_id) ?? { count: 0, minutes: 0 };
      cur.count += 1;
      cur.minutes += entryMinutes(e);
      map.set(e.user_id, cur);
    }
    return map;
  }, [allEntries]);

  const createInvitation = async () => {
    if (!user) return;
    if (!newName.trim()) { toast.error("Bitte Name eingeben"); return; }
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("invitations")
        .insert({
          created_by: user.id,
          role: "employee",
          note: newName.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      const link = `${window.location.origin}/invite/${data.token}`;
      try { await navigator.clipboard.writeText(link); } catch {}
      toast.success("Einladungslink kopiert!", { description: link });
      // WhatsApp öffnen
      openWhatsApp(link, newName.trim(), newPhone.trim());
      setNewName("");
      setNewPhone("");
      setInviteOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Erstellen");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link kopiert!");
  };

  const shareWhatsApp = (token: string, name: string | null) => {
    const link = `${window.location.origin}/invite/${token}`;
    openWhatsApp(link, name || "", "");
  };

  const openWhatsApp = (link: string, name: string, phone: string) => {
    const greeting = name ? `Hallo ${name},` : "Hallo,";
    const text = `${greeting}\n\nhier ist dein persönlicher Einladungslink für die Stunden-App:\n${link}\n\nBitte öffne den Link und erstelle dein Konto. Danke!`;
    const cleanPhone = phone.replace(/[^\d]/g, "");
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const deleteInvitation = async (id: string) => {
    await supabase.from("invitations").delete().eq("id", id);
    refresh();
  };


  // Employee detail view
  if (selectedEmployee) {
    let entries = allEntries.filter((e) => e.user_id === selectedEmployee);
    if (filterMonth) {
      const [y, m] = filterMonth.split("-").map(Number);
      entries = entries.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === y && d.getMonth() === m - 1;
      });
    }
    const totalMin = entries.reduce(
      (s, e) => s + entryMinutes(e),
      0
    );
    const empName = profileLabel(selectedEmployee);

    const grouped = entries.reduce<Record<string, WorkEntry[]>>((acc, e) => {
      (acc[e.date] ??= []).push(e);
      return acc;
    }, {});
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSelectedEmployee(null); setFilterMonth(""); }}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-base leading-tight truncate">{empName}</h1>
              <p className="text-[11px] text-muted-foreground">Nur-Lese-Ansicht · {entries.length} Einträge</p>
            </div>
            <DarkModeToggle />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Gesamt</p>
                <p className="font-display font-bold text-2xl">
                  {Math.floor(totalMin / 60)}h {totalMin % 60}min
                </p>
              </div>
              <ShieldCheck className="w-6 h-6 text-primary opacity-60" />
            </div>
          </Card>

          <div className="flex gap-2">
            <Input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="h-9 text-sm flex-1"
              placeholder="Monat filtern"
            />
            {filterMonth && (
              <Button variant="outline" size="sm" onClick={() => setFilterMonth("")}>Alle</Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" disabled={entries.length === 0} onClick={() => exportToPDF(entries)}>
              <FileText className="w-3.5 h-3.5 mr-1.5" /> PDF drucken
            </Button>
            <Button variant="outline" size="sm" disabled={entries.length === 0} onClick={() => exportToCSV(entries)}>
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> CSV
            </Button>
          </div>

          {entries.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">Keine Einträge vorhanden.</p>
          ) : (
            <div className="space-y-4">
              {sortedDates.map((date) => {
                const dayEntries = grouped[date];
                const dayMin = dayEntries.reduce(
                  (s, e) => s + entryMinutes(e),
                  0
                );
                return (
                  <div key={date} className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {format(parseISO(date), "EEEE, d. MMM yyyy", { locale: de })}
                      </p>
                      <Badge variant="secondary" className="text-[10px]">
                        {Math.floor(dayMin / 60)}h {dayMin % 60}m
                      </Badge>
                    </div>
                    {dayEntries.map((e) => {
                      const min = entryMinutes(e);
                      return (
                        <Card key={e.id} className="p-3 space-y-1.5">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {e.start_time.slice(0, 5)} – {e.end_time.slice(0, 5)}
                            <Badge variant="outline" className="ml-auto text-[10px]">
                              {Math.floor(min / 60)}h {min % 60}m
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" /> {e.location}
                          </div>
                          {e.description && (
                            <p className="text-xs text-foreground/80">{e.description}</p>
                          )}
                          {e.break_minutes > 0 && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Coffee className="w-3 h-3" /> {e.break_minutes}min Pause {e.include_break ? "(abgezogen)" : "(nicht abgezogen)"}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Main admin home
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-lg leading-tight">Admin-Bereich</h1>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <DarkModeToggle />
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Abmelden" className="h-9 w-9">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Create invitation */}
        <Card className="p-4 space-y-3 border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold">Mitarbeiter einladen</h2>
            </div>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Neuer Link</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Einladungslink erstellen</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name des Mitarbeiters *</Label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="z.B. Max Mustermann"
                      autoFocus
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Der Name hilft dir, den Mitarbeiter später in der Liste wiederzufinden.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">WhatsApp-Nummer (optional)</Label>
                    <Input
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="z.B. 491701234567"
                      inputMode="tel"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Mit Ländervorwahl ohne "+" oder "00" (z.B. 49 für Deutschland). Leer lassen, um den Kontakt in WhatsApp selbst zu wählen.
                    </p>
                  </div>
                  <Button className="w-full" onClick={createInvitation} disabled={creating}>
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {creating ? "Erstelle…" : "Erstellen & per WhatsApp senden"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {invitations.length === 0 ? (
            <p className="text-xs text-muted-foreground">Noch keine Einladungen erstellt.</p>
          ) : (
            <div className="space-y-1.5">
              {invitations.map((inv) => {
                const expired = new Date(inv.expires_at) < new Date();
                const used = !!inv.used_at;
                return (
                  <div key={inv.id} className="flex items-center gap-2 text-xs p-2.5 rounded-lg bg-muted/40">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{inv.note || "Einladung"}</div>
                      <div className="text-muted-foreground">
                        {used
                          ? `Verwendet am ${format(new Date(inv.used_at!), "d. MMM", { locale: de })}`
                          : expired
                          ? "Abgelaufen"
                          : `Gültig bis ${format(new Date(inv.expires_at), "d. MMM yyyy", { locale: de })}`}
                      </div>
                    </div>
                    {!used && !expired && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(inv.token)}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteInvitation(inv.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Employees */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold">Mitarbeiter ({employees.length})</h2>
          </div>

          {employees.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Noch keine Mitarbeiter. Erstelle oben einen Einladungslink und schicke ihn deinem Mitarbeiter.
            </p>
          ) : (
            <div className="space-y-1.5">
              {employees.map((emp) => {
                const stats = employeeStats.get(emp.user_id) ?? { count: 0, minutes: 0 };
                return (
                  <button
                    key={emp.user_id}
                    onClick={() => setSelectedEmployee(emp.user_id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted transition text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-semibold text-sm text-primary">
                      {(emp.display_name || emp.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{emp.display_name || emp.email}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {stats.count} Einträge · {Math.floor(stats.minutes / 60)}h {stats.minutes % 60}m
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
