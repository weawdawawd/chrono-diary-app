import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSavedLocations(userId: string | undefined) {
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      supabase
        .from("saved_locations")
        .select("name")
        .eq("user_id", userId)
        .order("usage_count", { ascending: false })
        .limit(20),
      supabase.from("global_locations").select("name").order("name"),
    ]).then(([own, global]) => {
      const merged = new Set<string>();
      (global.data ?? []).forEach((l: any) => merged.add(l.name));
      (own.data ?? []).forEach((l: any) => merged.add(l.name));
      setLocations(Array.from(merged));
    });
  }, [userId]);

  return locations;
}
