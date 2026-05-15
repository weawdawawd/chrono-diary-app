CREATE TABLE public.global_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.global_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read global_locations" ON public.global_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert global_locations" ON public.global_locations FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "Admins update global_locations" ON public.global_locations FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins delete global_locations" ON public.global_locations FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE TABLE public.global_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.global_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read global_activities" ON public.global_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert global_activities" ON public.global_activities FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "Admins update global_activities" ON public.global_activities FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins delete global_activities" ON public.global_activities FOR DELETE TO authenticated USING (is_admin(auth.uid()));