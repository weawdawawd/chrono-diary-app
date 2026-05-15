ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS requires_location boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS location_consent_declined boolean NOT NULL DEFAULT false;

-- Allow employees to update consent fields on their own shifts
CREATE POLICY "Employees update own shift consent"
ON public.shifts
FOR UPDATE
USING (auth.uid() = employee_user_id)
WITH CHECK (auth.uid() = employee_user_id);
