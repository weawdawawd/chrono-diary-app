
CREATE TABLE public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'android',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_tokens TO authenticated;
GRANT ALL ON public.device_tokens TO service_role;

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own device tokens select"
ON public.device_tokens FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users manage own device tokens insert"
ON public.device_tokens FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own device tokens update"
ON public.device_tokens FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users manage own device tokens delete"
ON public.device_tokens FOR DELETE TO authenticated
USING (auth.uid() = user_id);
