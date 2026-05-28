import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Link2, Plus, Copy, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Invitation = Tables<"invitations">;

export default function InvitationsPage() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creating, setCreating] = useState(false);


  const refresh = async () => {
    const { data } = await supabase.from("invitations").select("*").order("created_at", { ascending: false });
    setInvitations(data ?? []);
  };
  useEffect(() => { refresh(); }, []);

  const openWhatsApp = (link: string, name: string, phone: string) => {
    const greeting = name ? `Hallo ${name},` : "Hallo,";
    const text = `${greeting}\n\nhier ist dein persönlicher Einladungslink für die Stunden-App:\n${link}\n\nBitte öffne den Link und erstelle dein Konto. Danke!`;
    const cleanPhone = phone.replace(/[^\d]/g, "");
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const create = async () => {
    if (!user) return;
    if (!newName.trim()) { toast.error("Bitte Name eingeben"); return; }
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("invitations")
        .insert({ created_by: user.id, role: "employee", note: newName.trim() })
        .select().single();
      if (error) throw error;
      const link = `${window.location.origin}/invite/${data.token}`;
      try { await navigator.clipboard.writeText(link); } catch {}
      toast.success("Link kopiert!", { description: link });
      openWhatsApp(link, newName.trim(), newPhone.trim());
      setNewName(""); setNewPhone(""); setOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Fehler");
    } finally { setCreating(false); }
  };

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
    toast.success("Link kopiert!");
  };

  const shareWA = (token: string, name: string | null) => {
    openWhatsApp(`${window.location.origin}/invite/${token}`, name || "", "");
  };

  const remove = async (id: string) => {
    await supabase.from("invitations").delete().eq("id", id);
    refresh();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-lg">Einladungen</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Neuer Link</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Einladungslink erstellen</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name des Mitarbeiters *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="z.B. Max Mustermann" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">WhatsApp-Nummer (optional)</Label>
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="z.B. 491701234567" inputMode="tel" />
                <p className="text-[11px] text-muted-foreground">
                  Mit Ländervorwahl ohne „+" (49 = DE).
                </p>
              </div>
              <Button className="w-full" onClick={create} disabled={creating}>
                <MessageCircle className="w-4 h-4 mr-1" />
                {creating ? "Erstelle…" : "Erstellen & per WhatsApp senden"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {invitations.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">Noch keine Einladungen.</Card>
      ) : (
        <Card className="p-3 space-y-1.5">
          {invitations.map((inv) => {
            const expired = new Date(inv.expires_at) < new Date();
            const used = !!inv.used_at;
            return (
              <div key={inv.id} className="flex items-center gap-2 text-xs p-2.5 rounded-lg bg-muted/40">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{inv.note || "Einladung"}</div>
                  <div className="text-muted-foreground">
                    {used ? `Verwendet am ${format(new Date(inv.used_at!), "d. MMM", { locale: de })}`
                      : expired ? "Abgelaufen"
                      : `Gültig bis ${format(new Date(inv.expires_at), "d. MMM yyyy", { locale: de })}`}
                  </div>
                </div>
                {!used && !expired && (
                  <>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => shareWA(inv.token, inv.note)} title="WhatsApp">
                      <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(inv.token)} title="Kopieren">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(inv.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
