import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "employee";

export function useUserRole(userId: string | undefined) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setLoading(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => {
        const roles = (data ?? []).map((r) => r.role as AppRole);
        setRole(roles.includes("admin") ? "admin" : "employee");
        setLoading(false);
      });
  }, [userId]);

  return { role, isAdmin: role === "admin", loading };
}
