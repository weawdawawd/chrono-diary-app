
-- 1. global_locations erweitern
ALTER TABLE public.global_locations
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS geofence_radius_m integer NOT NULL DEFAULT 200;

-- 2. shifts erweitern
ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS geofence_radius_m integer,
  ADD COLUMN IF NOT EXISTS start_location_lat double precision,
  ADD COLUMN IF NOT EXISTS start_location_lng double precision,
  ADD COLUMN IF NOT EXISTS start_location_at timestamptz,
  ADD COLUMN IF NOT EXISTS end_location_lat double precision,
  ADD COLUMN IF NOT EXISTS end_location_lng double precision,
  ADD COLUMN IF NOT EXISTS end_location_at timestamptz;

-- 3. sos_alerts Tabelle
CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  shift_id uuid,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  message text,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sos_alerts_open ON public.sos_alerts (created_at DESC) WHERE resolved_at IS NULL;

ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees insert own sos"
  ON public.sos_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employees view own sos"
  ON public.sos_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all sos"
  ON public.sos_alerts FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins update sos"
  ON public.sos_alerts FOR UPDATE
  USING (is_admin(auth.uid()));

-- 4. RPC für Umkreissuche (Haversine)
CREATE OR REPLACE FUNCTION public.get_nearby_active_sos(_lat double precision, _lng double precision)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  lat double precision,
  lng double precision,
  message text,
  distance_m double precision,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.user_id,
    COALESCE(p.display_name, p.email, 'Kollege') as display_name,
    s.lat,
    s.lng,
    s.message,
    (6371000 * 2 * asin(sqrt(
      power(sin(radians((s.lat - _lat)/2)), 2) +
      cos(radians(_lat)) * cos(radians(s.lat)) *
      power(sin(radians((s.lng - _lng)/2)), 2)
    ))) as distance_m,
    s.created_at
  FROM public.sos_alerts s
  LEFT JOIN public.profiles p ON p.user_id = s.user_id
  WHERE s.resolved_at IS NULL
    AND s.created_at > now() - interval '2 hours'
    AND (6371000 * 2 * asin(sqrt(
      power(sin(radians((s.lat - _lat)/2)), 2) +
      cos(radians(_lat)) * cos(radians(s.lat)) *
      power(sin(radians((s.lng - _lng)/2)), 2)
    ))) <= 1000
  ORDER BY distance_m ASC;
$$;

-- 5. Realtime für sos_alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;
ALTER TABLE public.sos_alerts REPLICA IDENTITY FULL;
