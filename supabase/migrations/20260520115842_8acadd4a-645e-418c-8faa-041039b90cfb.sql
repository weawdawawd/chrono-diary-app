
-- work_entries
DROP POLICY IF EXISTS "Users can view own entries" ON public.work_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON public.work_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.work_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON public.work_entries;
DROP POLICY IF EXISTS "Admins view all entries" ON public.work_entries;
DROP POLICY IF EXISTS "Admins update all entries" ON public.work_entries;
DROP POLICY IF EXISTS "Admins delete all entries" ON public.work_entries;

CREATE POLICY "Users can view own entries" ON public.work_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries" ON public.work_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON public.work_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON public.work_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all entries" ON public.work_entries FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins update all entries" ON public.work_entries FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins delete all entries" ON public.work_entries FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- saved_locations
DROP POLICY IF EXISTS "Users can view own locations" ON public.saved_locations;
DROP POLICY IF EXISTS "Users can insert own locations" ON public.saved_locations;
DROP POLICY IF EXISTS "Users can update own locations" ON public.saved_locations;
DROP POLICY IF EXISTS "Users can delete own locations" ON public.saved_locations;
DROP POLICY IF EXISTS "Admins view all locations" ON public.saved_locations;

CREATE POLICY "Users can view own locations" ON public.saved_locations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own locations" ON public.saved_locations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own locations" ON public.saved_locations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own locations" ON public.saved_locations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all locations" ON public.saved_locations FOR SELECT TO authenticated USING (is_admin(auth.uid()));
