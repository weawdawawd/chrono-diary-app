CREATE OR REPLACE FUNCTION public.get_nearby_active_sos(_lat double precision, _lng double precision)
 RETURNS TABLE(id uuid, user_id uuid, display_name text, lat double precision, lng double precision, message text, distance_m double precision, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.has_any_role(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.user_id,
    COALESCE(p.display_name, 'Kollege') as display_name,
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
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_nearby_active_sos(double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_nearby_active_sos(double precision, double precision) TO authenticated;
