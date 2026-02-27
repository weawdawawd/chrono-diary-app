import { useWorkEntries } from "@/hooks/useWorkEntries";
import WorkEntryForm from "@/components/WorkEntryForm";
import WorkEntryList from "@/components/WorkEntryList";
import WorkStats from "@/components/WorkStats";
import { exportToPDF } from "@/lib/exportPDF";
import { Button } from "@/components/ui/button";
import { Briefcase, Download } from "lucide-react";

const Index = () => {
  const { entries, addEntry, deleteEntry } = useWorkEntries();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl leading-tight">Arbeitszeit</h1>
            <p className="text-xs text-muted-foreground">Deine Stunden im Überblick</p>
          </div>
          {entries.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => exportToPDF(entries)}
            >
              <Download className="w-4 h-4 mr-1.5" />
              PDF
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {entries.length > 0 && <WorkStats entries={entries} />}
        <WorkEntryForm onAdd={addEntry} />
        <WorkEntryList entries={entries} onDelete={deleteEntry} />
      </main>
    </div>
  );
};

export default Index;
