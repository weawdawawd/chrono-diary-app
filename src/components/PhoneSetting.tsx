import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { toast } from "sonner";

/**
 * Inline Telefonnummer-Editor für Mitarbeiter, damit der Admin sie anrufen kann.
 */
export default function PhoneSetting({ userId }: { userId: string }) {
  const [phone, setPhone] = useState("");
  const [original, setOriginal] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("phone")
        .eq("user_id", userId)
        .maybeSingle();
      const p = (data as any)?.phone ?? "";
      setPhone(p);
      setOriginal(p);
    })();
  }, [userId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ phone: phone.trim() || null } as any)
      .eq("user_id", userId);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Telefonnummer gespeichert"); setOriginal(phone); }
  };

  return (
    <Card className="p-3 flex items-center gap-2">
      <Phone className="w-4 h-4 text-accent shrink-0" />
      <Input
        type="tel"
        placeholder="Telefon (z. B. +49 170 …)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="h-9 text-sm"
      />
      <Button size="sm" className="h-9 shrink-0" disabled={saving || phone === original} onClick={save}>
        Speichern
      </Button>
    </Card>
  );
}
