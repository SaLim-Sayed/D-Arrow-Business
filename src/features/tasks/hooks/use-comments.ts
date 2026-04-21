import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import * as commentsApi from "../api/comments.api";
import { toast } from "sonner";

export function useCommentsQuery(taskId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.tasks.comments(taskId),
    queryFn: () => commentsApi.getComments(taskId),
    enabled: !!taskId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
      commentsApi.addComment(taskId, content),
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
