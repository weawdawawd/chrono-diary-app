
-- Patrouillen-Punkte (QR/NFC)
CREATE TABLE public.patrol_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  location text NOT NULL,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  nfc_id text UNIQUE,
  order_index integer NOT NULL DEFAULT 0,
  lat double precision,
  lng double precision,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patrol_points TO authenticated;
GRANT ALL ON public.patrol_points TO service_role;

ALTER TABLE public.patrol_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read patrol_points" ON public.patrol_points
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Planners insert patrol_points" ON public.patrol_points
  FOR INSERT TO authenticated WITH CHECK (is_planner(auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "Planners update patrol_points" ON public.patrol_points
  FOR UPDATE TO authenticated USING (is_planner(auth.uid()));
CREATE POLICY "Planners delete patrol_points" ON public.patrol_points
  FOR DELETE TO authenticated USING (is_planner(auth.uid()));

-- Patrouillen-Routen (Anzahl Runden pro Objekt)
CREATE TABLE public.patrol_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  location text NOT NULL,
  name text NOT NULL,
  required_rounds integer NOT NULL DEFAULT 1,
  required_points integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patrol_routes TO authenticated;
GRANT ALL ON public.patrol_routes TO service_role;

ALTER TABLE public.patrol_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read patrol_routes" ON public.patrol_routes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Planners insert patrol_routes" ON public.patrol_routes
  FOR INSERT TO authenticated WITH CHECK (is_planner(auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "Planners update patrol_routes" ON public.patrol_routes
  FOR UPDATE TO authenticated USING (is_planner(auth.uid()));
CREATE POLICY "Planners delete patrol_routes" ON public.patrol_routes
  FOR DELETE TO authenticated USING (is_planner(auth.uid()));

-- Patrouillen-Scans
CREATE TABLE public.patrol_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  point_id uuid NOT NULL REFERENCES public.patrol_points(id) ON DELETE CASCADE,
  shift_session_id uuid,
  scan_method text NOT NULL DEFAULT 'qr',
  lat double precision,
  lng double precision,
  scanned_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patrol_scans_user ON public.patrol_scans(user_id, scanned_at DESC);
CREATE INDEX idx_patrol_scans_point ON public.patrol_scans(point_id, scanned_at DESC);

GRANT SELECT, INSERT, DELETE ON public.patrol_scans TO authenticated;
GRANT ALL ON public.patrol_scans TO service_role;

ALTER TABLE public.patrol_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own scans" ON public.patrol_scans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own scans" ON public.patrol_scans
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Planners view all scans" ON public.patrol_scans
  FOR SELECT TO authenticated USING (is_planner(auth.uid()));
CREATE POLICY "Admins delete scans" ON public.patrol_scans
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));
