CREATE OR REPLACE FUNCTION public.record_patrol_scan(
  _payload text,
  _nfc_id text,
  _lat double precision,
  _lng double precision,
  _session_id uuid,
  _route_id uuid,
  _scanned_at timestamp with time zone DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
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
  _payload_trim text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT public.has_any_role(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;

  _payload_trim := btrim(coalesce(_payload, ''));

  IF length(_payload_trim) > 0 THEN
    _method := 'qr';
    IF _payload_trim LIKE 'LDN1.%' THEN
      _parts := string_to_array(_payload_trim, '.');
      IF array_length(_parts, 1) <> 3 THEN RAISE EXCEPTION 'invalid qr'; END IF;
      BEGIN _pid := _parts[2]::uuid; EXCEPTION WHEN others THEN RAISE EXCEPTION 'invalid qr'; END;
      SELECT qr_secret, lat, lng INTO _secret, _plat, _plng
        FROM public.patrol_points WHERE id = _pid AND active = true;
      IF _secret IS NULL THEN RAISE EXCEPTION 'unknown point'; END IF;
      _expected := substr(encode(extensions.hmac(_pid::text, _secret, 'sha256'), 'hex'), 1, 16);
      IF _expected <> _parts[3] THEN RAISE EXCEPTION 'bad signature'; END IF;
    ELSE
      -- Backwards-compat: plain code printed on older QR labels
      SELECT id, lat, lng INTO _pid, _plat, _plng
        FROM public.patrol_points WHERE code = _payload_trim AND active = true;
      IF _pid IS NULL THEN
        BEGIN
          _pid := _payload_trim::uuid;
        EXCEPTION WHEN others THEN
          RAISE EXCEPTION 'invalid qr';
        END;
        SELECT lat, lng INTO _plat, _plng FROM public.patrol_points WHERE id = _pid AND active = true;
        IF NOT FOUND THEN RAISE EXCEPTION 'unknown point'; END IF;
      END IF;
    END IF;
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
END $function$;