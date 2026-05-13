import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, LogIn, UserPlus, Clock, ArrowRight, KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "login" | "forgot";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
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
      toast.error(err.message || "Ein Fehler ist aufgetreten");
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
            <div className="relative inline-flex">
              <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-lg">
                <Briefcase className="w-10 h-10 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-md">
                <Clock className="w-4 h-4 text-accent-foreground" />
              </div>
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl text-foreground">Arbeitszeit</h1>
              <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
                Erfasse deine Arbeitszeiten einfach und schnell – überall und jederzeit.
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">oder</span>
                </div>
              </div>

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
