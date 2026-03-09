import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserSettings {
  id: string;
  user_id: string;
  weekly_target_hours: number;
}

export function useUserSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setSettings(data as UserSettings | null);
  }, [userId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const upsertSettings = async (weeklyTargetHours: number) => {
    if (!userId) return;
    if (settings) {
      await supabase
        .from("user_settings")
        .update({ weekly_target_hours: weeklyTargetHours })
        .eq("id", settings.id);
    } else {
      await supabase.from("user_settings").insert({
        user_id: userId,
        weekly_target_hours: weeklyTargetHours,
      });
    }
    await fetchSettings();
  };

  return { settings, upsertSettings };
}
