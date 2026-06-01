
-- 1) Hide qr_secret from non-service roles
REVOKE SELECT (qr_secret) ON public.patrol_points FROM authenticated;
REVOKE SELECT (qr_secret) ON public.patrol_points FROM anon;

-- 2) Prevent employees from overwriting protected shift fields
CREATE OR REPLACE FUNCTION public.restrict_employee_shift_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.is_planner(auth.uid()) OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.employee_user_id IS DISTINCT FROM OLD.employee_user_id
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.date IS DISTINCT FROM OLD.date
     OR NEW.start_time IS DISTINCT FROM OLD.start_time
     OR NEW.end_time IS DISTINCT FROM OLD.end_time
     OR NEW.location IS DISTINCT FROM OLD.location
     OR NEW.address IS DISTINCT FROM OLD.address
     OR NEW.note IS DISTINCT FROM OLD.note
     OR NEW.service_type IS DISTINCT FROM OLD.service_type
     OR NEW.requires_location IS DISTINCT FROM OLD.requires_location
     OR NEW.geofence_radius_m IS DISTINCT FROM OLD.geofence_radius_m
     OR NEW.lat IS DISTINCT FROM OLD.lat
     OR NEW.lng IS DISTINCT FROM OLD.lng
  THEN
    RAISE EXCEPTION 'Employees may only update consent and response fields on their shifts';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS restrict_employee_shift_updates_trg ON public.shifts;
CREATE TRIGGER restrict_employee_shift_updates_trg
BEFORE UPDATE ON public.shifts
FOR EACH ROW EXECUTE FUNCTION public.restrict_employee_shift_updates();

-- 3) Server-side patrol scan recording
CREATE OR REPLACE FUNCTION public.record_patrol_scan(
  _payload text,
  _nfc_id text,
  _lat double precision,
  _lng double precision,
  _session_id uuid,
  _route_id uuid,
  _scanned_at timestamptz DEFAULT now()
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _pid uuid;
  _plat double precision;
  _plng double precision;
  _secret text;
  _parts text[];
  _expected text;
  _dist double precision;
  _valid boolean := true;
  _method text;
  _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT public.has_any_role(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;

  IF _payload IS NOT NULL AND length(_payload) > 0 THEN
    _method := 'qr';
    _parts := string_to_array(_payload, '.');
    IF array_length(_parts, 1) <> 3 OR _parts[1] <> 'LDN1' THEN
      RAISE EXCEPTION 'invalid qr';
    END IF;
    BEGIN _pid := _parts[2]::uuid; EXCEPTION WHEN others THEN RAISE EXCEPTION 'invalid qr'; END;
    SELECT qr_secret, lat, lng INTO _secret, _plat, _plng
      FROM public.patrol_points WHERE id = _pid AND active = true;
    IF _secret IS NULL THEN RAISE EXCEPTION 'unknown point'; END IF;
    _expected := substr(encode(extensions.hmac(_pid::text, _secret, 'sha256'), 'hex'), 1, 16);
    IF _expected <> _parts[3] THEN RAISE EXCEPTION 'bad signature'; END IF;
  ELSIF _nfc_id IS NOT NULL AND length(_nfc_id) > 0 THEN
    _method := 'nfc';
    SELECT id, lat, lng INTO _pid, _plat, _plng
      FROM public.patrol_points WHERE nfc_id = _nfc_id AND active = true;
    IF _pid IS NULL THEN RAISE EXCEPTION 'unknown nfc'; END IF;
  ELSE
    RAISE EXCEPTION 'no scan payload';
  END IF;

  IF _lat IS NOT NULL AND _lng IS NOT NULL AND _plat IS NOT NULL AND _plng IS NOT NULL THEN
    _dist := 6371000 * 2 * asin(sqrt(
      power(sin(radians((_plat - _lat)/2)), 2) +
      cos(radians(_lat)) * cos(radians(_plat)) *
      power(sin(radians((_plng - _lng)/2)), 2)
    ));
    IF _dist > 50 THEN _valid := false; END IF;
  END IF;

  INSERT INTO public.patrol_scans
    (user_id, point_id, scan_method, session_id, route_id, lat, lng, distance_m, valid, scanned_at)
  VALUES
    (auth.uid(), _pid, _method, _session_id, _route_id, _lat, _lng, _dist, _valid, COALESCE(_scanned_at, now()))
  RETURNING id INTO _id;
  RETURN _id;
END $$;

REVOKE INSERT ON public.patrol_scans FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_patrol_scan(text, text, double precision, double precision, uuid, uuid, timestamptz) TO authenticated;

-- 4) Stop exposing email/phone via co-member profile policy; use safe RPC instead.
DROP POLICY IF EXISTS "View co-member basic profile" ON public.profiles;

CREATE OR REPLACE FUNCTION public.get_profiles_basic_bulk(_user_ids uuid[])
RETURNS TABLE(user_id uuid, username text, display_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.username, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
    AND (
      p.user_id = auth.uid()
      OR public.is_planner(auth.uid())
      OR public.is_admin(auth.uid())
      OR public.are_friends(auth.uid(), p.user_id)
      OR EXISTS (
        SELECT 1 FROM public.chat_participants cp1
        JOIN public.chat_participants cp2 ON cp1.conversation_id = cp2.conversation_id
        WHERE cp1.user_id = auth.uid() AND cp2.user_id = p.user_id
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_profiles_basic_bulk(uuid[]) TO authenticated;
