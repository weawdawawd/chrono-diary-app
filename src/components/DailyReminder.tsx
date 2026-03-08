import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

const REMINDER_KEY = "worktime_reminder";

interface ReminderConfig {
  enabled: boolean;
  time: string;
}

function getConfig(): ReminderConfig {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: false, time: "17:00" };
}

export default function DailyReminder() {
  const [config, setConfig] = useState<ReminderConfig>(getConfig);
  const [permissionGranted, setPermissionGranted] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );

  useEffect(() => {
    localStorage.setItem(REMINDER_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (!config.enabled || !permissionGranted) return;

    const check = () => {
      const now = new Date();
      const [h, m] = config.time.split(":").map(Number);
      if (now.getHours() === h && now.getMinutes() === m) {
        new Notification("Arbeitszeit Erinnerung ⏰", {
          body: "Vergiss nicht, deine Arbeitszeiten einzutragen!",
          icon: "/favicon.ico",
        });
      }
    };

    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [config, permissionGranted]);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Benachrichtigungen werden in diesem Browser nicht unterstützt");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setPermissionGranted(true);
      setConfig((c) => ({ ...c, enabled: true }));
      toast.success("Erinnerungen aktiviert!");
    } else {
      toast.error("Berechtigung für Benachrichtigungen wurde verweigert");
    }
  };

  const toggle = (enabled: boolean) => {
    if (enabled && !permissionGranted) {
      requestPermission();
    } else {
      setConfig((c) => ({ ...c, enabled }));
    }
  };

  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            {config.enabled ? (
              <Bell className="w-3.5 h-3.5 text-primary" />
            ) : (
              <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">Tägliche Erinnerung</h3>
            <p className="text-[11px] text-muted-foreground">Arbeitszeiten eintragen</p>
          </div>
        </div>
        <Switch checked={config.enabled} onCheckedChange={toggle} />
      </div>
      {config.enabled && (
        <div className="mt-3 flex items-center gap-2">
          <Label htmlFor="reminder-time" className="text-xs shrink-0">Uhrzeit:</Label>
          <Input
            id="reminder-time"
            type="time"
            value={config.time}
            onChange={(e) => setConfig((c) => ({ ...c, time: e.target.value }))}
            className="h-8 w-28 text-xs"
          />
        </div>
      )}
    </div>
  );
}
