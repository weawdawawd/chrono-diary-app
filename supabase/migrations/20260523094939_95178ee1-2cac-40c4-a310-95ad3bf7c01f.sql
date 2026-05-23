
CREATE TYPE public.shift_session_status AS ENUM ('active', 'finished');

CREATE TABLE public.shift_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE SET NULL,
  object_location text NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  start_lat double precision,
  start_lng double precision,
  end_time timestamptz,
  end_lat double precision,
  end_lng double precision,
  status public.shift_session_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Only one active session per user
CREATE UNIQUE INDEX one_active_session_per_user
  ON public.shift_sessions(user_id)
  WHERE status = 'active';

CREATE INDEX idx_shift_sessions_user ON public.shift_sessions(user_id);
CREATE INDEX idx_shift_sessions_status ON public.shift_sessions(status);

ALTER TABLE public.shift_sessions ENABLE ROW LEVEL SECURITY;

-- Employee: own sessions
CREATE POLICY "Users view own sessions"
  ON public.shift_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own sessions"
  ON public.shift_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sessions"
  ON public.shift_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Planners (admin + objektleiter): view all
CREATE POLICY "Planners view all sessions"
  ON public.shift_sessions FOR SELECT TO authenticated
  USING (public.is_planner(auth.uid()));

-- Admin: delete
CREATE POLICY "Admins delete sessions"
  ON public.shift_sessions FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Link guard log entries to sessions (optional)
ALTER TABLE public.guard_log_entries
  ADD COLUMN IF NOT EXISTS shift_session_id uuid REFERENCES public.shift_sessions(id) ON DELETE SET NULL;
