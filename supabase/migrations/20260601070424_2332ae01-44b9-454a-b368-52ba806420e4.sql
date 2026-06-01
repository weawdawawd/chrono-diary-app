ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;

DROP POLICY IF EXISTS "Sender updates message" ON public.chat_messages;
CREATE POLICY "Sender updates message" ON public.chat_messages
FOR UPDATE TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);