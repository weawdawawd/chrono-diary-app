-- 1. Neue Rolle "objektleiter" hinzufügen
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'objektleiter';

-- 2. Helper: is_planner = admin oder objektleiter
-- (verwendet role::text um Probleme mit dem frisch hinzugefügten Enum-Wert in derselben Migration zu vermeiden)
CREATE OR REPLACE FUNCTION public.is_planner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(_user_id) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = 'objektleiter'
  )
$$;

-- 3. Shifts: Objektleiter dürfen Schichten verwalten (zusätzlich zu Admin)
DROP POLICY IF EXISTS "Planners manage shifts select" ON public.shifts;
CREATE POLICY "Planners manage shifts select"
ON public.shifts FOR SELECT
TO authenticated
USING (public.is_planner(auth.uid()));

DROP POLICY IF EXISTS "Planners manage shifts insert" ON public.shifts;
CREATE POLICY "Planners manage shifts insert"
ON public.shifts FOR INSERT
TO authenticated
WITH CHECK (public.is_planner(auth.uid()) AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Planners manage shifts update" ON public.shifts;
CREATE POLICY "Planners manage shifts update"
ON public.shifts FOR UPDATE
TO authenticated
USING (public.is_planner(auth.uid()));

DROP POLICY IF EXISTS "Planners manage shifts delete" ON public.shifts;
CREATE POLICY "Planners manage shifts delete"
ON public.shifts FOR DELETE
TO authenticated
USING (public.is_planner(auth.uid()));

-- 4. Objektleiter brauchen Mitarbeiter-Liste (profiles) zum Zuweisen
DROP POLICY IF EXISTS "Planners view all profiles" ON public.profiles;
CREATE POLICY "Planners view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_planner(auth.uid()));

-- 5. Objektleiter brauchen Rollenliste, um Mitarbeiter zu identifizieren
DROP POLICY IF EXISTS "Planners view all roles" ON public.user_roles;
CREATE POLICY "Planners view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_planner(auth.uid()));

-- 6. Globale Objekte/Aktivitäten lesen (bereits authenticated, OK)

-- 7. SOS: alle authentifizierten Mitarbeiter müssen aktive Alerts SELECTen können,
--    damit Realtime-Events und die Distanz-RPC funktionieren.
--    Die Distanzfilterung passiert in der RPC; das Banner zeigt nur Alarme im 1 km Radius.
DROP POLICY IF EXISTS "Authenticated view active sos" ON public.sos_alerts;
CREATE POLICY "Authenticated view active sos"
ON public.sos_alerts FOR SELECT
TO authenticated
USING (resolved_at IS NULL);

-- 8. Realtime für sos_alerts aktivieren (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'sos_alerts'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts';
  END IF;
END $$;

ALTER TABLE public.sos_alerts REPLICA IDENTITY FULL;