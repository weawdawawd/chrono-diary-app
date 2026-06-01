import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import SeoHead from "@/components/SeoHead";

const steps = [
  "APK-Datei herunterladen",
  "Auf dem Handy öffnen",
  "Bei \"Unbekannte Quellen\" auf \"Trotzdem installieren\" tippen",
  "App starten und einloggen",
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="App herunterladen — Ledion Security"
        description="Lade die Ledion Security Android App herunter. Arbeitszeiterfassung mit GPS-Stempeluhr und Wachbuch."
        path="/download"
      />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="relative inline-flex flex-col items-center">
              <div className="absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-accent/30 via-brand-red/10 to-transparent blur-2xl" />
              <img
                src={(new URL("../assets/ledion-logo.png", import.meta.url)).href}
                alt="Ledion Security"
                width={80}
                height={80}
                className="relative w-20 h-20 object-contain drop-shadow-xl"
              />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl tracking-tight">
                LEDION <span className="text-brand-red">SECURITY</span>
              </h1>
              <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
                Arbeitszeiterfassung mit GPS-Stempeluhr und Wachbuch
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Card className="bg-card border rounded-2xl shadow-lg p-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-2">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h2 className="font-display font-semibold text-xl">Android App</h2>
                <p className="text-xs text-muted-foreground">
                  Installiere die App direkt als APK auf deinem Android-Gerät.
                </p>
              </div>

              <Button
                asChild
                className="w-full h-12 text-sm font-semibold gap-2"
              >
                <a href="/ledion.apk" download>
                  <Download className="w-5 h-5" />
                  Android App herunterladen (.apk)
                </a>
              </Button>

              <div className="space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Installationsanleitung
                </h3>
                <ol className="space-y-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <span className="text-foreground/90">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="text-center">
                <a
                  href="/"
                  className="text-xs text-accent font-medium hover:underline underline-offset-4"
                >
                  Zurück zur Anmeldung
                </a>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center gap-6 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              Sicher & verschlüsselt
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              PDF Export
            </span>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
