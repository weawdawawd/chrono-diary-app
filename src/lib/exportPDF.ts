import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { WorkEntry, calculateDuration, calculateDurationMinutes } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

export function exportToPDF(entries: WorkEntry[]) {
  const doc = new jsPDF();
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const dates = sorted.map((e) => parseISO(e.date));
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const isSameMonth =
    firstDate.getMonth() === lastDate.getMonth() &&
    firstDate.getFullYear() === lastDate.getFullYear();

  const subtitle = isSameMonth
    ? format(firstDate, "MMMM yyyy", { locale: de })
    : `${format(firstDate, "MMMM yyyy", { locale: de })} – ${format(lastDate, "MMMM yyyy", { locale: de })}`;

  // Total hours calculation
  const totalMinutes = sorted.reduce(
    (sum, e) => sum + calculateDurationMinutes(e.start_time, e.end_time),
    0
  );
  const totalH = Math.floor(totalMinutes / 60);
  const totalM = totalMinutes % 60;
  const totalStr = `${totalH}h ${totalM.toString().padStart(2, "0")}m`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Arbeitszeitnachweis", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitle, 14, 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Gesamtstunden: ${totalStr}  |  ${sorted.length} Eintraege  |  ${new Set(sorted.map(e => e.location)).size} Orte`, 14, 34);

  autoTable(doc, {
    startY: 40,
    head: [["Datum", "Von", "Bis", "Dauer", "Ort", "Taetigkeit"]],
    body: sorted.map((e) => [
      format(parseISO(e.date), "dd.MM.yyyy"),
      e.start_time.slice(0, 5),
      e.end_time.slice(0, 5),
      calculateDuration(e.start_time, e.end_time),
      e.location,
      e.description,
    ]),
    foot: [["", "", "Gesamt:", totalStr, "", ""]],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 48, 80] },
    footStyles: { fillColor: [240, 240, 240], textColor: [30, 48, 80], fontStyle: "bold" },
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
