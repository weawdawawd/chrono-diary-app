
CREATE TABLE public.guard_log_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name text NOT NULL,
  shift_id uuid,
  author_user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_guard_log_location ON public.guard_log_entries (location_name, created_at DESC);
CREATE INDEX idx_guard_log_author ON public.guard_log_entries (author_user_id);

ALTER TABLE public.guard_log_entries ENABLE ROW LEVEL SECURITY;

-- Planners (admin + objektleiter) full access
CREATE POLICY "Planners select guard_log"
  ON public.guard_log_entries FOR SELECT
  TO authenticated
  USING (public.is_planner(auth.uid()));

CREATE POLICY "Planners insert guard_log"
  ON public.guard_log_entries FOR INSERT
  TO authenticated
  WITH CHECK (public.is_planner(auth.uid()) AND auth.uid() = author_user_id);

CREATE POLICY "Planners update guard_log"
  ON public.guard_log_entries FOR UPDATE
  TO authenticated
  USING (public.is_planner(auth.uid()));

CREATE POLICY "Planners delete guard_log"
  ON public.guard_log_entries FOR DELETE
  TO authenticated
  USING (public.is_planner(auth.uid()));

-- Employees: only when they have an accepted shift at that location
CREATE POLICY "Employees select guard_log of accepted shifts"
  ON public.guard_log_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.employee_user_id = auth.uid()
        AND s.assignment_status = 'accepted'
        AND s.location = guard_log_entries.location_name
    )
  );

CREATE POLICY "Employees insert guard_log when accepted"
  ON public.guard_log_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_user_id
    AND EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.employee_user_id = auth.uid()
        AND s.assignment_status = 'accepted'
        AND s.location = guard_log_entries.location_name
    )
  );

CREATE POLICY "Authors update own guard_log"
  ON public.guard_log_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_user_id);

CREATE POLICY "Authors delete own guard_log"
  ON public.guard_log_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = author_user_id);
