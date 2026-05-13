import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorkEntries } from "@/hooks/useWorkEntries";
import { useSavedLocations } from "@/hooks/useSavedLocations";
import { useProjects } from "@/hooks/useProjects";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useSavedActivities } from "@/hooks/useSavedActivities";
import WorkEntryForm from "@/components/WorkEntryForm";
import WorkEntryList from "@/components/WorkEntryList";
import WorkStats from "@/components/WorkStats";
import WeeklyChart from "@/components/WeeklyChart";
import MonthlyComparisonChart from "@/components/MonthlyComparisonChart";
import WorkCalendar from "@/components/WorkCalendar";
import MonthFilter from "@/components/MonthFilter";
import DarkModeToggle from "@/components/DarkModeToggle";
import SettingsDialog from "@/components/SettingsDialog";
import ExportDialog from "@/components/ExportDialog";
import AdminDashboard from "@/pages/AdminDashboard";
import { Button } from "@/components/ui/button";
import { Briefcase, LogOut } from "lucide-react";
import AuthPage from "@/pages/Auth";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const { entries, loading: entriesLoading, addEntry, deleteEntry, deleteEntriesByDateRange, editEntry } = useWorkEntries(user?.id);
  const savedLocations = useSavedLocations(user?.id);
  const { projects, addProject, deleteProject } = useProjects(user?.id);
  const { settings, upsertSettings } = useUserSettings(user?.id);
  const { activities: savedActivities, upsertActivity } = useSavedActivities(user?.id);

  const [filterMonth, setFilterMonth] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (filterMonth) {
      result = result.filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === filterMonth.getMonth() && d.getFullYear() === filterMonth.getFullYear();
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) =>
        e.location.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, filterMonth, searchQuery]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center animate-pulse">
            <Briefcase className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Laden...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Briefcase className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-lg leading-tight">Arbeitszeit</h1>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          </div>
          <div className="flex items-center gap-1">
            {entries.length > 0 && <ExportDialog entries={entries} />}
            <SettingsDialog
              settings={settings}
              onSaveSettings={upsertSettings}
              projects={projects}
              onAddProject={addProject}
              onDeleteProject={deleteProject}
            />
            <DarkModeToggle />
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Abmelden" className="h-9 w-9">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {entries.length > 0 && <WorkStats entries={filteredEntries} weeklyTargetHours={settings?.weekly_target_hours ?? 40} />}
        </motion.div>

        {entries.length > 0 && <WeeklyChart entries={filteredEntries} />}
        {entries.length > 0 && <MonthlyComparisonChart entries={entries} />}
        {entries.length > 0 && <WorkCalendar entries={entries} />}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {entries.length > 0 && <WorkStats entries={filteredEntries} weeklyTargetHours={settings?.weekly_target_hours ?? 40} />}
        </motion.div>

        {entries.length > 0 && <WeeklyChart entries={filteredEntries} />}
        {entries.length > 0 && <MonthlyComparisonChart entries={entries} />}
        {entries.length > 0 && <WorkCalendar entries={entries} />}

        {entries.length > 0 && (
          <MonthFilter
            month={filterMonth || new Date()}
            isAll={!filterMonth}
            onPrev={() => {
              const m = filterMonth || new Date();
              setFilterMonth(new Date(m.getFullYear(), m.getMonth() - 1, 1));
            }}
            onNext={() => {
              const m = filterMonth || new Date();
              setFilterMonth(new Date(m.getFullYear(), m.getMonth() + 1, 1));
            }}
            onReset={() => setFilterMonth(null)}
          />
        )}

        {entries.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ort oder Tätigkeit suchen…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        )}

        <WorkEntryForm onAdd={(entry) => { addEntry(entry); upsertActivity(entry.description); }} savedLocations={savedLocations} projects={projects} savedActivities={savedActivities} />

        {entriesLoading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse text-sm">Einträge laden...</div>
        ) : (
          <WorkEntryList entries={filteredEntries} onDelete={deleteEntry} onEdit={editEntry} onDuplicate={addEntry} projects={projects} onBulkDelete={deleteEntriesByDateRange} />
        )}
      </main>
    </div>
  );
};

export default Index;
