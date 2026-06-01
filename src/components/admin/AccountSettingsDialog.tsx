import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog, Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AvatarUpload from "@/components/AvatarUpload";

interface Props {
  currentEmail?: string;
  userId?: string;
  controlledOpen?: boolean;
  onOpenChange?: (v: boolean) => void;
  hideTrigger?: boolean;
}

export default function AccountSettingsDialog({ currentEmail, controlledOpen, onOpenChange, hideTrigger }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [email, setEmail] = useState(currentEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);

  const updateEmail = async () => {
    if (!email.trim() || email === currentEmail) return;
    setLoadingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) throw error;
      toast.success("Bestätigungs-E-Mail an die neue Adresse gesendet.");
    } catch (e: any) {
      toast.error(e.message || "E-Mail konnte nicht geändert werden");
    } finally {
      setLoadingEmail(false);
    }
  };

  const updatePassword = async () => {
    if (password.length < 6) return toast.error("Passwort muss mindestens 6 Zeichen lang sein");
    if (password !== confirmPwd) return toast.error("Passwörter stimmen nicht überein");
    setLoadingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Passwort aktualisiert");
      setPassword(""); setConfirmPwd("");
    } catch (e: any) {
      toast.error(e.message || "Passwort konnte nicht geändert werden");
    } finally {
      setLoadingPwd(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Konto">
            <UserCog className="w-4 h-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <UserCog className="w-5 h-5 text-accent" /> Konto-Einstellungen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-accent" />
              <Label className="text-sm font-semibold">E-Mail-Adresse ändern</Label>
            </div>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 text-sm" placeholder="neue@email.de" />
            <p className="text-[11px] text-muted-foreground">Du erhältst eine Bestätigungs-Mail an die neue Adresse.</p>
            <Button onClick={updateEmail} disabled={loadingEmail || !email.trim() || email === currentEmail} size="sm" className="w-full h-9">
              {loadingEmail ? "Sende…" : "E-Mail aktualisieren"}
            </Button>
          </section>

          <div className="h-px bg-border" />

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-accent" />
              <Label className="text-sm font-semibold">Passwort ändern</Label>
            </div>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-9 text-sm" placeholder="Neues Passwort" autoComplete="new-password" />
            <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className="h-9 text-sm" placeholder="Passwort bestätigen" autoComplete="new-password" />
            <Button onClick={updatePassword} disabled={loadingPwd || !password || !confirmPwd} size="sm" className="w-full h-9">
              {loadingPwd ? "Speichere…" : "Passwort aktualisieren"}
            </Button>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
