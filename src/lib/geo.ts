export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function getCurrentPosition(timeout = 6000): Promise<{ lat: number; lng: number } | null> {
  if (!("geolocation" in navigator)) return null;
  try {
    return await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(
        (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        rej,
        { enableHighAccuracy: true, timeout, maximumAge: 30_000 },
      ),
    );
  } catch {
    return null;
  }
}
