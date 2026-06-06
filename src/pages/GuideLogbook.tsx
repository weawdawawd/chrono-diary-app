import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import SeoHead from "@/components/SeoHead";
import {
  BookOpen,
  ShieldCheck,
  FileCheck,
  Clock,
  AlertTriangle,
  Search,
  Smartphone,
  ArrowRight,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  Lock,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export default function GuideLogbook() {
  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Digitales Wachbuch: Vorteile für Sicherheitsdienste | Ledion"
        description="Entdecken Sie die Vorteile eines digitalen Wachbuchs für Sicherheitsdienste: Rechtssicherheit, Echtzeit-Dokumentation, GPS-Nachweise und nahtlose Integration in Ihre Arbeitszeiterfassung."
        path="/blog/digitales-wachbuch"
      />

      {/* Header */}
      <header className="border-b bg-card/90 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img
              src={(new URL("../assets/ledion-logo.png", import.meta.url)).href}
              alt="Ledion Security"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
            <span className="font-display font-semibold text-sm">Ledion Security</span>
          </a>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <a href="/">Zur App</a>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-16">
        {/* Hero */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={stagger}
          className="text-center space-y-5"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 text-accent">
            <BookOpen className="w-7 h-7" />
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="font-display font-bold text-3xl sm:text-4xl tracking-tight leading-tight"
          >
            Das <span className="text-brand-red">digitale Wachbuch</span> für Sicherheitsdienste
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
          >
            Warum moderne Sicherheitsunternehmen von Papier auf digitale Dokumentation umsteigen — und wie Ihr Team von rechtssicheren Protokollen, Echtzeit-Einblicken und automatisierter Berichterstattung profitiert.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild className="h-10 gap-2 text-sm font-medium">
              <a href="/">
                <ShieldCheck className="w-4 h-4" />
                Kostenlos starten
              </a>
            </Button>
            <span className="text-xs text-muted-foreground">Keine Kreditkarte erforderlich</span>
          </motion.div>
        </motion.section>

        {/* Quick comparison cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid sm:grid-cols-2 gap-4"
        >
          <Card className="p-5 border border-border/60 bg-card/50">
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <XCircle className="w-5 h-5 text-brand-red" />
              <h2 className="font-display font-semibold text-base text-foreground">Papier-Wachbuch</h2>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-brand-red mt-0.5">·</span>
                Manuelle Einträge fehleranfällig und zeitaufwendig
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-red mt-0.5">·</span>
                Unleserliche Handschrift erschwert Nachweise
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-red mt-0.5">·</span>
                Kein Echtzeit-Überblick für Geschäftsleitung
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-red mt-0.5">·</span>
                Einsatzberichte verloren oder beschädigt
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-red mt-0.5">·</span>
                Schwierige Archivierung und Dokumentensuche
              </li>
            </ul>
          </Card>

          <Card className="p-5 border border-accent/20 bg-accent/[0.03]">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-accent" />
              <h2 className="font-display font-semibold text-base">Digitales Wachbuch</h2>
            </div>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                Strukturierte Vorfälle mit Zeitstempel und Standort
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                Echtzeit-Synchronisation zwischen Wachmann und Büro
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                Fotos, Unterschriften und Dateien direkt anhängen
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                DSGVO-konforme, revisionssichere Datenspeicherung
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                Sofortige PDF-Exporte für Behörden und Kunden
              </li>
            </ul>
          </Card>
        </motion.section>

        {/* Content sections */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-10"
        >
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-display font-bold text-2xl tracking-tight">
                Was ist ein digitales Wachbuch?
              </h2>
            </div>
            <div className="text-muted-foreground leading-relaxed space-y-4 pl-[52px]">
              <p>
                Ein <strong>digitales Wachbuch</strong> ersetzt das klassische, papierbasierte Protokollbuch in der Sicherheitsbranche. Statt handschriftliche Notizen in einem physischen Buch zu hinterlegen, erfassen Wachleute Vorfälle, Rundgänge und Einsatzsituationen digital über Smartphone, Tablet oder Browser.
              </p>
              <p>
                Die Einträge werden mit automatischen <strong>Zeitstempeln</strong> und <strong>GPS-Koordinaten</strong> versehen, sodass jedes Ereignis nachvollziehbar dokumentiert ist. Das ist nicht nur komfortabel — es schafft auch die rechtliche Sicherheit, die moderne Sicherheitsdienste benötigen.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-display font-bold text-2xl tracking-tight">
                Rechtssicherheit und Beweiskraft
              </h2>
            </div>
            <div className="text-muted-foreground leading-relaxed space-y-4 pl-[52px]">
              <p>
                In Deutschland unterliegen Sicherheitsdienste strengen Auflagen der Gewerbeordnung und der jeweiligen Bewachungsverordnung der Bundesländer. Ein ordnungsgemäß geführtes <strong>Wachbuch ist Pflicht</strong> — doch Papierprotokolle haben erhebliche Schwächen, wenn es um Beweissicherheit geht.
              </p>
              <p>
                Ein digitales Wachbuch bietet hier entscheidende Vorteile: Manipulationssichere Einträge, automatische Backups, verschlüsselte Speicherung und revisionssichere Logs. Bei Rechtsstreitigkeiten oder behördlichen Prüfungen können Sie jederzeit lückenlose Protokolle als PDF oder CSV exportieren — mit genauen Zeitangaben, Standortdaten und bearbeitungssicheren Original-Einträgen.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-display font-bold text-2xl tracking-tight">
                Effizienz im Einsatzalltag
              </h2>
            </div>
            <div className="text-muted-foreground leading-relaxed space-y-4 pl-[52px]">
              <p>
                Wachleute arbeiten oft unter Zeitdruck — sei es bei Streifengängen in der Nacht oder bei unvorhergesehenen Zwischenfällen. Das Papier-Wachbuch erfordert Sucherei nach Stift und Buch, saubere Handschrift und manuelle Uhrzeit-Einträge.
              </p>
              <p>
                Mit einer digitalen Lösung wie <strong>Ledion</strong> öffnet der Mitarbeiter die App, tippt den Vorfall in vorkonfigurierte Kategorien ein und speichert den Eintrag — erledigt in Sekunden statt Minuten. Dank Autocomplete für wiederkehrende Orte und Tätigkeiten wird die Dokumentation zum flüssigen Nebenprodukt der Arbeit, nicht zur lästigen Pflicht.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-display font-bold text-2xl tracking-tight">
                Echtzeit-Einblick für Objektleiter
              </h2>
            </div>
            <div className="text-muted-foreground leading-relaxed space-y-4 pl-[52px]">
              <p>
                Traditionell erfährt ein Objektleiter von einem Vorfall erst am nächsten Tag — wenn überhaupt. Mit einem digitalen Wachbuch sehen Geschäftsführer und Schichtleiter alle Einträge in Echtzeit im Admin-Dashboard.
              </p>
              <p>
                Besonders bei <strong>SOS-Alarmen</strong> oder <strong>außergewöhnlichen Vorfällen</strong> können Administratoren sofort reagieren, statt auf den nächsten Rapport zu warten. Push-Benachrichtigungen sorgen dafür, dass kritische Ereignisse niemanden entgehen.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-display font-bold text-2xl tracking-tight">
                Archivierung und Dokumentensuche
              </h2>
            </div>
            <div className="text-muted-foreground leading-relaxed space-y-4 pl-[52px]">
              <p>
                Wer schon einmal in einem Aktenschrank nach einem spezifischen Vorfall aus dem letzten Jahr gesucht hat, weiß: Papierarchive sind mühsam. Digitale Wachbücher bieten Volltextsuche, Filter nach Datum, Ort und Mitarbeiter, sowie automatische monatliche Archivierung.
              </p>
              <p>
                Beim <strong>Ledion Wachbuch</strong> können Sie Einträge jederzeit bearbeiten, duplizieren oder in Bulk exportieren. Die Suchfunktion durchsucht Orte, Tätigkeiten und Beschreibungen in Echtzeit — ein kundenrelevanter Vorfall aus vor drei Monaten ist so in Sekunden gefunden.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-display font-bold text-2xl tracking-tight">
                DSGVO-Konformität und Datenschutz
              </h2>
            </div>
            <div className="text-muted-foreground leading-relaxed space-y-4 pl-[52px]">
              <p>
                Die Datenschutz-Grundverordnung (DSGVO) stellt hohe Anforderungen an die Verarbeitung personenbezogener Daten. Ein herrenloses Papier-Wachbuch auf dem Pult des Pförtners erfüllt diese Anforderungen nicht — jeder Besucher könnte sensible Einträge lesen.
              </p>
              <p>
                Ein professionelles digitales Wachbuch setzt auf <strong>rollenbasierte Zugriffsrechte</strong>, <strong>verschlüsselte Datenübertragung</strong> und <strong>EU-basierte Server</strong>. Bei Ledion speichern wir alle Daten in zertifizierten deutschen Rechenzentren, sodass Sie die DSGVO-Anforderungen problemlos erfüllen.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-display font-bold text-2xl tracking-tight">
                Integration mit Schichtplanung und Zeiterfassung
              </h2>
            </div>
            <div className="text-muted-foreground leading-relaxed space-y-4 pl-[52px]">
              <p>
                Der größte Effizienzvorteil eines digitalen Wachbuchs entsteht, wenn es nahtlos mit anderen Systemen verbunden ist. Statt getrennte Tools für Zeiterfassung, Schichtplanung und Rapportierung zu nutzen, vereint <strong>Ledion</strong> alle Funktionen in einer Plattform.
              </p>
              <p>
                Der Wachmann startet seine Schicht über die App, führt Patrouillen mit GPS-Checkpoints durch und protokolliert Vorfälle im Wachbuch — alles in einer Anwendung. Die Arbeitszeiten werden automatisch erfasst, die Patrouillenrunden lückenlos dokumentiert und die Wachbucheinträge mit dem Einsatzort verknüpft.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-display font-bold text-2xl tracking-tight">
                Automatisierte Berichte und Exporte
              </h2>
            </div>
            <div className="text-muted-foreground leading-relaxed space-y-4 pl-[52px]">
              <p>
                Jeden Monat müssen Sicherheitsunternehmen ihren Kunden detaillierte Einsatzberichte vorlegen — Stundenlisten, Vorfallsprotokolle, Patrouillen-Nachweise. Mit einem digitalen Wachbuch entstehen diese Berichte nahezu von selbst.
              </p>
              <p>
                Ledion erzeugt aus allen Wachbucheinträgen, Schichtdaten und Patrouillen-Logs auf Knopfdruck <strong>übersichtliche PDF- und CSV-Exporte</strong> — aufgeschlüsselt nach Mitarbeiter, Objekt und Zeitraum. Das spart stundenlange Schreibarbeit und minimiert Fehler.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-display font-bold text-2xl tracking-tight">
                Mobile-first: Wachbuch von überall
              </h2>
            </div>
            <div className="text-muted-foreground leading-relaxed space-y-4 pl-[52px]">
              <p>
                Wachleute arbeiten mobil — warum sollte ihr Wachbuch das nicht auch tun? Moderne digitale Wachbücher sind als Progressive Web App (PWA) oder native App verfügbar und funktionieren auf jedem Smartphone oder Tablet.
              </p>
              <p>
                Mit <strong>Ledion</strong> können Mitarbeiter Wachbucheinträge auch offline erfassen; die Daten synchronisieren sich automatisch, sobald die Internetverbindung wiederhergestellt ist. Das ist praktisch in Tiefgaragen, abgelegenen Objekten oder bei temporären Netzproblemen.
              </p>
            </div>
          </section>
        </motion.article>

        {/* Feature checklist */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          <h2 className="font-display font-bold text-2xl tracking-tight text-center">
            Funktionen im Überblick
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "Echtzeit-Einträge mit Zeitstempel & GPS",
              "DSGVO-konforme Cloud-Speicherung",
              "Offline-Modus mit Auto-Sync",
              "Foto-Anhänge & Unterschriften",
              "Volltextsuche & Filter",
              "PDF/CSV-Exporte für Kunden",
              "Rollenbasierte Zugriffsrechte",
              "Push-Benachrichtigungen bei Vorfällen",
              "Integration mit Schichtplanung",
              "Automatische monatliche Archivierung",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50"
              >
                <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                <span className="text-sm text-foreground/80">{item}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-5 py-8"
        >
          <div className="max-w-lg mx-auto space-y-3">
            <h2 className="font-display font-bold text-2xl tracking-tight">
              Bereit für Ihr digitales Wachbuch?
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Starten Sie kostenlos mit Ledion und ersetzen Sie Ihr Papier-Wachbuch durch eine moderne, rechtssichere digitale Lösung — inklusive Zeiterfassung, Schichtplanung und Patrouillen-Management.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="h-11 gap-2 text-sm font-semibold">
              <a href="/">
                <ShieldCheck className="w-4 h-4" />
                Kostenlos registrieren
              </a>
            </Button>
            <Button asChild variant="outline" className="h-11 gap-2 text-sm font-medium">
              <a href="/download">
                <Smartphone className="w-4 h-4" />
                App herunterladen
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Keine Kreditkarte erforderlich · Setup in unter 5 Minuten
          </p>
        </motion.section>

        {/* Related links */}
        <footer className="border-t pt-6 pb-8 space-y-4">
          <p className="text-xs text-muted-foreground text-center">
            Weitere Themen:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            <a href="/download" className="text-accent hover:underline underline-offset-4 flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              App herunterladen
            </a>
            <a href="/" className="text-accent hover:underline underline-offset-4 flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              Zur Ledion App
            </a>
          </div>
          <p className="text-[11px] text-muted-foreground/60 text-center pt-2">
            © {new Date().getFullYear()} Ledion Security — Arbeitszeiterfassung & digitales Wachbuch für Sicherheitsdienste
          </p>
        </footer>
      </main>
    </div>
  );
}
