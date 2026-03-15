import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSavedActivities(userId: string | undefined) {
  const [activities, setActivities] = useState<string[]>([]);

  const fetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("saved_activities")
      .select("name")
      .eq("user_id", userId)
      .order("usage_count", { ascending: false })
      .limit(50);
    setActivities(data?.map((d) => d.name) || []);
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
