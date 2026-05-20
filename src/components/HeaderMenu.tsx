import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Settings, Download, Moon, Sun, CalendarClock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import MyShifts from "@/components/MyShifts";
import MyShiftsCalendar from "@/components/MyShiftsCalendar";
import SettingsDialog from "@/components/SettingsDialog";
import ExportDialog from "@/components/ExportDialog";
import type { Project } from "@/hooks/useProjects";
import type { UserSettings } from "@/hooks/useUserSettings";
import type { WorkEntry } from "@/lib/types";
import { useEffect } from "react";

interface Props {
  email?: string;
  entries: WorkEntry[];
  settings: UserSettings | null;
  onSaveSettings: (h: number) => Promise<void>;
  projects: Project[];
  onAddProject: (name: string, client?: string, color?: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onSignOut: () => void;
}

export default function HeaderMenu({
  email, entries, settings, onSaveSettings, projects, onAddProject, onDeleteProject, onSignOut,
}: Props) {
  const [open, setOpen] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-accent/10" aria-label="Menü">
            <Menu className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {email && <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground truncate">{email}</DropdownMenuLabel>}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpenExport(true); setOpen(false); }} disabled={entries.length === 0}>
            <Download className="w-4 h-4 mr-2 text-accent" /> Export (PDF / CSV)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpenSettings(true); setOpen(false); }}>
            <Settings className="w-4 h-4 mr-2 text-accent" /> Einstellungen
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setDark((d) => !d); }}>
            {dark ? <Sun className="w-4 h-4 mr-2 text-accent" /> : <Moon className="w-4 h-4 mr-2 text-accent" />}
            {dark ? "Heller Modus" : "Dunkler Modus"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" /> Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden trigger wrappers — open programmatically */}
      <div className="hidden">
        <SettingsDialogWrapper
          open={openSettings}
          onOpenChange={setOpenSettings}
          settings={settings}
          onSaveSettings={onSaveSettings}
          projects={projects}
          onAddProject={onAddProject}
          onDeleteProject={onDeleteProject}
        />
        <ExportDialogWrapper open={openExport} onOpenChange={setOpenExport} entries={entries} />
      </div>
    </>
  );
}

// Lightweight wrappers to control the existing dialogs externally.
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function SettingsDialogWrapper(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  settings: UserSettings | null;
  onSaveSettings: (h: number) => Promise<void>;
  projects: Project[];
  onAddProject: (n: string, c?: string, col?: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}) {
  // Re-use SettingsDialog body via a hidden mount trick: render the existing component
  // by toggling its own internal state through a custom controlled clone.
  return (
    <ControlledSettings {...props} />
  );
}

function ExportDialogWrapper({ open, onOpenChange, entries }: { open: boolean; onOpenChange: (v: boolean) => void; entries: WorkEntry[] }) {
  return <ControlledExport open={open} onOpenChange={onOpenChange} entries={entries} />;
}

// Controlled clones using the same UI primitives
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, FileText, FileSpreadsheet } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { format } from "date-fns";
import { exportToPDF } from "@/lib/exportPDF";
import { exportToCSV } from "@/lib/exportCSV";

const PROJECT_COLORS = ["#C9A961","#D62828","#1a1a1a","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899"];

function ControlledSettings({ open, onOpenChange, settings, onSaveSettings, projects, onAddProject, onDeleteProject }: any) {
  const [weeklyHours, setWeeklyHours] = useState(settings?.weekly_target_hours ?? 40);
  const [newProject, setNewProject] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newColor, setNewColor] = useState(PROJECT_COLORS[0]);

  useEffect(() => { setWeeklyHours(settings?.weekly_target_hours ?? 40); }, [settings]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-display">Einstellungen</DialogTitle></DialogHeader>
        <div className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Wöchentliche Soll-Stunden</Label>
            <div className="flex gap-2">
              <Input type="number" min={1} max={80} value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))} className="h-9 w-24" />
              <Button size="sm" className="h-9" onClick={async () => { await onSaveSettings(weeklyHours); toast.success("Gespeichert"); }}>
                Speichern
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Projekte</Label>
            <div className="space-y-2">
              {projects.map((p: Project) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="flex-1 truncate">{p.name}</span>
                  {p.client && <span className="text-xs text-muted-foreground truncate">{p.client}</span>}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteProject(p.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                <Input placeholder="Projektname" value={newProject} onChange={(e) => setNewProject(e.target.value)} className="h-8 text-xs" />
                <Input placeholder="Kunde (optional)" value={newClient} onChange={(e) => setNewClient(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {PROJECT_COLORS.map((c) => (
                    <button key={c} type="button"
                      className={`w-5 h-5 rounded-full transition-transform ${newColor === c ? "scale-125 ring-2 ring-ring ring-offset-1" : ""}`}
                      style={{ backgroundColor: c }} onClick={() => setNewColor(c)} />
                  ))}
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs ml-auto"
                  onClick={async () => {
                    if (!newProject.trim()) return;
                    try { await onAddProject(newProject.trim(), newClient.trim() || undefined, newColor); setNewProject(""); setNewClient(""); toast.success("Hinzugefügt"); }
                    catch { toast.error("Projekt existiert bereits"); }
                  }}>
                  <Plus className="w-3 h-3 mr-1" /> Hinzufügen
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ControlledExport({ open, onOpenChange, entries }: { open: boolean; onOpenChange: (v: boolean) => void; entries: WorkEntry[] }) {
  const [mode, setMode] = useState<"all" | "month" | "custom">("all");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = (() => {
    if (mode === "all") return entries;
    if (mode === "month") {
      const [y, m] = selectedMonth.split("-").map(Number);
      return entries.filter((e) => { const d = new Date(e.date); return d.getFullYear() === y && d.getMonth() === m - 1; });
    }
    return entries.filter((e) => (!fromDate || e.date >= fromDate) && (!toDate || e.date <= toDate));
  })();

  const doExport = (t: "pdf" | "csv") => {
    if (!filtered.length) return;
    t === "pdf" ? exportToPDF(filtered) : exportToCSV(filtered);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="font-display">Export</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="space-y-2">
            <div className="flex items-center gap-2"><RadioGroupItem value="all" id="r-all" /><Label htmlFor="r-all" className="text-sm cursor-pointer">Alle Einträge</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="month" id="r-month" /><Label htmlFor="r-month" className="text-sm cursor-pointer">Bestimmter Monat</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="custom" id="r-custom" /><Label htmlFor="r-custom" className="text-sm cursor-pointer">Zeitraum</Label></div>
          </RadioGroup>
          {mode === "month" && <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="h-9 text-sm" />}
          {mode === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Von</Label><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Bis</Label><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 text-sm" /></div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{filtered.length} Einträge ausgewählt</p>
          <div className="flex gap-2">
            <Button onClick={() => doExport("pdf")} disabled={!filtered.length} className="flex-1 h-9 text-sm">
              <FileText className="w-3.5 h-3.5 mr-1.5" /> PDF
            </Button>
            <Button onClick={() => doExport("csv")} disabled={!filtered.length} variant="outline" className="flex-1 h-9 text-sm">
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> CSV
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
