
-- 1. Profiles PII: drop overly permissive policy, add safe lookup function
DROP POLICY IF EXISTS "Authenticated can search profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.search_profiles(_q text)
RETURNS TABLE(user_id uuid, username text, display_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.user_id, p.username, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE _q IS NOT NULL AND length(_q) >= 2
    AND (p.username ILIKE '%' || _q || '%' OR p.display_name ILIKE '%' || _q || '%')
  LIMIT 25;
$$;

CREATE OR REPLACE FUNCTION public.get_profile_basic(_user_id uuid)
RETURNS TABLE(user_id uuid, username text, display_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.user_id, p.username, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = _user_id;
$$;

GRANT EXECUTE ON FUNCTION public.search_profiles(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_basic(uuid) TO authenticated;

-- Allow reading basic profile info of chat conversation co-members and accepted friends
CREATE POLICY "View co-member basic profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants cp1
    JOIN public.chat_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = auth.uid() AND cp2.user_id = profiles.user_id
  )
  OR public.are_friends(auth.uid(), profiles.user_id)
);

-- 2. OAuth bypass: require role assignment for employee writes
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

DROP POLICY IF EXISTS "Users can insert own entries" ON public.work_entries;
CREATE POLICY "Users can insert own entries" ON public.work_entries
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_any_role(auth.uid()));

DROP POLICY IF EXISTS "Users insert own sessions" ON public.shift_sessions;
CREATE POLICY "Users insert own sessions" ON public.shift_sessions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_any_role(auth.uid()));

DROP POLICY IF EXISTS "Employees insert own sos" ON public.sos_alerts;
CREATE POLICY "Employees insert own sos" ON public.sos_alerts
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_any_role(auth.uid()));

DROP POLICY IF EXISTS "Users insert own scans" ON public.patrol_scans;
CREATE POLICY "Users insert own scans" ON public.patrol_scans
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_any_role(auth.uid()));

-- 3. Friendship self-accept
DROP POLICY IF EXISTS "Respond to friendship" ON public.friendships;
CREATE POLICY "Respond to friendship" ON public.friendships
FOR UPDATE TO authenticated
USING (auth.uid() = addressee_id OR auth.uid() = requester_id)
WITH CHECK (
  (auth.uid() = addressee_id)
  OR (auth.uid() = requester_id AND status <> 'accepted')
);

-- 4. get_unread_chat_counts: add auth guard
CREATE OR REPLACE FUNCTION public.get_unread_chat_counts(_user uuid)
RETURNS TABLE(conversation_id uuid, unread bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cp.conversation_id, COUNT(m.id) AS unread
  FROM public.chat_participants cp
  LEFT JOIN public.chat_reads cr
    ON cr.conversation_id = cp.conversation_id AND cr.user_id = _user
  LEFT JOIN public.chat_messages m
    ON m.conversation_id = cp.conversation_id
   AND m.sender_id <> _user
   AND m.created_at > COALESCE(cr.last_read_at, 'epoch'::timestamptz)
  WHERE cp.user_id = _user
    AND _user = auth.uid()
  GROUP BY cp.conversation_id;
$$;
