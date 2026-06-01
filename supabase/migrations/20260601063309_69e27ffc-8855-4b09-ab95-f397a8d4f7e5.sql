
-- Track per-user read state for conversations
CREATE TABLE public.chat_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_reads TO authenticated;
GRANT ALL ON public.chat_reads TO service_role;

ALTER TABLE public.chat_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reads" ON public.chat_reads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reads" ON public.chat_reads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Users update own reads" ON public.chat_reads
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own reads" ON public.chat_reads
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_chat_reads_user ON public.chat_reads(user_id);

-- RPC: per-conversation unread counts for current user
CREATE OR REPLACE FUNCTION public.get_unread_chat_counts(_user uuid)
RETURNS TABLE(conversation_id uuid, unread bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cp.conversation_id, COUNT(m.id) AS unread
  FROM public.chat_participants cp
  LEFT JOIN public.chat_reads cr
    ON cr.conversation_id = cp.conversation_id AND cr.user_id = _user
  LEFT JOIN public.chat_messages m
    ON m.conversation_id = cp.conversation_id
   AND m.sender_id <> _user
   AND m.created_at > COALESCE(cr.last_read_at, 'epoch'::timestamptz)
  WHERE cp.user_id = _user
  GROUP BY cp.conversation_id;
$$;

-- Realtime for new table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reads;
