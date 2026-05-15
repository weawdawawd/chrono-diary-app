
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_user_id UUID NOT NULL,
  created_by UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage shifts select" ON public.shifts FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage shifts insert" ON public.shifts FOR INSERT WITH CHECK (public.is_admin(auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "Admins manage shifts update" ON public.shifts FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage shifts delete" ON public.shifts FOR DELETE USING (public.is_admin(auth.uid()));
CREATE POLICY "Employees view own shifts" ON public.shifts FOR SELECT USING (auth.uid() = employee_user_id);

CREATE INDEX idx_shifts_employee_date ON public.shifts(employee_user_id, date);

CREATE TABLE public.shift_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shift_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all locations" ON public.shift_locations FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Employees view own locations" ON public.shift_locations FOR SELECT USING (auth.uid() = user_id);

-- Employees can insert location only for their own currently-active shift
CREATE POLICY "Employees insert own active shift location" ON public.shift_locations FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.shifts s
    WHERE s.id = shift_id
      AND s.employee_user_id = auth.uid()
      AND s.date = (now() AT TIME ZONE 'Europe/Berlin')::date
      AND s.start_time <= (now() AT TIME ZONE 'Europe/Berlin')::time
      AND s.end_time   >= (now() AT TIME ZONE 'Europe/Berlin')::time
  )
);

CREATE INDEX idx_shift_locations_shift ON public.shift_locations(shift_id, recorded_at DESC);
