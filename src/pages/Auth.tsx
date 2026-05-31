import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import SeoHead from "@/components/SeoHead";

const AppleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);

type Mode = "login" | "forgot";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      // if redirected the browser navigates away
    } catch (err: any) {
      console.error(`[auth] ${provider} sign-in error`, err);
      toast.error(err?.message || `${provider === "google" ? "Google" : "Apple"}-Anmeldung fehlgeschlagen.`);
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Bitte E-Mail eingeben"); return; }
    if (mode !== "forgot" && !password.trim()) { toast.error("Bitte Passwort eingeben"); return; }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Willkommen zurück!");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("E-Mail zum Zurücksetzen gesendet!");
        setMode("login");
      }
    } catch (err: any) {
      const msg = err?.message || "";
      let userMsg = "Ein Fehler ist aufgetreten.";
      if (/invalid login credentials/i.test(msg)) userMsg = "E-Mail oder Passwort ungültig.";
      else if (/email not confirmed/i.test(msg)) userMsg = "Bitte bestätige zuerst deine E-Mail.";
      else if (/already registered|user already/i.test(msg)) userMsg = "Diese E-Mail ist bereits registriert.";
      else if (/rate limit|too many/i.test(msg)) userMsg = "Zu viele Versuche. Bitte später erneut.";
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
      <SeoHead
        title="Anmeldung — Ledion Security"
        description="Anmelden bei Ledion Security: Arbeitszeit-Erfassung, Schichtplanung und Wachbuch für dein Sicherheitsteam."
        path="/"
      />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center space-y-4">
            <div className="relative inline-flex flex-col items-center">
              <div className="absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-accent/30 via-brand-red/10 to-transparent blur-2xl" />
              <img src={(new URL("../assets/ledion-logo.png", import.meta.url)).href} alt="Ledion Security" className="relative w-24 h-24 object-contain drop-shadow-xl" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl tracking-tight">
                LEDION <span className="text-brand-red">SECURITY</span>
                <span className="sr-only"> — Arbeitszeit-Erfassung &amp; Schichtplanung</span>
              </h1>
              <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
                Arbeitszeit-Erfassung &amp; Schichtplanung für dein Sicherheitsteam.
              </p>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-card border rounded-2xl shadow-lg p-6 space-y-5"
            >
              <div className="text-center">
                <h2 className="font-display font-semibold text-xl">{titles[mode].h}</h2>
                <p className="text-xs text-muted-foreground mt-1">{titles[mode].sub}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-medium">Name (optional)</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vor- und Nachname" className="h-11" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">E-Mail</Label>
                  <Input id="email" type="email" placeholder="deine@email.de" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="h-11" />
                </div>
                {mode !== "forgot" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium">Passwort</Label>
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} className="h-11" />
                  </div>
                )}

                {mode === "login" && (
                  <div className="text-right">
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-accent transition-colors">
                      Passwort vergessen?
                    </button>
                  </div>
                )}

                <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
                  {loading ? <span className="animate-pulse">Laden...</span>
                    : mode === "login" ? <>Anmelden <ArrowRight className="w-4 h-4 ml-1" /></>
                    : mode === "signup" ? <>Konto erstellen <ArrowRight className="w-4 h-4 ml-1" /></>
                    : <><KeyRound className="w-4 h-4 mr-1" /> Link senden</>}
                </Button>
              </form>

              {mode !== "forgot" && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-3 text-muted-foreground">oder weiter mit</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" onClick={() => handleOAuth("google")} disabled={!!oauthLoading} className="h-11 text-sm font-medium">
                      {oauthLoading === "google" ? <span className="animate-pulse">…</span> : <><GoogleIcon /><span className="ml-2">Google</span></>}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => handleOAuth("apple")} disabled={!!oauthLoading} className="h-11 text-sm font-medium bg-black text-white hover:bg-black/90 hover:text-white border-black">
                      {oauthLoading === "apple" ? <span className="animate-pulse">…</span> : <><AppleIcon /><span className="ml-2">Apple</span></>}
                    </Button>
                  </div>
                </>
              )}

              {mode === "forgot" ? (
                <button type="button" onClick={() => setMode("login")} className="w-full text-center text-sm text-accent font-medium hover:underline underline-offset-4 flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Zurück zur Anmeldung
                </button>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  {mode === "login" ? (
                    <>Noch kein Konto?{" "}
                      <button type="button" onClick={() => setMode("signup")} className="text-accent font-medium hover:underline">Jetzt registrieren</button>
                    </>
                  ) : (
                    <>Schon ein Konto?{" "}
                      <button type="button" onClick={() => setMode("login")} className="text-accent font-medium hover:underline">Anmelden</button>
                    </>
                  )}
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-success" />Sicher & verschlüsselt</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-accent" />PDF Export</span>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
