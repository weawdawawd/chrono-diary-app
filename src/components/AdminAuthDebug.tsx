import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

type AdminAuthDebugProps = {
  email?: string | null;
  userId?: string;
  message: string;
  code?: string;
  details?: string;
  onRetry?: () => void;
};

export default function AdminAuthDebug({ email, userId, message, code, details, onRetry }: AdminAuthDebugProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Admin-Anmeldung konnte nicht abgeschlossen werden</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{message}</p>
          <div className="rounded-md bg-background/70 p-3 text-xs text-foreground/80 space-y-1">
            <div><span className="font-semibold">E-Mail:</span> {email || "unbekannt"}</div>
            {userId && <div><span className="font-semibold">User-ID:</span> {userId}</div>}
            {code && <div><span className="font-semibold">Code:</span> {code}</div>}
            {details && <div><span className="font-semibold">Details:</span> {details}</div>}
          </div>
          <p className="text-xs">Debug-Logs stehen in der Browser-Konsole unter <span className="font-mono">[admin-auth]</span>.</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="w-full">
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Rollen erneut laden
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}