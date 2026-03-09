import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Project } from "@/hooks/useProjects";
import type { UserSettings } from "@/hooks/useUserSettings";

interface Props {
  settings: UserSettings | null;
  onSaveSettings: (weeklyHours: number) => Promise<void>;
  projects: Project[];
  onAddProject: (name: string, client?: string, color?: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

const PROJECT_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"
];

export default function SettingsDialog({ settings, onSaveSettings, projects, onAddProject, onDeleteProject }: Props) {
  const [open, setOpen] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState(settings?.weekly_target_hours ?? 40);
  const [newProject, setNewProject] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newColor, setNewColor] = useState(PROJECT_COLORS[0]);

  const handleSaveHours = async () => {
    await onSaveSettings(weeklyHours);
    toast.success("Soll-Stunden gespeichert");
  };

  const handleAddProject = async () => {
    if (!newProject.trim()) return;
    try {
      await onAddProject(newProject.trim(), newClient.trim() || undefined, newColor);
      setNewProject("");
      setNewClient("");
      toast.success("Projekt hinzugefügt");
    } catch {
      toast.error("Projekt existiert bereits");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Einstellungen">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Einstellungen</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Weekly target hours */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Wöchentliche Soll-Stunden</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={80}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className="h-9 w-24"
              />
              <Button size="sm" onClick={handleSaveHours} className="h-9">
                Speichern
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Für die Überstunden-Berechnung
            </p>
          </div>

          {/* Projects */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Projekte</Label>
            <div className="space-y-2">
              {projects.map((p) => (
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
                <Input
                  placeholder="Projektname"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  placeholder="Kunde (optional)"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`w-5 h-5 rounded-full transition-transform ${newColor === c ? "scale-125 ring-2 ring-ring ring-offset-1" : ""}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewColor(c)}
                    />
                  ))}
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs ml-auto" onClick={handleAddProject}>
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
