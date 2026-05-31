import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, MailX } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import SeoHead from "@/components/SeoHead";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "valid" | "invalid" | "already" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } }
        );
        const data = await res.json();
        if (data?.valid) setState("valid");
        else if (data?.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON },
          body: JSON.stringify({ token }),
        }
      );
      const data = await res.json();
      if (data?.success) setState("done");
      else if (data?.reason === "already_unsubscribed") setState("already");
      else setState("error");
    } catch {
      setState("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <SeoHead title="E-Mail-Abmeldung — Ledion" description="Melde dich von Ledion Security E-Mail-Benachrichtigungen ab." path="/unsubscribe" noIndex />
      <Card className="w-full max-w-md p-6 space-y-4 text-center">
        <div className="flex justify-center"><BrandLogo size={48} /></div>
        <h1 className="font-display font-bold text-xl">E-Mail-Abmeldung</h1>

        {state === "loading" && (
          <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">Token wird geprüft…</p>
          </div>
        )}

        {state === "valid" && (
          <>
            <p className="text-sm text-muted-foreground">
              Möchtest du dich von zukünftigen E-Mails abmelden?
            </p>
            <Button onClick={confirm} disabled={submitting} className="w-full">
              <MailX className="w-4 h-4 mr-2" />
              {submitting ? "Wird abgemeldet…" : "Abmeldung bestätigen"}
            </Button>
          </>
        )}

        {state === "done" && (
          <div className="flex flex-col items-center gap-2 py-2">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
            <p className="text-sm">Du wurdest erfolgreich abgemeldet.</p>
          </div>
        )}

        {state === "already" && (
          <div className="flex flex-col items-center gap-2 py-2">
            <CheckCircle2 className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Du bist bereits abgemeldet.</p>
          </div>
        )}

        {(state === "invalid" || state === "error") && (
          <div className="flex flex-col items-center gap-2 py-2">
            <XCircle className="w-10 h-10 text-destructive" />
            <p className="text-sm text-muted-foreground">
              {state === "invalid" ? "Ungültiger oder abgelaufener Link." : "Es ist ein Fehler aufgetreten."}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
