import { useState, useMemo, useEffect } from "react";
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
import { Navigate } from "react-router-dom";
import { Briefcase } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import HeaderMenu from "@/components/HeaderMenu";
import AuthPage from "@/pages/Auth";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import MyShifts from "@/components/MyShifts";
import MyShiftsCalendar from "@/components/MyShiftsCalendar";
import SosButton from "@/components/SosButton";
import { useLiveLocationDuringShift } from "@/hooks/useLiveLocationDuringShift";
import AdminAuthDebug from "@/components/AdminAuthDebug";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: roleLoading, error: roleError, retry: retryRole } = useUserRole(user?.id);

  // Only run employee-only data hooks when we know the user is NOT an admin
  const employeeId = !roleLoading && !roleError && user && !isAdmin ? user.id : undefined;
  const { entries, loading: entriesLoading, addEntry, deleteEntry, deleteEntriesByDateRange, editEntry } = useWorkEntries(employeeId);
  const savedLocations = useSavedLocations(employeeId);
  const { projects, addProject, deleteProject } = useProjects(employeeId);
  const { settings, upsertSettings } = useUserSettings(employeeId);
  const { activities: savedActivities, upsertActivity } = useSavedActivities(employeeId);
  useLiveLocationDuringShift(employeeId);

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

  useEffect(() => {
    if (!authLoading && !roleLoading && user) {
      console.info("[admin-auth] Root-Route ausgewertet", { userId: user.id, email: user.email, isAdmin, roleError });
    }
  }, [authLoading, roleLoading, user?.id, user?.email, isAdmin, roleError]);

  if (roleError) {
    return (
      <AdminAuthDebug
        email={user?.email}
        userId={user?.id}
        message="Die Rolle konnte nicht aus user_roles geladen werden. Dadurch kann die Admin-Weiterleitung nicht sicher geprüft werden."
        code={roleError.code}
        details={roleError.details || roleError.message}
        onRetry={retryRole}
      />
    );
  }

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
    console.info("[admin-auth] Admin erkannt, Weiterleitung nach /admin", { userId: user.id, email: user.email });
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/90 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <BrandLogo size={40} showText textClassName="text-[15px]" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground truncate text-right">{user.email}</p>
          </div>
          <HeaderMenu
            email={user.email}
            userId={user.id}
            entries={entries}
            settings={settings}
            onSaveSettings={upsertSettings}
            projects={projects}
            onAddProject={addProject}
            onDeleteProject={deleteProject}
            onSignOut={signOut}
          />
        </div>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-accent to-brand-red opacity-70" />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        <div className="flex justify-end">
          <SosButton userId={user.id} />
        </div>
        <MyShifts userId={user.id} />
        <MyShiftsCalendar userId={user.id} />



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
