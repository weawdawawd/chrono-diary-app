import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type WorkEntry = Tables<"work_entries">;

export function useWorkEntries(userId: string | undefined) {
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const archivePastMonthEntries = useCallback(async () => {
    if (!userId) return;
    const now = new Date();
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    await supabase
      .from("work_entries")
      .update({ archived: true })
      .eq("user_id", userId)
      .eq("archived", false)
      .lt("date", firstOfMonth);
  }, [userId]);

  const fetchEntries = useCallback(async () => {
    if (!userId) return;
    await archivePastMonthEntries();
    const { data } = await supabase
      .from("work_entries")
      .select("*")
      .order("date", { ascending: false })
      .order("start_time", { ascending: false });
    setEntries(data || []);
    setLoading(false);
  }, [userId, archivePastMonthEntries]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = async (entry: {
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
    breakMinutes?: number;
    includeBreak?: boolean;
    project?: string | null;
  }) => {
    if (!userId) return;
    const { error } = await supabase.from("work_entries").insert({
      user_id: userId,
      date: entry.date,
      start_time: entry.startTime,
      end_time: entry.endTime,
      location: entry.location,
      description: entry.description,
      break_minutes: entry.breakMinutes ?? 0,
      include_break: entry.includeBreak ?? true,
      project: entry.project ?? null,
    });
    if (error) throw error;

    // Upsert saved location
    const { data: existing } = await supabase
      .from("saved_locations")
      .select("id, usage_count")
      .eq("user_id", userId)
      .eq("name", entry.location)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("saved_locations")
        .update({ usage_count: existing.usage_count + 1, last_used_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("saved_locations").insert({ user_id: userId, name: entry.location });
    }

    await fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("work_entries").delete().eq("id", id);
    await fetchEntries();
  };

  const deleteEntriesByDateRange = async (from: string, to: string) => {
    if (!userId) return 0;
    const { data } = await supabase
      .from("work_entries")
      .select("id")
      .eq("user_id", userId)
      .gte("date", from)
      .lte("date", to);
    if (!data || data.length === 0) return 0;
    const ids = data.map((d) => d.id);
    await supabase.from("work_entries").delete().in("id", ids);
    await fetchEntries();
    return ids.length;
  };

  const editEntry = async (id: string, updates: { date: string; start_time: string; end_time: string; location: string; description: string }) => {
    const { error } = await supabase.from("work_entries").update(updates).eq("id", id);
    if (error) throw error;
    await fetchEntries();
  };

  return { entries, loading, addEntry, deleteEntry, deleteEntriesByDateRange, editEntry };
}
