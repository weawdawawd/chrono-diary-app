import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, Link2, CalendarClock, ShieldCheck, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import LiveMap from "@/components/admin/LiveMap";

type Profile = { user_id: string; email: string | null; display_name: string | null };

export default function DashboardPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [invitationsCount, setInvitationsCount] = useState(0);
  const [shiftsToday, setShiftsToday] = useState(0);
  const [activeNow, setActiveNow] = useState(0);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const t = new Date().toTimeString().slice(0, 8);
      console.info("[admin-auth] Admin-Dashboard lädt Daten", { today });
      const [profilesResult, rolesResult, invitationsResult, shiftsResult] = await Promise.all([
        supabase.from("profiles").select("user_id, email, display_name"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("invitations").select("id, used_at, expires_at"),
        supabase.from("shifts").select("id, date, start_time, end_time").eq("date", today),
      ]);

      const errors = [
        profilesResult.error && `profiles: ${profilesResult.error.message}`,
        rolesResult.error && `user_roles: ${rolesResult.error.message}`,
        invitationsResult.error && `invitations: ${invitationsResult.error.message}`,
        shiftsResult.error && `shifts: ${shiftsResult.error.message}`,
      ].filter(Boolean) as string[];
      if (errors.length > 0) console.error("[admin-auth] Admin-Dashboard Datenfehler", errors);
      setLoadErrors(errors);

      const p = profilesResult.data ?? [];
      const r = rolesResult.data ?? [];
      const inv = invitationsResult.data ?? [];
      const s = shiftsResult.data ?? [];
      setProfiles(p);
      const map: Record<string, string> = {};
      r.forEach((x: any) => {
        map[x.user_id] = map[x.user_id] === "admin" ? "admin" : x.role;
      });
      setRoles(map);
      const open = inv.filter(
        (i: any) => !i.used_at && new Date(i.expires_at) > new Date()
      );
      setInvitationsCount(open.length);
      setShiftsToday(s.length);
      setActiveNow(s.filter((x: any) => x.start_time <= t && x.end_time >= t).length);
      console.info("[admin-auth] Admin-Dashboard Daten geladen", { profiles: p.length, roles: r.length, shiftsToday: s.length, errors });
    })();
  }, []);

  const employees = profiles.filter((p) => roles[p.user_id] === "employee");

  const stats = [
    { to: "/admin/employees", icon: Users, value: employees.length, label: "Mitarbeiter", tint: "from-primary/20 to-primary/5" },
    { to: "/admin/invitations", icon: Link2, value: invitationsCount, label: "Offene Einladungen", tint: "from-accent/20 to-accent/5" },
    { to: "/admin/shifts", icon: CalendarClock, value: shiftsToday, label: "Schichten heute", tint: "from-sky-500/20 to-sky-500/5" },
    { to: "/admin/shifts", icon: Activity, value: activeNow, label: "Live aktiv", tint: "from-emerald-500/20 to-emerald-500/5", live: activeNow > 0 },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-background to-accent/10 p-5">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl leading-tight">Admin-Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>
      </div>

      {loadErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Einige Admin-Daten konnten nicht geladen werden</AlertTitle>
          <AlertDescription>
            Das Dashboard bleibt geöffnet. Details stehen in der Konsole unter <span className="font-mono">[admin-auth]</span>.
            <ul className="mt-2 list-disc pl-4">
              {loadErrors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <Link key={i} to={s.to}>
            <Card className={`relative overflow-hidden p-4 hover:border-primary/50 hover:-translate-y-0.5 transition-all bg-gradient-to-br ${s.tint}`}>
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-background/60 backdrop-blur flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-primary" />
                </div>
                {s.live && (
                  <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <p className="text-3xl font-display font-bold mt-3 leading-none">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <LiveMap />

      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Users className="w-4 h-4" /> Registrierte Mitarbeiter
        </div>
        {employees.length === 0 ? (
          <p className="text-xs text-muted-foreground">Noch keine Mitarbeiter registriert.</p>
        ) : (
          <div className="space-y-1">
            {employees.map((p) => (
              <div key={p.user_id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/40">
                <span className="truncate">{p.display_name || p.email}</span>
                <span className="text-muted-foreground">{roles[p.user_id]}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
