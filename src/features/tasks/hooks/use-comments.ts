import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { CommentService } from "../api/comments.service";
import { toast } from "sonner";
import { useCompany } from "@/features/companies/context/company-context";

export function useCommentsQuery(taskId: string) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: QUERY_KEYS.tasks.comments(taskId),
    queryFn: () => CommentService.getComments(companyId!, taskId),
    enabled: !!taskId && !!companyId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
      CommentService.addComment(companyId!, taskId, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.tasks.comments(variables.taskId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.tasks.detail(variables.taskId),
      });
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });
}
