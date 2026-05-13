
-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- 2. user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- 4. RLS on user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.is_admin(auth.uid()));

-- 5. invitations table
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  role public.app_role NOT NULL DEFAULT 'employee',
  email TEXT,
  note TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invitations select" ON public.invitations
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage invitations insert" ON public.invitations
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "Admins manage invitations update" ON public.invitations
  FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage invitations delete" ON public.invitations
  FOR DELETE USING (public.is_admin(auth.uid()));

-- 6. profiles table for admin display of users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger: auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Backfill existing user as admin + profile
INSERT INTO public.profiles (user_id, email)
SELECT id, email FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('6b0b4aae-9abd-4a35-8630-95c8ed12d326', 'admin')
ON CONFLICT DO NOTHING;

-- 8. Add admin SELECT policies on existing tables
CREATE POLICY "Admins view all entries" ON public.work_entries
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins update all entries" ON public.work_entries
  FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete all entries" ON public.work_entries
  FOR DELETE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins view all locations" ON public.saved_locations
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins view all activities" ON public.saved_activities
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins view all projects" ON public.projects
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins view all settings" ON public.user_settings
  FOR SELECT USING (public.is_admin(auth.uid()));
