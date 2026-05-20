import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Siren } from "lucide-react";
import { toast } from "sonner";

export default function SosButton({
  userId,
  activeShiftId,
}: {
  userId: string;
  activeShiftId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const trigger = async () => {
    setSending(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!("geolocation" in navigator)) return reject(new Error("Kein GPS"));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 15_000,
        });
      });
      const { error } = await supabase.from("sos_alerts").insert({
        user_id: userId,
        shift_id: activeShiftId ?? null,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        message: message.trim() || null,
      });
      if (error) throw error;
      toast.success("Notruf abgesendet", {
        description: "Admin und Kollegen im Umkreis von 1 km werden alarmiert.",
        duration: 6000,
      });
      setMessage("");
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Notruf fehlgeschlagen");
    } finally {
      setSending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="lg"
          className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/30 animate-pulse"
        >
          <Siren className="w-5 h-5 mr-2" />
          SOS NOTRUF
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Siren className="w-5 h-5" /> Notruf auslösen?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Dein aktueller Standort wird sofort an den Admin und alle Kollegen
            im Umkreis von 1 km gesendet. Nutze diese Funktion nur in einer
            echten Gefahrensituation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5">
          <Label className="text-xs">Kurze Nachricht (optional)</Label>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="z.B. Person bedroht, Verletzung..."
            maxLength={200}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={sending}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); trigger(); }}
            disabled={sending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {sending ? "Sende…" : "Notruf senden"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
