-- Allow conversation creator to add participants (fixes multi-row INSERT visibility)
DROP POLICY IF EXISTS "Add participants to own conversations" ON public.chat_participants;
CREATE POLICY "Add participants to own conversations"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.is_conversation_member(conversation_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = conversation_id AND c.created_by = auth.uid()
  )
);

-- Allow conversation creator (and members) to view participants of own conversation
DROP POLICY IF EXISTS "View participants of own conversations" ON public.chat_participants;
CREATE POLICY "View participants of own conversations"
ON public.chat_participants
FOR SELECT
TO authenticated
USING (
  public.is_conversation_member(conversation_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = conversation_id AND c.created_by = auth.uid()
  )
);

-- Re-assert friendship UPDATE policy so the addressee can accept
DROP POLICY IF EXISTS "Respond to friendship" ON public.friendships;
CREATE POLICY "Respond to friendship"
ON public.friendships
FOR UPDATE
TO authenticated
USING (auth.uid() = addressee_id OR auth.uid() = requester_id)
WITH CHECK (
  auth.uid() = addressee_id
  OR (auth.uid() = requester_id AND status <> 'accepted')
);