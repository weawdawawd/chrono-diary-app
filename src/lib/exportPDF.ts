import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { WorkEntry, calculateDuration } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

export function exportToPDF(entries: WorkEntry[]) {
  const doc = new jsPDF();
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  // Determine month range from entries
  const dates = sorted.map((e) => parseISO(e.date));
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const isSameMonth =
    firstDate.getMonth() === lastDate.getMonth() &&
    firstDate.getFullYear() === lastDate.getFullYear();

  const subtitle = isSameMonth
    ? format(firstDate, "MMMM yyyy", { locale: de })
    : `${format(firstDate, "MMMM yyyy", { locale: de })} – ${format(lastDate, "MMMM yyyy", { locale: de })}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Arbeitszeitnachweis", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitle, 14, 28);

  autoTable(doc, {
    startY: 35,
    head: [["Datum", "Von", "Bis", "Dauer", "Ort", "Taetigkeit"]],
    body: sorted.map((e) => [
      format(parseISO(e.date), "dd.MM.yyyy"),
      e.startTime,
      e.endTime,
      calculateDuration(e.startTime, e.endTime),
      e.location,
      e.description,
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 48, 80] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 16 },
      2: { cellWidth: 16 },
      3: { cellWidth: 18 },
      4: { cellWidth: 35 },
      5: { cellWidth: "auto" },
    },
  });

  doc.save("arbeitszeiten.pdf");
}
