import { useMemo } from "react";
import { WorkEntry, calculateDurationMinutes } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface Props {
  entries: WorkEntry[];
}

export default function MonthlyComparisonChart({ entries }: Props) {
  const chartData = useMemo(() => {
    if (entries.length === 0) return [];

    const monthMap: Record<string, number> = {};
    entries.forEach((e) => {
      const d = parseISO(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] || 0) + calculateDurationMinutes(e.start_time, e.end_time);
    });

    return Object.keys(monthMap)
      .sort()
      .slice(-12)
      .map((key) => ({
        monat: format(parseISO(`${key}-01`), "MMM yy", { locale: de }),
        stunden: Math.round((monthMap[key] / 60) * 10) / 10,
      }));
  }, [entries]);

  if (chartData.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-card border rounded-xl p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
          <TrendingUp className="w-3.5 h-3.5 text-accent" />
        </div>
        <h3 className="font-display font-semibold text-sm">Monatsvergleich</h3>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barSize={24}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="monat"
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
          />
          <Bar
            dataKey="stunden"
            fill="hsl(var(--accent))"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
