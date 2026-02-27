import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSavedLocations(userId: string | undefined) {
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("saved_locations")
      .select("name")
      .eq("user_id", userId)
      .order("usage_count", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setLocations(data?.map((l) => l.name) || []);
      });
  }, [userId]);

  return locations;
}
