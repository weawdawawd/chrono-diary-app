import { AlertTriangle, Database, Key, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const SetupRequired = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-xl">Konfiguration erforderlich</CardTitle>
          <CardDescription>
            Die App benötigt eine Supabase-Datenbankverbindung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>Supabase einrichten</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>Bitte setze die folgenden Umgebungsvariablen:</p>
              <div className="mt-3 space-y-2 rounded-md bg-muted p-3 font-mono text-sm">
                <div className="flex items-center gap-2">
                  <Key className="h-3 w-3 text-muted-foreground" />
                  <span>VITE_SUPABASE_URL</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="h-3 w-3 text-muted-foreground" />
                  <span>VITE_SUPABASE_ANON_KEY</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="rounded-lg border bg-card p-4">
            <h4 className="mb-2 font-medium">So findest du die Werte:</h4>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Öffne dein Supabase Dashboard</li>
              <li>Gehe zu Settings → API</li>
              <li>Kopiere die Project URL und den anon public Key</li>
            </ol>
          </div>

          <a 
            href="https://supabase.com/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Supabase Dashboard öffnen
          </a>
        </CardContent>
      </Card>
    </div>
  );
};
