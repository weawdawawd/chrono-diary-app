
CREATE TABLE public.saved_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  usage_count integer NOT NULL DEFAULT 1,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.saved_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities" ON public.saved_activities FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.saved_activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON public.saved_activities FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON public.saved_activities FOR DELETE TO authenticated USING (auth.uid() = user_id);
