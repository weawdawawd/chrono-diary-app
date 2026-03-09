import { WorkEntry, calculateDuration } from "@/lib/types";
import { format, parseISO } from "date-fns";

export function exportToCSV(entries: WorkEntry[]) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const header = "Datum;Von;Bis;Dauer;Ort;Taetigkeit";
  const rows = sorted.map((e) =>
    [
      format(parseISO(e.date), "dd.MM.yyyy"),
      e.start_time.slice(0, 5),
      e.end_time.slice(0, 5),
      calculateDuration(e.start_time, e.end_time),
      `"${e.location.replace(/"/g, '""')}"`,
      `"${e.description.replace(/"/g, '""')}"`,
    ].join(";")
  );

  const bom = "\uFEFF";
  const csv = bom + [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "arbeitszeiten.csv";
  a.click();
  URL.revokeObjectURL(url);
}
