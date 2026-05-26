import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Settings, Download, Moon, Sun, CalendarClock, Languages, Check, BookText } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import MyShifts from "@/components/MyShifts";
import MyShiftsCalendar from "@/components/MyShiftsCalendar";
import MyLogbook from "@/components/MyLogbook";
import type { Project } from "@/hooks/useProjects";
import type { UserSettings } from "@/hooks/useUserSettings";
import type { WorkEntry } from "@/lib/types";
import { useEffect } from "react";
import { useT, LANGUAGES } from "@/lib/i18n";

interface Props {
  email?: string;
  userId?: string;
  entries: WorkEntry[];
  settings: UserSettings | null;
  onSaveSettings: (h: number) => Promise<void>;
  projects: Project[];
  onAddProject: (name: string, client?: string, color?: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onSignOut: () => void;
}

export default function HeaderMenu({
  email, userId, entries, settings, onSaveSettings, projects, onAddProject, onDeleteProject, onSignOut,
}: Props) {
  const { lang, setLang, t } = useT();
  const [open, setOpen] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [openShifts, setOpenShifts] = useState(false);
  const [openLogbook, setOpenLogbook] = useState(false);
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

  const currentLang = LANGUAGES.find((l) => l.code === lang);

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-accent/10" aria-label={t("Menü")}>
            <Menu className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {email && <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground truncate">{email}</DropdownMenuLabel>}
          <DropdownMenuSeparator />
          {userId && (
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpenShifts(true); setOpen(false); }}>
              <CalendarClock className="w-4 h-4 mr-2 text-accent" /> {t("Meine Schichten")}
            </DropdownMenuItem>
          )}
          {userId && (
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpenLogbook(true); setOpen(false); }}>
              <BookText className="w-4 h-4 mr-2 text-accent" /> Wachbuch
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpenExport(true); setOpen(false); }} disabled={entries.length === 0}>
            <Download className="w-4 h-4 mr-2 text-accent" /> {t("Export (PDF / CSV)")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpenSettings(true); setOpen(false); }}>
            <Settings className="w-4 h-4 mr-2 text-accent" /> {t("Einstellungen")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setDark((d) => !d); }}>
            {dark ? <Sun className="w-4 h-4 mr-2 text-accent" /> : <Moon className="w-4 h-4 mr-2 text-accent" />}
            {dark ? t("Heller Modus") : t("Dunkler Modus")}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Languages className="w-4 h-4 mr-2 text-accent" />
              {t("Sprache")}
              <span className="ml-auto text-base leading-none">{currentLang?.flag}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-48">
                {LANGUAGES.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onSelect={(e) => { e.preventDefault(); setLang(l.code); }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-base leading-none">{l.flag}</span>
                    <span className="flex-1">{l.native}</span>
                    {lang === l.code && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" /> {t("Abmelden")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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

      <Sheet open={openShifts} onOpenChange={setOpenShifts}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" /> {t("Meine Schichten")}
            </SheetTitle>
          </SheetHeader>
          {userId && (
            <div className="pt-4 space-y-4">
              <MyShifts userId={userId} />
              <MyShiftsCalendar userId={userId} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={openLogbook} onOpenChange={setOpenLogbook}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display flex items-center gap-2">
              <BookText className="w-5 h-5 text-primary" /> Wachbuch
            </SheetTitle>
          </SheetHeader>
          {userId && (
            <div className="pt-4">
              <MyLogbook userId={userId} />
            </div>
          )}
        </SheetContent>
      </Sheet>
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

          <LinkedAccounts />

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

import { supabase as _sb } from "@/integrations/supabase/client";
import { Link2, CheckCircle2 } from "lucide-react";

const AppleIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);

function LinkedAccounts() {
  const [identities, setIdentities] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = async () => {
    const { data } = await _sb.auth.getUserIdentities();
    setIdentities((data?.identities ?? []).map((i: any) => i.provider));
  };

  useEffect(() => { refresh(); }, []);

  const link = async (provider: "google" | "apple") => {
    setBusy(provider);
    try {
      const { error } = await (_sb.auth as any).linkIdentity({
        provider,
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err?.message || "Verknüpfung fehlgeschlagen");
    } finally {
      setBusy(null);
    }
  };

  const has = (p: string) => identities.includes(p);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold flex items-center gap-1.5">
        <Link2 className="w-3.5 h-3.5" /> Konto verknüpfen
      </Label>
      <p className="text-[11px] text-muted-foreground">
        Verknüpfe Google oder Apple, um dich auch ohne Passwort anmelden zu können.
      </p>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          type="button" variant="outline" size="sm" className="h-9 text-xs"
          disabled={!!busy || has("google")}
          onClick={() => link("google")}
        >
          {has("google") ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5" /> : <GoogleIcon />}
          <span className="ml-1.5">{has("google") ? "Google verknüpft" : "Google verknüpfen"}</span>
        </Button>
        <Button
          type="button" variant="outline" size="sm" className="h-9 text-xs bg-black text-white hover:bg-black/90 hover:text-white border-black disabled:opacity-100"
          disabled={!!busy || has("apple")}
          onClick={() => link("apple")}
        >
          {has("apple") ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1.5" /> : <AppleIcon />}
          <span className="ml-1.5">{has("apple") ? "Apple verknüpft" : "Apple verknüpfen"}</span>
        </Button>
      </div>
    </div>
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

  const doExport = async (t: "pdf" | "csv") => {
    if (!filtered.length) { toast.error("Keine Einträge im gewählten Zeitraum"); return; }
    try {
      if (t === "pdf") await exportToPDF(filtered);
      else exportToCSV(filtered);
      onOpenChange(false);
    } catch (err: any) {
      console.error("[pdf] export failed", err);
      toast.error(err?.message || "Export fehlgeschlagen");
    }
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
