import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users, ChevronLeft, FileText, FileSpreadsheet, Eye,
  MapPin, Clock, Coffee, ShieldCheck, Trash2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";
import { calculateDurationMinutes } from "@/lib/types";
import { exportToPDF } from "@/lib/exportPDF";
import { exportToCSV } from "@/lib/exportCSV";

type Profile = { user_id: string; email: string | null; display_name: string | null; phone: string | null };
type WorkEntry = Tables<"work_entries">;

const entryMinutes = (e: WorkEntry) => {
  const m = calculateDurationMinutes(e.start_time, e.end_time);
  return e.include_break ? Math.max(0, m - (e.break_minutes ?? 0)) : m;
};

export default function EmployeesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [employeeIds, setEmployeeIds] = useState<Set<string>>(new Set());
  const [allEntries, setAllEntries] = useState<WorkEntry[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAll = async () => {
    const [{ data: p }, { data: r }, { data: ent }] = await Promise.all([
      supabase.from("profiles").select("user_id, email, display_name, phone"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("work_entries").select("*").order("date", { ascending: false }).order("start_time", { ascending: false }),
    ]);
    setProfiles(p ?? []);
    const empIds = new Set<string>();
    (r ?? []).forEach((row: any) => { if (row.role === "employee") empIds.add(row.user_id); });
    setEmployeeIds(empIds);
    setAllEntries(ent ?? []);
  };

  const deleteEmployee = async (uid: string, name: string) => {
    setDeletingId(uid);
    try {
      const { data, error } = await supabase.functions.invoke("delete-employee", {
        body: { userId: uid },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || "Fehler");
      }
      toast.success(`${name} wurde entfernt.`);
      if (selectedEmployee === uid) setSelectedEmployee(null);
      await loadAll();
    } catch (e: any) {
      toast.error(e?.message || "Mitarbeiter konnte nicht entfernt werden");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const employees = useMemo(
    () => profiles.filter((p) => employeeIds.has(p.user_id)),
    [profiles, employeeIds]
  );

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

  const profileLabel = (uid: string) => {
    const p = profiles.find((x) => x.user_id === uid);
    return p?.display_name || p?.email || uid.slice(0, 8);
  };

  if (selectedEmployee) {
    let entries = allEntries.filter((e) => e.user_id === selectedEmployee);
    if (filterMonth) {
      const [y, m] = filterMonth.split("-").map(Number);
      entries = entries.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === y && d.getMonth() === m - 1;
      });
    }
    const totalMin = entries.reduce((s, e) => s + entryMinutes(e), 0);
    const empName = profileLabel(selectedEmployee);
    const grouped = entries.reduce<Record<string, WorkEntry[]>>((acc, e) => {
      (acc[e.date] ??= []).push(e);
      return acc;
    }, {});
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    const empProfile = profiles.find((p) => p.user_id === selectedEmployee);
    const empPhone = empProfile?.phone;
    return (
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSelectedEmployee(null); setFilterMonth(""); }}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-lg leading-tight truncate">{empName}</h1>
            <p className="text-[11px] text-muted-foreground">
              Nur-Lese-Ansicht · {entries.length} Einträge{empPhone ? ` · ${empPhone}` : ""}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" disabled={deletingId === selectedEmployee}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mitarbeiter entfernen?</AlertDialogTitle>
                <AlertDialogDescription>
                  {empName} und alle zugehörigen Daten (Schichten, Einträge, Standorte) werden dauerhaft gelöscht. Dies kann nicht rückgängig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteEmployee(selectedEmployee!, empName)}
                >
                  Endgültig entfernen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

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
          />
          {filterMonth && <Button variant="outline" size="sm" onClick={() => setFilterMonth("")}>Alle</Button>}
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
              const dayMin = dayEntries.reduce((s, e) => s + entryMinutes(e), 0);
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
                        {e.description && <p className="text-xs text-foreground/80">{e.description}</p>}
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
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h1 className="font-display font-bold text-lg">Mitarbeiter ({employees.length})</h1>
      </div>

      {employees.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Noch keine Mitarbeiter. Erstelle einen Einladungslink im Bereich „Einladungen".
        </Card>
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
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-semibold text-sm text-primary shrink-0">
                  {(emp.display_name || emp.email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{emp.display_name || emp.email}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {stats.count} Einträge · {Math.floor(stats.minutes / 60)}h {stats.minutes % 60}m
                  </div>
                </div>
                <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
