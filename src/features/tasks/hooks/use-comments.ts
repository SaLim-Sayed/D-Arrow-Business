import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { CommentService } from "../api/comments.service";
import { toast } from "sonner";
import { useCompany } from "@/features/companies/context/company-context";
import { useTranslation } from "react-i18next";

export function useCommentsQuery(taskId: string) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: QUERY_KEYS.tasks.comments(taskId),
    queryFn: () => CommentService.getComments(companyId!, taskId),
    enabled: !!taskId && !!companyId,
  });
}

function invalidateCommentQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  taskId: string
) {
  queryClient.invalidateQueries({
    queryKey: QUERY_KEYS.tasks.comments(taskId),
  });
  queryClient.invalidateQueries({
    queryKey: QUERY_KEYS.tasks.detail(taskId),
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { t } = useTranslation("tasks");

  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
      CommentService.addComment(companyId!, taskId, content),
    onSuccess: (_data, variables) => {
      invalidateCommentQueries(queryClient, variables.taskId);
    },
    onError: () => {
      toast.error(t("toast.commentAddFailed"));
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { t } = useTranslation("tasks");

  return useMutation({
    mutationFn: ({
      taskId,
      commentId,
      content,
    }: {
      taskId: string;
      commentId: string;
      content: string;
    }) => CommentService.updateComment(companyId!, taskId, commentId, content),
    onSuccess: (_data, variables) => {
      invalidateCommentQueries(queryClient, variables.taskId);
      toast.success(t("toast.commentUpdated"));
    },
    onError: () => {
      toast.error(t("toast.commentUpdateFailed"));
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { t } = useTranslation("tasks");

  return useMutation({
    mutationFn: ({
      taskId,
      commentId,
    }: {
      taskId: string;
      commentId: string;
    }) => CommentService.deleteComment(companyId!, taskId, commentId),
    onSuccess: (_data, variables) => {
      invalidateCommentQueries(queryClient, variables.taskId);
      toast.success(t("toast.commentDeleted"));
    },
    onError: () => {
      toast.error(t("toast.commentDeleteFailed"));
    },
  });
}
