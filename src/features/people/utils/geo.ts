import type { Employee, WorkLocation } from "../types/people.types";

export type AttendanceGeoCode =
  | "permission_denied"
  | "unavailable"
  | "timeout"
  | "not_assigned"
  | "outside"
  | "no_employee";

export class AttendanceGeoError extends Error {
  constructor(
    public code: AttendanceGeoCode,
    message: string,
    public extra?: {
      distanceMeters?: number;
      radiusMeters?: number;
      locationName?: string;
    }
  ) {
    super(message);
    this.name = "AttendanceGeoError";
  }
}

export function employeeDisplayName(
  employee: Pick<Employee, "firstName" | "lastName" | "email"> & {
    name?: string;
  }
): string {
  const full = `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim();
  if (full) return full;
  if (employee.name?.trim()) return employee.name.trim();
  return employee.email || "—";
}

/** Earth-surface distance in meters. */
export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function getCurrentCoordinates(): Promise<{
  lat: number;
  lng: number;
  accuracyMeters?: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new AttendanceGeoError("unavailable", "Geolocation is not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new AttendanceGeoError("permission_denied", err.message));
        } else if (err.code === err.TIMEOUT) {
          reject(new AttendanceGeoError("timeout", err.message));
        } else {
          reject(new AttendanceGeoError("unavailable", err.message));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export function findMatchingWorkLocation(
  coords: { lat: number; lng: number },
  locations: WorkLocation[]
): { location: WorkLocation; distanceMeters: number } | null {
  let best: { location: WorkLocation; distanceMeters: number } | null = null;
  for (const loc of locations) {
    if (!loc.isActive) continue;
    const distanceMeters = haversineMeters(coords, { lat: loc.lat, lng: loc.lng });
    if (distanceMeters <= loc.radiusMeters) {
      if (!best || distanceMeters < best.distanceMeters) {
        best = { location: loc, distanceMeters };
      }
    }
  }
  return best;
}

export function nearestWorkLocation(
  coords: { lat: number; lng: number },
  locations: WorkLocation[]
): { location: WorkLocation; distanceMeters: number } | null {
  const active = locations.filter((l) => l.isActive);
  if (active.length === 0) return null;
  return active.reduce<{ location: WorkLocation; distanceMeters: number } | null>(
    (best, loc) => {
      const distanceMeters = haversineMeters(coords, {
        lat: loc.lat,
        lng: loc.lng,
      });
      if (!best || distanceMeters < best.distanceMeters) {
        return { location: loc, distanceMeters };
      }
      return best;
    },
    null
  );
}

export function osmEmbedUrl(lat: number, lng: number, radiusMeters = 150): string {
  const pad = Math.max(0.004, radiusMeters / 111000 + 0.002);
  const bbox = `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

export async function searchNominatim(query: string): Promise<
  { label: string; lat: number; lng: number }[]
> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "ar,en",
    },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  return data.map((item) => ({
    label: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
  }));
}
