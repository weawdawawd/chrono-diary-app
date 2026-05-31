import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.functions.invoke("accept-invitation", {
        body: { token, action: "check" },
      });
      if (error) setErrorMsg("Einladung ungültig");
      else if ((data as any)?.error) setErrorMsg((data as any).error);
      else {
        setValid(true);
        if ((data as any)?.email) setEmail((data as any).email);
        if ((data as any)?.displayName) setDisplayName((data as any).displayName);
      }
      setChecking(false);
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("accept-invitation", {
        body: { token, email, password, displayName },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) throw signInErr;
      toast.success("Konto erstellt – willkommen!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message ?? "Fehler beim Erstellen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <SeoHead title="Einladung annehmen — Ledion" description="Akzeptiere deine Einladung zum Ledion Security Team und richte dein Mitarbeiter-Konto ein." path="/invite" />
      <main className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center shadow-lg mb-3">
            <Briefcase className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-2xl">Einladung annehmen</h1>
          <p className="text-sm text-muted-foreground mt-1">Erstelle dein Mitarbeiter-Konto</p>
        </div>

        <div className="bg-card border rounded-2xl shadow-lg p-6">
          {checking ? (
            <p className="text-center text-sm text-muted-foreground animate-pulse">Einladung wird geprüft…</p>
          ) : !valid ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-destructive font-medium">{errorMsg}</p>
              <Button variant="outline" onClick={() => navigate("/")}>Zur Anmeldung</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">Name (optional)</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">E-Mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">Passwort (mind. 6 Zeichen)</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Erstelle…" : (<><UserPlus className="w-4 h-4 mr-1" /> Konto erstellen</>)}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
