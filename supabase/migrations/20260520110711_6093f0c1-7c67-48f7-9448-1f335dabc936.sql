
DO $$ BEGIN
  CREATE TYPE public.service_type AS ENUM ('security', 'cleaning');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.assignment_status AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS service_type public.service_type NOT NULL DEFAULT 'security',
  ADD COLUMN IF NOT EXISTS assignment_status public.assignment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS responded_at timestamptz;
