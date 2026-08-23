import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { PeopleService } from "../api/people.service";
import { useCompany } from "@/features/companies/context/company-context";
import type { LeaveRequest, PerformanceReview, Asset, Announcement, Employee, CreateWorkLocationDTO } from "../types/people.types";
import { toast } from "sonner";
import i18n from "@/lib/i18n";

const t = (key: string) => i18n.t(key, { ns: "people" });

export function useEmployeesQuery() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: QUERY_KEYS.people.employees(companyId!),
    queryFn: () => PeopleService.getEmployees(companyId!),
    enabled: !!companyId,
  });
}

export function useLeaveRequestsQuery() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: QUERY_KEYS.people.leaveRequests(companyId!),
    queryFn: () => PeopleService.getLeaveRequests(companyId!),
    enabled: !!companyId,
  });
}

export function useSubmitLeaveRequestMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<LeaveRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => 
      PeopleService.submitLeaveRequest(companyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.people.leaveRequests(companyId!) });
      toast.success(t("toast.leave_submitted"));
    },
    onError: (error: any) => {
      toast.error(error.message || t("toast.leave_failed"));
    }
  });
}

export function useOffboardEmployeeMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, status }: { employeeId: string; status: "terminated" | "resigned"; reason: string }) => 
      PeopleService.updateEmployee(companyId!, employeeId, { status: status as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.people.employees(companyId!) });
      toast.success(t("toast.offboarded"));
    },
    onError: (error: any) => {
      toast.error(error.message || t("toast.offboard_failed"));
    }
  });
}

export function useUpdateEmployeeMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: Partial<any> }) => 
      PeopleService.updateEmployee(companyId!, employeeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.people.employees(companyId!) });
      toast.success(t("toast.employee_updated"));
    },
    onError: (error: any) => {
      toast.error(error.message || t("toast.employee_update_failed"));
    }
  });
}

export function usePerformanceReviewsQuery(employeeId: string) {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: QUERY_KEYS.people.performanceReviews(employeeId),
    queryFn: () => PeopleService.getPerformanceReviews(companyId!, employeeId),
    enabled: !!companyId && !!employeeId,
  });
}

export function useAttendanceQuery(employeeId: string) {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['people', 'attendance', companyId, employeeId],
    queryFn: () => PeopleService.getAttendance(companyId!, employeeId),
    enabled: !!companyId && !!employeeId,
  });
}

export function useAllAttendanceQuery() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: ['people', 'all-attendance', companyId],
    queryFn: () => PeopleService.getAllAttendance(companyId!),
    enabled: !!companyId,
  });
}

export function useCreatePerformanceReviewMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<PerformanceReview, 'id'>) => 
      PeopleService.createPerformanceReview(companyId!, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.people.performanceReviews(variables.employeeId) });
      toast.success(t("toast.review_submitted"));
    },
    onError: (error: any) => {
      toast.error(error.message || t("toast.review_failed"));
    }
  });
}

export function useAssetsQuery() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: QUERY_KEYS.people.assets(companyId!),
    queryFn: () => PeopleService.getAssets(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateAssetMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Asset, 'id'>) => 
      PeopleService.createAsset(companyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.people.assets(companyId!) });
      toast.success(t("toast.asset_assigned"));
    },
    onError: (error: any) => {
      toast.error(error.message || t("toast.asset_assign_failed"));
    }
  });
}

export function useUpdateAssetMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, data }: { assetId: string; data: Partial<Asset> }) => 
      PeopleService.updateAsset(companyId!, assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.people.assets(companyId!) });
      toast.success(t("toast.asset_updated"));
    },
    onError: (error: any) => {
      toast.error(error.message || t("toast.asset_update_failed"));
    }
  });
}

export function useAnnouncementsQuery() {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: QUERY_KEYS.people.announcements(companyId!),
    queryFn: () => PeopleService.getAnnouncements(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateAnnouncementMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Announcement, 'id'>) => 
      PeopleService.createAnnouncement(companyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.people.announcements(companyId!) });
      toast.success(t("toast.announcement_posted"));
    },
    onError: (error: any) => {
      toast.error(error.message || t("toast.announcement_failed"));
    }
  });
}

export function useWorkLocationsQuery() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: QUERY_KEYS.people.workLocations(companyId!),
    queryFn: () => PeopleService.getWorkLocations(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateWorkLocationMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkLocationDTO) =>
      PeopleService.createWorkLocation(companyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.people.workLocations(companyId!),
      });
      toast.success(t("attendance_settings.location_saved"));
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || t("attendance_settings.location_save_failed"));
    },
  });
}

export function useUpdateWorkLocationMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      locationId,
      data,
    }: {
      locationId: string;
      data: Partial<CreateWorkLocationDTO>;
    }) => PeopleService.updateWorkLocation(companyId!, locationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.people.workLocations(companyId!),
      });
      toast.success(t("attendance_settings.location_saved"));
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || t("attendance_settings.location_save_failed"));
    },
  });
}

export function useDeleteWorkLocationMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId: string) =>
      PeopleService.deleteWorkLocation(companyId!, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.people.workLocations(companyId!),
      });
      toast.success(t("attendance_settings.location_deleted"));
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || t("attendance_settings.location_delete_failed"));
    },
  });
}

export function useAssignAttendanceLocationMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      attendanceLocationIds,
      attendanceCheckMode,
    }: {
      employeeId: string;
      attendanceLocationIds: string[];
      attendanceCheckMode: Employee["attendanceCheckMode"];
    }) =>
      PeopleService.updateEmployee(companyId!, employeeId, {
        attendanceLocationIds,
        attendanceCheckMode,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.people.employees(companyId!),
      });
      toast.success(t("attendance_settings.assignment_saved"));
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || t("attendance_settings.assignment_failed"));
    },
  });
}
