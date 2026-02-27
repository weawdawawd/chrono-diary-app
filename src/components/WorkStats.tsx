import { WorkEntry, calculateDurationMinutes } from "@/lib/types";
import { Clock, MapPin, CalendarDays } from "lucide-react";

interface Props {
  entries: WorkEntry[];
}

export default function WorkStats({ entries }: Props) {
  const totalMinutes = entries.reduce(
    (sum, e) => sum + calculateDurationMinutes(e.startTime, e.endTime),
    0
  );
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;
  const uniqueLocations = new Set(entries.map((e) => e.location)).size;
  const uniqueDays = new Set(entries.map((e) => e.date)).size;

  const stats = [
    {
      icon: Clock,
      label: "Gesamtstunden",
      value: `${totalHours}h ${totalMins.toString().padStart(2, "0")}m`,
    },
    {
      icon: CalendarDays,
      label: "Arbeitstage",
      value: uniqueDays.toString(),
    },
    {
      icon: MapPin,
      label: "Orte",
      value: uniqueLocations.toString(),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-card rounded-xl p-4 text-center shadow-sm border"
        >
          <s.icon className="w-5 h-5 mx-auto mb-2 text-accent" />
          <p className="font-display font-bold text-xl text-foreground">{s.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
