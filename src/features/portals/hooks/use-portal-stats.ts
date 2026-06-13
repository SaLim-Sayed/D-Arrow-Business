import type { PortalId } from "@/lib/portal-permissions";
import { useAllTasksQuery } from "@/features/tasks/hooks/use-tasks";
import { useLeadsQuery } from "@/features/crm/hooks/use-leads";
import { useLeaveRequestsQuery } from "@/features/people/hooks/use-people";

export function usePortalStat(portal: PortalId): number | null {
  const { data: tasks } = useAllTasksQuery();
  const { data: leads } = useLeadsQuery();
  const { data: leaveRequests } = useLeaveRequestsQuery();

  switch (portal) {
    case "tasks":
      return (tasks?.data ?? []).filter((t) => t.status !== "done").length;
    case "crm":
      return leads?.data?.length ?? 0;
    case "people":
      return (leaveRequests?.data ?? []).filter((r) => r.status === "pending")
        .length;
    default:
      return null;
  }
}
