import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const AppleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

type Mode = "login" | "forgot";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("[auth] apple sign-in error", err);
      toast.error(err?.message || "Apple-Anmeldung fehlgeschlagen.");
      setAppleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Bitte E-Mail eingeben");
      return;
    }
    if (mode !== "forgot" && !password.trim()) {
      toast.error("Bitte Passwort eingeben");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        console.info("[admin-auth] Login-Versuch", { email: email.trim().toLowerCase() });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error("[admin-auth] Login fehlgeschlagen", { email: email.trim().toLowerCase(), error });
          throw error;
        }
        console.info("[admin-auth] Login erfolgreich, Session wird ausgewertet", { email: email.trim().toLowerCase() });
        toast.success("Willkommen zurück!");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("E-Mail zum Zurücksetzen gesendet! Prüfe deinen Posteingang.");
        setMode("login");
      }
    } catch (err: any) {
      console.error("[auth] error", err);
      const msg = err?.message || "";
      let userMsg = "Ein Fehler ist aufgetreten. Bitte versuche es später.";
      if (/invalid login credentials/i.test(msg)) userMsg = "E-Mail oder Passwort ungültig.";
      else if (/email not confirmed/i.test(msg)) userMsg = "Bitte bestätige zuerst deine E-Mail.";
      else if (/rate limit|too many/i.test(msg)) userMsg = "Zu viele Versuche. Bitte später erneut versuchen.";
      toast.error(userMsg);
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    login: { h: "Willkommen zurück", sub: "Melde dich an, um fortzufahren" },
    forgot: { h: "Passwort vergessen", sub: "Wir senden dir einen Link zum Zurücksetzen" },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="relative inline-flex flex-col items-center">
              <div className="absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-accent/30 via-brand-red/10 to-transparent blur-2xl" />
              <img src={(new URL("../assets/ledion-logo.png", import.meta.url)).href} alt="Ledion Security" className="relative w-24 h-24 object-contain drop-shadow-xl" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl tracking-tight">LEDION <span className="text-brand-red">SECURITY</span></h1>
              <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
                Arbeitszeit-Erfassung &amp; Schichtplanung für dein Sicherheitsteam.
              </p>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-card border rounded-2xl shadow-lg p-6 space-y-5"
            >
              <div className="text-center">
                <h2 className="font-display font-semibold text-xl">{titles[mode].h}</h2>
                <p className="text-xs text-muted-foreground mt-1">{titles[mode].sub}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="deine@email.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="h-11"
                  />
                </div>
                {mode !== "forgot" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium">Passwort</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      className="h-11"
                    />
                  </div>
                )}

                {mode === "login" && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-muted-foreground hover:text-accent transition-colors"
                    >
                      Passwort vergessen?
                    </button>
                  </div>
                )}

                <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
                  {loading ? (
                    <span className="animate-pulse">Laden...</span>
                  ) : mode === "login" ? (
                    <>Anmelden <ArrowRight className="w-4 h-4 ml-1" /></>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-1" /> Link senden
                    </>
                  )}
                </Button>
              </form>

              {mode === "login" && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-3 text-muted-foreground">oder</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAppleSignIn}
                    disabled={appleLoading}
                    className="w-full h-11 text-sm font-medium bg-black text-white hover:bg-black/90 hover:text-white border-black"
                  >
                    {appleLoading ? (
                      <span className="animate-pulse">Laden...</span>
                    ) : (
                      <>
                        <AppleIcon />
                        <span className="ml-2">Mit Apple anmelden</span>
                      </>
                    )}
                  </Button>
                </>
              )}

              {mode === "forgot" ? (
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="w-full text-center text-sm text-accent font-medium hover:underline underline-offset-4 transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Zurück zur Anmeldung
                </button>
              ) : (
                <p className="text-center text-xs text-muted-foreground leading-relaxed">
                  Neue Konten können nur per Einladungslink vom Admin erstellt werden.
                </p>
              )}
            </motion.div>
          </AnimatePresence>

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
      </div>
    </div>
  );
}
