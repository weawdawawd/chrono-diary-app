import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useUnreadChats() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    if (!user) { setCounts({}); return; }
    const { data, error } = await supabase.rpc("get_unread_chat_counts", { _user: user.id });
    if (error) { console.error("[unread]", error); return; }
    const map: Record<string, number> = {};
    (data ?? []).forEach((r: any) => { map[r.conversation_id] = Number(r.unread) || 0; });
    setCounts(map);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("unread-chats-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reads", filter: `user_id=eq.${user.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_participants", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, load]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, total, refresh: load };
}
