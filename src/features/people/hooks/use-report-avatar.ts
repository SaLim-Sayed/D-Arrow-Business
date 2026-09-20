import { useMemo } from "react";
import { useAuth } from "@/features/auth/context/auth-context";
import { avatarSrc } from "@/lib/image-utils";
import { useEmployeesQuery } from "./use-people";
import type { DailyReport } from "../types/daily-report.types";

/** Prefer the current employee photo, then the photo stored with the report. */
export function useReportAvatar() {
  const { user } = useAuth();
  const { data: employeesResponse } = useEmployeesQuery();

  const photosById = useMemo(() => {
    const photos = new Map<string, string>();
    for (const employee of employeesResponse?.data ?? []) {
      const photo = avatarSrc(employee.avatarUrl);
      if (!photo) continue;
      photos.set(employee.id, photo);
      if (employee.userId) photos.set(employee.userId, photo);
    }
    return photos;
  }, [employeesResponse?.data]);

  return (report: Pick<DailyReport, "employeeId" | "userPhotoUrl">) =>
    photosById.get(report.employeeId) ??
    (report.employeeId === user?.id ? avatarSrc(user.avatar) : undefined) ??
    avatarSrc(report.userPhotoUrl);
}
