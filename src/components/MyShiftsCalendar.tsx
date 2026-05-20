import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import ShiftMiniCalendar from "@/components/ShiftMiniCalendar";

type Shift = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  service_type: "security" | "cleaning";
  assignment_status: "pending" | "accepted" | "declined";
};

export default function MyShiftsCalendar({ userId }: { userId: string }) {
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("shifts")
        .select("id, date, start_time, end_time, location, service_type, assignment_status")
        .eq("employee_user_id", userId)
        .order("date");
      setShifts((data ?? []) as Shift[]);
    })();
  }, [userId]);

  if (shifts.length === 0) return null;

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-primary" />
        <h2 className="font-display font-semibold text-sm">Mein Schicht-Kalender</h2>
      </div>
      <ShiftMiniCalendar shifts={shifts} />
    </Card>
  );
}
