
-- Guard log: new fields
ALTER TABLE public.guard_log_entries
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS incident_type text,
  ADD COLUMN IF NOT EXISTS incident_at timestamptz;

-- Replace SELECT policy: employees only see their own entries
DROP POLICY IF EXISTS "Employees select guard_log of accepted shifts" ON public.guard_log_entries;
CREATE POLICY "Employees select own guard_log"
ON public.guard_log_entries FOR SELECT TO authenticated
USING (auth.uid() = author_user_id);

-- Replace INSERT policy: allow when accepted shift OR active stempel session
DROP POLICY IF EXISTS "Employees insert guard_log when accepted" ON public.guard_log_entries;
CREATE POLICY "Employees insert own guard_log"
ON public.guard_log_entries FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = author_user_id AND (
    EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.employee_user_id = auth.uid()
        AND s.assignment_status = 'accepted'
        AND s.location = guard_log_entries.location_name
    )
    OR EXISTS (
      SELECT 1 FROM public.shift_sessions ss
      WHERE ss.user_id = auth.uid()
        AND ss.status = 'active'
        AND ss.object_location = guard_log_entries.location_name
    )
  )
);

-- Storage bucket for guard log photos (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('guard-log-photos', 'guard-log-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Guard photos: owner upload" ON storage.objects;
CREATE POLICY "Guard photos: owner upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'guard-log-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Guard photos: owner or planner read" ON storage.objects;
CREATE POLICY "Guard photos: owner or planner read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'guard-log-photos'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_planner(auth.uid()))
);

DROP POLICY IF EXISTS "Guard photos: owner delete" ON storage.objects;
CREATE POLICY "Guard photos: owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'guard-log-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow GPS pings tied to an active stempel session
ALTER TABLE public.shift_locations
  ADD COLUMN IF NOT EXISTS shift_session_id uuid;

ALTER TABLE public.shift_locations
  ALTER COLUMN shift_id DROP NOT NULL;

DROP POLICY IF EXISTS "Employees insert own active shift location" ON public.shift_locations;
CREATE POLICY "Employees insert own active shift location"
ON public.shift_locations FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    (shift_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = shift_locations.shift_id
        AND s.employee_user_id = auth.uid()
        AND s.date = ((now() AT TIME ZONE 'Europe/Berlin'))::date
        AND s.start_time <= ((now() AT TIME ZONE 'Europe/Berlin'))::time
        AND s.end_time >= ((now() AT TIME ZONE 'Europe/Berlin'))::time
    ))
    OR (shift_session_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.shift_sessions ss
      WHERE ss.id = shift_locations.shift_session_id
        AND ss.user_id = auth.uid()
        AND ss.status = 'active'
    ))
  )
);
