import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Copy, Plus, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Profile = { user_id: string; email: string | null; display_name: string | null };
type Invitation = {
  id: string; token: string; role: string; email: string | null; note: string | null;
  used_at: string | null; expires_at: string; created_at: string;
};

export default function AdminPanel({ adminUserId }: { adminUserId: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"employee" | "admin">("employee");
  const [newNote, setNewNote] = useState("");

  const refresh = async () => {
    const [{ data: p }, { data: r }, { data: inv }] = await Promise.all([
      supabase.from("profiles").select("user_id, email, display_name"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("invitations").select("*").order("created_at", { ascending: false }),
    ]);
    setProfiles(p ?? []);
    const map: Record<string, string> = {};
    (r ?? []).forEach((x: any) => {
      map[x.user_id] = map[x.user_id] === "admin" ? "admin" : x.role;
    });
    setRoles(map);
    setInvitations(inv ?? []);
  };

  useEffect(() => { refresh(); }, []);

  const createInvitation = async () => {
    const { data, error } = await supabase
      .from("invitations")
      .insert({ created_by: adminUserId, role: newRole, email: newEmail || null, note: newNote || null })
      .select().single();
    if (error) { toast.error(error.message); return; }
    const link = `${window.location.origin}/invite/${data.token}`;
    await navigator.clipboard.writeText(link).catch(() => {});
    toast.success("Einladungslink kopiert!");
    setNewEmail(""); setNewNote(""); setNewRole("employee");
    setOpen(false);
    refresh();
  };

  const copyLink = async (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link kopiert!");
  };

  const deleteInvitation = async (id: string) => {
    await supabase.from("invitations").delete().eq("id", id);
    refresh();
  };

  return (
    <Card className="p-4 space-y-4 border-primary/30">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h2 className="font-display font-semibold">Admin-Bereich</h2>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Users className="w-4 h-4" /> Mitarbeiter ({profiles.length})
        </div>
        <div className="space-y-1">
          {profiles.map((p) => (
            <div key={p.user_id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/40">
              <span className="truncate">{p.display_name || p.email}</span>
              <span className="text-muted-foreground">{roles[p.user_id] ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Einladungen</div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5 mr-1" /> Neu</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Einladung erstellen</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Rolle</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Mitarbeiter</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">E-Mail (optional, nur Notiz)</Label>
                  <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="max@firma.de" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notiz (optional)</Label>
                  <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="z.B. Praktikant" />
                </div>
                <Button className="w-full" onClick={createInvitation}>Erstellen & Link kopieren</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-1">
          {invitations.length === 0 && (
            <p className="text-xs text-muted-foreground">Noch keine Einladungen.</p>
          )}
          {invitations.map((inv) => {
            const expired = new Date(inv.expires_at) < new Date();
            const used = !!inv.used_at;
            return (
              <div key={inv.id} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/40">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{inv.email || inv.note || "Einladung"} · {inv.role}</div>
                  <div className="text-muted-foreground">
                    {used ? "Verwendet" : expired ? "Abgelaufen" : `Gültig bis ${new Date(inv.expires_at).toLocaleDateString("de-DE")}`}
                  </div>
                </div>
                {!used && !expired && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(inv.token)}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteInvitation(inv.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
