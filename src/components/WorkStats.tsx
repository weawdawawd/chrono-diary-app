import { WorkEntry, calculateDurationMinutes } from "@/lib/types";
import { Clock, MapPin, CalendarDays, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  entries: WorkEntry[];
}

export default function WorkStats({ entries }: Props) {
  const totalMinutes = entries.reduce(
    (sum, e) => sum + calculateDurationMinutes(e.start_time, e.end_time),
    0
  );
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;
  const uniqueLocations = new Set(entries.map((e) => e.location)).size;
  const uniqueDays = new Set(entries.map((e) => e.date)).size;
  const avgPerDay = uniqueDays > 0 ? Math.round(totalMinutes / uniqueDays) : 0;
  const avgH = Math.floor(avgPerDay / 60);
  const avgM = avgPerDay % 60;

  const stats = [
    { icon: Clock, label: "Gesamt", value: `${totalHours}h ${totalMins.toString().padStart(2, "0")}m`, color: "text-primary" },
    { icon: CalendarDays, label: "Tage", value: uniqueDays.toString(), color: "text-accent" },
    { icon: MapPin, label: "Orte", value: uniqueLocations.toString(), color: "text-accent" },
    { icon: TrendingUp, label: "Ø/Tag", value: `${avgH}h ${avgM.toString().padStart(2, "0")}m`, color: "text-success" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="bg-card rounded-xl p-4 text-center shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mx-auto mb-2">
            <s.icon className={`w-4 h-4 ${s.color}`} />
          </div>
          <p className="font-display font-bold text-lg text-foreground leading-tight">{s.value}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
