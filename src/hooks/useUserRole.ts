import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "employee";

type RoleError = {
  message: string;
  code?: string;
  details?: string;
};

type RoleState = {
  role: AppRole | null;
  loading: boolean;
  error: RoleError | null;
  loadedUserId: string | null;
};

export function useUserRole(userId: string | undefined) {
  const [state, setState] = useState<RoleState>({
    role: null,
    loading: false,
    error: null,
    loadedUserId: null,
  });
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setState({ role: null, loading: false, error: null, loadedUserId: null });
      return;
    }

    console.info("[admin-auth] Rollenabfrage gestartet", { userId, retryNonce });
    setState({ role: null, loading: true, error: null, loadedUserId: null });

    (async () => {
      try {
        const { data, error, status, statusText } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        if (cancelled) return;

        if (error) {
          console.error("[admin-auth] Rollenabfrage fehlgeschlagen", { userId, status, statusText, error });
          setState({
            role: null,
            loading: false,
            error: {
              message: error.message || "Rollen konnten nicht geladen werden.",
              code: error.code,
              details: error.details || statusText || `Status ${status}`,
            },
            loadedUserId: userId,
          });
          return;
        }

        const roles = (data ?? []).map((r) => r.role as AppRole);
        const resolvedRole: AppRole = roles.includes("admin") ? "admin" : "employee";
        console.info("[admin-auth] Rollenabfrage erfolgreich", { userId, roles, resolvedRole });
        setState({ role: resolvedRole, loading: false, error: null, loadedUserId: userId });
      } catch (err: any) {
        if (cancelled) return;
        console.error("[admin-auth] Rollenabfrage Ausnahme", { userId, err });
        setState({
          role: null,
          loading: false,
          error: {
            message: err?.message || "Load failed: Rollenabfrage konnte nicht ausgeführt werden.",
            code: err?.code,
            details: err?.details || err?.name,
          },
          loadedUserId: userId,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, retryNonce]);

  const loading = state.loading || (!!userId && state.loadedUserId !== userId && !state.error);
  const retry = () => setRetryNonce((value) => value + 1);

  return { role: state.role, isAdmin: state.role === "admin", loading, error: state.error, retry };
}
