
-- 1) route points
CREATE TABLE public.patrol_route_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.patrol_routes(id) ON DELETE CASCADE,
  point_id uuid NOT NULL REFERENCES public.patrol_points(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (route_id, point_id)
);
GRANT SELECT ON public.patrol_route_points TO authenticated;
GRANT ALL ON public.patrol_route_points TO service_role;
ALTER TABLE public.patrol_route_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read route points" ON public.patrol_route_points FOR SELECT TO authenticated USING (true);
CREATE POLICY "Planners insert route points" ON public.patrol_route_points FOR INSERT TO authenticated WITH CHECK (public.is_planner(auth.uid()));
CREATE POLICY "Planners update route points" ON public.patrol_route_points FOR UPDATE TO authenticated USING (public.is_planner(auth.uid()));
CREATE POLICY "Planners delete route points" ON public.patrol_route_points FOR DELETE TO authenticated USING (public.is_planner(auth.uid()));

-- 2) sessions
CREATE TABLE public.patrol_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  route_id uuid REFERENCES public.patrol_routes(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  start_lat double precision,
  start_lng double precision,
  end_lat double precision,
  end_lng double precision,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.patrol_sessions TO authenticated;
GRANT ALL ON public.patrol_sessions TO service_role;
ALTER TABLE public.patrol_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own sessions" ON public.patrol_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Planners view all sessions" ON public.patrol_sessions FOR SELECT TO authenticated USING (public.is_planner(auth.uid()));
CREATE POLICY "Users insert own sessions" ON public.patrol_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON public.patrol_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins delete sessions" ON public.patrol_sessions FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- 3) scan extension
ALTER TABLE public.patrol_scans
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.patrol_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS route_id uuid REFERENCES public.patrol_routes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS distance_m double precision,
  ADD COLUMN IF NOT EXISTS valid boolean NOT NULL DEFAULT true;

-- 4) qr secret
ALTER TABLE public.patrol_points
  ADD COLUMN IF NOT EXISTS qr_secret text NOT NULL DEFAULT encode(extensions.gen_random_bytes(12), 'hex');

-- 5) RPC start session
CREATE OR REPLACE FUNCTION public.start_patrol_session(_route_id uuid, _lat double precision, _lng double precision)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  INSERT INTO public.patrol_sessions (user_id, route_id, start_lat, start_lng)
  VALUES (auth.uid(), _route_id, _lat, _lng)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- 6) RPC end session
CREATE OR REPLACE FUNCTION public.end_patrol_session(_session_id uuid, _lat double precision, _lng double precision)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid;
  _route uuid;
  _required int;
  _scanned int;
  _status text;
BEGIN
  SELECT user_id, route_id INTO _user, _route FROM public.patrol_sessions WHERE id = _session_id;
  IF _user IS NULL OR _user <> auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _route IS NOT NULL THEN
    SELECT COUNT(*) INTO _required FROM public.patrol_route_points WHERE route_id = _route;
    SELECT COUNT(DISTINCT point_id) INTO _scanned
      FROM public.patrol_scans
      WHERE session_id = _session_id AND valid = true
        AND point_id IN (SELECT point_id FROM public.patrol_route_points WHERE route_id = _route);
    IF _required > 0 AND _scanned >= _required THEN _status := 'completed'; ELSE _status := 'incomplete'; END IF;
  ELSE
    _status := 'completed';
  END IF;

  UPDATE public.patrol_sessions
    SET ended_at = now(), end_lat = _lat, end_lng = _lng, status = _status
    WHERE id = _session_id;
  RETURN _status;
END;
$$;

-- 7) RPC verify QR (signed payload: "LDN1.<point_id>.<sig>")
CREATE OR REPLACE FUNCTION public.verify_patrol_qr(_payload text)
RETURNS TABLE(point_id uuid, code text, name text, location text, lat double precision, lng double precision)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _parts text[];
  _pid uuid;
  _sig text;
  _expected text;
  _secret text;
BEGIN
  _parts := string_to_array(_payload, '.');
  IF array_length(_parts, 1) <> 3 OR _parts[1] <> 'LDN1' THEN
    RAISE EXCEPTION 'invalid qr';
  END IF;
  BEGIN
    _pid := _parts[2]::uuid;
  EXCEPTION WHEN others THEN RAISE EXCEPTION 'invalid qr'; END;
  _sig := _parts[3];

  SELECT qr_secret INTO _secret FROM public.patrol_points WHERE id = _pid AND active = true;
  IF _secret IS NULL THEN RAISE EXCEPTION 'unknown point'; END IF;

  _expected := substr(encode(extensions.hmac(_pid::text, _secret, 'sha256'), 'hex'), 1, 16);
  IF _expected <> _sig THEN RAISE EXCEPTION 'bad signature'; END IF;

  RETURN QUERY
    SELECT p.id, p.code, p.name, p.location, p.lat, p.lng
    FROM public.patrol_points p WHERE p.id = _pid;
END;
$$;

-- 8) RPC sign QR (so client can render printable QR)
CREATE OR REPLACE FUNCTION public.sign_patrol_qr(_point_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _secret text;
  _sig text;
BEGIN
  IF NOT public.is_planner(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT qr_secret INTO _secret FROM public.patrol_points WHERE id = _point_id;
  IF _secret IS NULL THEN RAISE EXCEPTION 'unknown'; END IF;
  _sig := substr(encode(extensions.hmac(_point_id::text, _secret, 'sha256'), 'hex'), 1, 16);
  RETURN 'LDN1.' || _point_id::text || '.' || _sig;
END;
$$;
