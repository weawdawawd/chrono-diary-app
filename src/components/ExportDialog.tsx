import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { WorkEntry } from "@/lib/types";
import { exportToPDF } from "@/lib/exportPDF";
import { exportToCSV } from "@/lib/exportCSV";
import { format } from "date-fns";

interface Props {
  entries: WorkEntry[];
}

type RangeMode = "all" | "month" | "custom";

export default function ExportDialog({ entries }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<RangeMode>("all");
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(now, "yyyy-MM"));
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const getFilteredEntries = () => {
    if (mode === "all") return entries;
    if (mode === "month") {
      const [y, m] = selectedMonth.split("-").map(Number);
      return entries.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === y && d.getMonth() === m - 1;
      });
    }
    // custom
    return entries.filter((e) => {
      if (fromDate && e.date < fromDate) return false;
      if (toDate && e.date > toDate) return false;
      return true;
    });
  };

  const handleExport = async (type: "pdf" | "csv") => {
    const filtered = getFilteredEntries();
    if (filtered.length === 0) return;
    try {
      if (type === "pdf") await exportToPDF(filtered);
      else exportToCSV(filtered);
      setOpen(false);
    } catch (err: any) {
      console.error("[pdf] export failed", err);
      const { toast } = await import("sonner");
      toast.error(err?.message || "Export fehlgeschlagen");
    }
  };


  const filtered = getFilteredEntries();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <Download className="w-3.5 h-3.5 mr-1" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Export</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as RangeMode)} className="space-y-2">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="all" id="r-all" />
              <Label htmlFor="r-all" className="text-sm cursor-pointer">Alle Einträge</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="month" id="r-month" />
              <Label htmlFor="r-month" className="text-sm cursor-pointer">Bestimmter Monat</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="custom" id="r-custom" />
              <Label htmlFor="r-custom" className="text-sm cursor-pointer">Benutzerdefinierter Zeitraum</Label>
            </div>
          </RadioGroup>

          {mode === "month" && (
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 text-sm"
            />
          )}

          {mode === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Von</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bis</Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {filtered.length} Einträge ausgewählt
          </p>

          <div className="flex gap-2">
            <Button onClick={() => handleExport("pdf")} disabled={filtered.length === 0} className="flex-1 h-9 text-sm">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              PDF
            </Button>
            <Button onClick={() => handleExport("csv")} disabled={filtered.length === 0} variant="outline" className="flex-1 h-9 text-sm">
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
              CSV
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
