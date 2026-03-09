import { WorkEntry, calculateDurationMinutes } from "@/lib/types";
import { Clock, MapPin, CalendarDays, TrendingUp, Timer, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  entries: WorkEntry[];
  weeklyTargetHours?: number;
}

export default function WorkStats({ entries, weeklyTargetHours = 40 }: Props) {
  const totalMinutes = entries.reduce((sum, e) => {
    const raw = calculateDurationMinutes(e.start_time, e.end_time);
    const breakDeduction = (e as any).include_break ? ((e as any).break_minutes || 0) : 0;
    return sum + raw - breakDeduction;
  }, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;
  const uniqueLocations = new Set(entries.map((e) => e.location)).size;
  const uniqueDays = new Set(entries.map((e) => e.date)).size;
  const avgPerDay = uniqueDays > 0 ? Math.round(totalMinutes / uniqueDays) : 0;
  const avgH = Math.floor(avgPerDay / 60);
  const avgM = avgPerDay % 60;

  // Overtime: calculate for current week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  startOfWeek.setHours(0, 0, 0, 0);
  
  const weekMinutes = entries
    .filter((e) => new Date(e.date) >= startOfWeek)
    .reduce((sum, e) => {
      const raw = calculateDurationMinutes(e.start_time, e.end_time);
      const breakDeduction = (e as any).include_break ? ((e as any).break_minutes || 0) : 0;
      return sum + raw - breakDeduction;
    }, 0);

  const targetMinutes = weeklyTargetHours * 60;
  const overtimeMinutes = weekMinutes - targetMinutes;
  const otAbs = Math.abs(overtimeMinutes);
  const otH = Math.floor(otAbs / 60);
  const otM = otAbs % 60;
  const overtimeLabel = overtimeMinutes >= 0 ? `+${otH}h ${otM.toString().padStart(2, "0")}m` : `-${otH}h ${otM.toString().padStart(2, "0")}m`;

  const stats = [
    { icon: Clock, label: "Gesamt", value: `${totalHours}h ${totalMins.toString().padStart(2, "0")}m`, color: "text-primary" },
    { icon: CalendarDays, label: "Tage", value: uniqueDays.toString(), color: "text-accent" },
    { icon: MapPin, label: "Orte", value: uniqueLocations.toString(), color: "text-accent" },
    { icon: TrendingUp, label: "Ø/Tag", value: `${avgH}h ${avgM.toString().padStart(2, "0")}m`, color: "text-success" },
    { icon: overtimeMinutes >= 0 ? Timer : AlertTriangle, label: "Überstunden", value: overtimeLabel, color: overtimeMinutes >= 0 ? "text-success" : "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
