import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Bitte E-Mail und Passwort eingeben");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Willkommen zurück!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Konto erstellt! Bitte bestätige deine E-Mail.");
      }
    } catch (err: any) {
      toast.error(err.message || "Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <Briefcase className="w-7 h-7 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">
            {isLogin ? "Anmelden" : "Konto erstellen"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isLogin
              ? "Melde dich an, um deine Arbeitszeiten zu verwalten"
              : "Erstelle ein Konto, um loszulegen"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="deine@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                "Laden..."
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4 mr-1.5" /> Anmelden
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-1.5" /> Registrieren
                </>
              )}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {isLogin ? "Noch kein Konto?" : "Bereits registriert?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-accent font-medium hover:underline"
            >
              {isLogin ? "Registrieren" : "Anmelden"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
