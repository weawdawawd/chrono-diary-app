import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { WorkEntry, calculateDuration, calculateDurationMinutes } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import logoUrl from "@/assets/ledion-logo.png";

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("[pdf] Logo konnte nicht geladen werden", e);
    return null;
  }
}

export async function exportToPDF(entries: WorkEntry[]) {
  if (!entries || entries.length === 0) {
    throw new Error("Keine Einträge zum Exportieren.");
  }

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);

  // WICHTIG: Auf iOS muss window.open SYNCHRON im Klick-Handler geschehen,
  // sonst blockiert Safari den neuen Tab. Wir öffnen jetzt ein Platzhalter-
  // Fenster und befüllen es später mit der fertigen PDF-URL.
  let preOpenedWin: Window | null = null;
  if (isIOS || isAndroid) {
    preOpenedWin = window.open("", "_blank");
    if (preOpenedWin) {
      preOpenedWin.document.write(
        '<html><head><title>PDF wird erstellt…</title><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
        '<body style="font-family:-apple-system,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#444;background:#fafafa;">' +
        '<div style="text-align:center"><div style="font-size:16px">PDF wird vorbereitet…</div><div style="font-size:13px;color:#888;margin-top:8px">Einen Moment bitte</div></div>' +
        '</body></html>'
      );
    }
  }

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

  const totalMinutes = sorted.reduce((sum, e) => {
    const raw = calculateDurationMinutes(e.start_time, e.end_time);
    const br = (e as any).include_break ? ((e as any).break_minutes || 0) : 0;
    return sum + raw - br;
  }, 0);
  const totalH = Math.floor(totalMinutes / 60);
  const totalM = totalMinutes % 60;
  const totalStr = `${totalH}h ${totalM.toString().padStart(2, "0")}m`;
  const totalDecimal = (totalMinutes / 60).toFixed(2).replace(".", ",");

  // Logo oben links
  const logoData = await loadLogoDataUrl();
  let textX = 14;
  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", 14, 10, 18, 18);
      textX = 36;
    } catch (e) {
      console.warn("[pdf] addImage fehlgeschlagen", e);
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LEDION SECURITY", textX, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Arbeitszeitnachweis", textX, 23);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(subtitle, 14, 34);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(
    `Gesamtstunden: ${totalStr} (${totalDecimal})  |  ${sorted.length} Eintraege  |  ${new Set(sorted.map((e) => e.location)).size} Orte`,
    14,
    40
  );

  autoTable(doc, {
    startY: 46,
    head: [["Datum", "Von", "Bis", "Pause", "Dauer", "Ort", "Taetigkeit"]],
    body: sorted.map((e) => {
      const anyE = e as any;
      const br = anyE.break_minutes || 0;
      const pauseStr = br > 0 ? `${br}min${anyE.include_break ? "" : "*"}` : "-";
      const raw = calculateDurationMinutes(e.start_time, e.end_time);
      const eff = raw - (anyE.include_break ? br : 0);
      const h = Math.floor(eff / 60);
      const m = eff % 60;
      const dur = `${h}h ${m.toString().padStart(2, "0")}m`;
      return [
        format(parseISO(e.date), "dd.MM.yyyy"),
        e.start_time.slice(0, 5),
        e.end_time.slice(0, 5),
        pauseStr,
        dur,
        e.location,
        e.description,
      ];
    }),
    foot: [["", "", "", "Gesamt:", `${totalStr} (${totalDecimal})`, "", ""]],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 48, 80] },
    footStyles: { fillColor: [240, 240, 240], textColor: [30, 48, 80], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 14 },
      2: { cellWidth: 14 },
      3: { cellWidth: 16 },
      4: { cellWidth: 20 },
      5: { cellWidth: 32 },
      6: { cellWidth: "auto" },
    },
  });

  const filename = "arbeitszeiten.pdf";
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);

  try {
    if (isIOS) {
      // iOS Safari & In-App-WebViews: data-URL im selben Tab öffnen
      // (Blob-URLs werden von iOS oft blockiert; window.open nach await ebenfalls)
      const dataUrl = doc.output("datauristring");
      // Nutzer kann oben rechts auf "Teilen" → "In Dateien sichern" tippen
      window.location.href = dataUrl;
      return;
    }

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);

    if (isAndroid) {
      // Android: in neuem Tab anzeigen (Chrome-PDF-Viewer)
      const win = window.open(url, "_blank");
      if (!win) {
        // Popup blockiert → Download erzwingen
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } else {
      // Desktop: Download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    console.warn("[pdf] Export fehlgeschlagen, fallback save()", e);
    doc.save(filename);
  }
}
