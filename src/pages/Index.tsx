import { useAuth } from "@/hooks/useAuth";
import { useWorkEntries } from "@/hooks/useWorkEntries";
import { useSavedLocations } from "@/hooks/useSavedLocations";
import WorkEntryForm from "@/components/WorkEntryForm";
import WorkEntryList from "@/components/WorkEntryList";
import WorkStats from "@/components/WorkStats";
import { exportToPDF } from "@/lib/exportPDF";
import { Button } from "@/components/ui/button";
import { Briefcase, Download, LogOut } from "lucide-react";
import AuthPage from "@/pages/Auth";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { entries, loading: entriesLoading, addEntry, deleteEntry } = useWorkEntries(user?.id);
  const savedLocations = useSavedLocations(user?.id);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-xl leading-tight">Arbeitszeit</h1>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => exportToPDF(entries)}>
                <Download className="w-4 h-4 mr-1.5" />
                PDF
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Abmelden">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {entries.length > 0 && <WorkStats entries={entries} />}
        <WorkEntryForm onAdd={addEntry} savedLocations={savedLocations} />
        {entriesLoading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">Einträge laden...</div>
        ) : (
          <WorkEntryList entries={entries} onDelete={deleteEntry} />
        )}
      </main>
    </div>
  );
};

export default Index;
