import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Check, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import SeoHead from "@/components/SeoHead";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Passwort zurücksetzen — Ledion";
  }, []);

  useEffect(() => {
    let mounted = true;

    const hash = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get("code");
    const errorDesc = queryParams.get("error_description") || hashParams.get("error_description");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && !!session)) {
        setIsRecovery(true);
        setChecking(false);
      }
    });

    (async () => {
      try {
        if (errorDesc) {
          toast.error(errorDesc);
        } else if (code) {
          // PKCE recovery flow: exchange the code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (mounted) setIsRecovery(true);
          window.history.replaceState({}, document.title, "/reset-password");
        } else if (hashParams.get("type") === "recovery" || hashParams.get("access_token")) {
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
          }
          if (mounted) setIsRecovery(true);
          window.history.replaceState({}, document.title, "/reset-password");
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (mounted && session) setIsRecovery(true);
        }
      } catch (err: any) {
        console.error("[reset-password] session error", err);
        if (mounted) toast.error(err?.message || "Reset-Link ungültig oder abgelaufen.");
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success("Passwort erfolgreich geändert");
      await supabase.auth.signOut();
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Zurücksetzen");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-sm text-muted-foreground animate-pulse">Sicherer Link wird geprüft…</div>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-card border rounded-2xl shadow-lg p-6 space-y-4 text-center">
          <h1 className="font-display font-bold text-xl">Reset-Link ungültig oder abgelaufen</h1>
          <p className="text-sm text-muted-foreground">Bitte fordere einen neuen Link zum Zurücksetzen an.</p>
          <Button onClick={() => navigate("/")} className="w-full h-11 text-sm font-semibold">
            Zur Login-Seite
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <SeoHead title="Passwort zurücksetzen — Ledion" description="Setze dein Ledion Security Konto-Passwort sicher zurück." path="/reset-password" noIndex />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-lg">
            <Briefcase className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-2xl">Neues Passwort</h1>
          <p className="text-sm text-muted-foreground">Gib dein neues Passwort ein</p>
        </div>

        <div className="bg-card border rounded-2xl shadow-lg p-6">
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-success" />
              </div>
              <p className="font-display font-semibold text-lg">Passwort geändert!</p>
              <p className="text-sm text-muted-foreground">Du wirst weitergeleitet...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs font-medium">Neues Passwort</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Mindestens 6 Zeichen"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs font-medium">Passwort bestätigen</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Nochmal eingeben"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
                {loading ? (
                  <span className="animate-pulse">Laden...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 mr-1.5" /> Passwort ändern
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </motion.main>
    </div>
  );
}
