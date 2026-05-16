import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { PeopleService } from "../api/people.service";
import { useCompany } from "@/features/companies/context/company-context";
import type { LeaveRequest } from "../types/people.types";
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
