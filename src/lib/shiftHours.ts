export type CountableShift = {
  requires_location?: boolean | null;
  location_consent_at?: string | null;
  location_consent_declined?: boolean | null;
};

/**
 * Returns true if the shift's hours should count towards stats / payroll.
 * Shifts with required location consent that the employee never accepted
 * (or actively declined) are excluded.
 */
export function isShiftCounted(s: CountableShift): boolean {
  if (!s.requires_location) return true;
  if (s.location_consent_declined) return false;
  return !!s.location_consent_at;
}
