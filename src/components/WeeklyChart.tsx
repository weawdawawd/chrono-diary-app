import { useMemo } from "react";
import { WorkEntry, calculateDurationMinutes } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parseISO, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

interface Props {
  entries: WorkEntry[];
}

export default function WeeklyChart({ entries }: Props) {
  const chartData = useMemo(() => {
    if (entries.length === 0) return [];

    const dates = entries.map((e) => parseISO(e.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const weeks = eachWeekOfInterval(
      { start: minDate, end: maxDate },
      { weekStartsOn: 1 }
    );

    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekEntries = entries.filter((e) => {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      });
      const totalMinutes = weekEntries.reduce(
        (sum, e) => sum + calculateDurationMinutes(e.start_time, e.end_time),
        0
      );
      return {
        week: format(weekStart, "dd.MM", { locale: de }),
        stunden: Math.round((totalMinutes / 60) * 10) / 10,
        eintraege: weekEntries.length,
      };
    }).slice(-8); // Last 8 weeks
  }, [entries]);

  if (chartData.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border rounded-xl p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="font-display font-semibold text-sm">Wochenübersicht</h3>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barSize={24}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={30}
            unit="h"
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.75rem",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(value: number) => [`${value}h`, "Stunden"]}
            labelFormatter={(label) => `KW ab ${label}`}
          />
          <Bar
            dataKey="stunden"
            fill="hsl(var(--primary))"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
