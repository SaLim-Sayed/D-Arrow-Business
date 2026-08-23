import { PeopleService } from "../api/people.service";
import type { AttendanceGeoPayload, WorkLocation } from "../types/people.types";
import {
  AttendanceGeoError,
  findMatchingWorkLocation,
  getCurrentCoordinates,
  nearestWorkLocation,
} from "./geo";

export async function captureAttendanceGeo(
  companyId: string,
  employeeId: string
): Promise<AttendanceGeoPayload | undefined> {
  const empRes = await PeopleService.getEmployee(companyId, employeeId);
  const employee = empRes.data;
  const mode = employee.attendanceCheckMode ?? "geofence";

  const locRes = await PeopleService.getWorkLocations(companyId);
  const assigned = (employee.attendanceLocationIds ?? [])
    .map((id) => locRes.data.find((l) => l.id === id))
    .filter((l): l is WorkLocation => !!l && l.isActive);

  if (mode === "flexible") {
    try {
      const coords = await getCurrentCoordinates();
      const nearest = nearestWorkLocation(coords, assigned.length ? assigned : locRes.data);
      return {
        lat: coords.lat,
        lng: coords.lng,
        accuracyMeters: coords.accuracyMeters,
        locationId: nearest?.location.id,
        locationName: nearest?.location.name,
        distanceMeters: nearest
          ? Math.round(nearest.distanceMeters)
          : undefined,
      };
    } catch {
      return undefined;
    }
  }

  if (assigned.length === 0) {
    throw new AttendanceGeoError("not_assigned", "No attendance location assigned");
  }

  const coords = await getCurrentCoordinates();
  const match = findMatchingWorkLocation(coords, assigned);
  if (!match) {
    const nearest = nearestWorkLocation(coords, assigned);
    throw new AttendanceGeoError("outside", "Outside assigned work location", {
      distanceMeters: nearest ? Math.round(nearest.distanceMeters) : undefined,
      radiusMeters: nearest?.location.radiusMeters,
      locationName: nearest?.location.name,
    });
  }

  return {
    lat: coords.lat,
    lng: coords.lng,
    accuracyMeters: coords.accuracyMeters,
    locationId: match.location.id,
    locationName: match.location.name,
    distanceMeters: Math.round(match.distanceMeters),
  };
}
