DROP POLICY IF EXISTS "Members view conversation" ON public.chat_conversations;
CREATE POLICY "Members view conversation"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (public.is_conversation_member(id, auth.uid()) OR auth.uid() = created_by);