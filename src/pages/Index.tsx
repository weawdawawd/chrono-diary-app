import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkEntries } from "@/hooks/useWorkEntries";
import { useSavedLocations } from "@/hooks/useSavedLocations";
import WorkEntryForm from "@/components/WorkEntryForm";
import WorkEntryList from "@/components/WorkEntryList";
import WorkStats from "@/components/WorkStats";
import MonthFilter from "@/components/MonthFilter";
import DarkModeToggle from "@/components/DarkModeToggle";
import { exportToPDF } from "@/lib/exportPDF";
import { Button } from "@/components/ui/button";
import { Briefcase, Download, LogOut } from "lucide-react";
import AuthPage from "@/pages/Auth";
import { motion } from "framer-motion";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { entries, loading: entriesLoading, addEntry, deleteEntry, editEntry } = useWorkEntries(user?.id);
  const savedLocations = useSavedLocations(user?.id);

  const [filterMonth, setFilterMonth] = useState<Date | null>(null);

  const filteredEntries = useMemo(() => {
    if (!filterMonth) return entries;
    return entries.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === filterMonth.getMonth() && d.getFullYear() === filterMonth.getFullYear();
    });
  }, [entries, filterMonth]);

  if (authLoading) {
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
            {filteredEntries.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => exportToPDF(filteredEntries)} className="h-8 text-xs">
                <Download className="w-3.5 h-3.5 mr-1" />
                PDF
              </Button>
            )}
            <DarkModeToggle />
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Abmelden" className="h-9 w-9">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {entries.length > 0 && <WorkStats entries={filteredEntries} />}
        </motion.div>

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

        <WorkEntryForm onAdd={addEntry} savedLocations={savedLocations} />

        {entriesLoading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse text-sm">Einträge laden...</div>
        ) : (
          <WorkEntryList entries={filteredEntries} onDelete={deleteEntry} onEdit={editEntry} />
        )}
      </main>
    </div>
  );
};

export default Index;
