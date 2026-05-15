import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSavedActivities(userId: string | undefined) {
  const [activities, setActivities] = useState<string[]>([]);

  const fetch = useCallback(async () => {
    if (!userId) return;
    const [own, global] = await Promise.all([
      supabase
        .from("saved_activities")
        .select("name")
        .eq("user_id", userId)
        .order("usage_count", { ascending: false })
        .limit(50),
      supabase.from("global_activities").select("name").order("name"),
    ]);
    const merged = new Set<string>();
    (global.data ?? []).forEach((d: any) => merged.add(d.name));
    (own.data ?? []).forEach((d: any) => merged.add(d.name));
    setActivities(Array.from(merged));
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const upsertActivity = useCallback(
    async (name: string) => {
      if (!userId || !name.trim()) return;
      const { data: existing } = await supabase
        .from("saved_activities")
        .select("id, usage_count")
        .eq("user_id", userId)
        .eq("name", name.trim())
        .maybeSingle();

      if (existing) {
        await supabase
          .from("saved_activities")
          .update({ usage_count: existing.usage_count + 1, last_used_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("saved_activities").insert({ user_id: userId, name: name.trim() });
      }
      await fetch();
    },
    [userId, fetch]
  );

  return { activities, upsertActivity };
}
