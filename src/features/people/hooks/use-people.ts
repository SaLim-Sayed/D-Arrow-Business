import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { PeopleService } from "../api/people.service";
import { useCompany } from "@/features/companies/context/company-context";
import type { LeaveRequest, PerformanceReview, Asset, Announcement } from "../types/people.types";
import { toast } from "sonner";

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
      toast.success("Leave request submitted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit leave request");
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
      toast.success("Employee successfully offboarded");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to offboard employee");
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
      toast.success("Employee updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update employee");
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
      toast.success("Performance review submitted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit performance review");
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
      toast.success("Asset assigned successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign asset");
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
      toast.success("Asset updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update asset");
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
      toast.success("Announcement posted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to post announcement");
    }
  });
}
