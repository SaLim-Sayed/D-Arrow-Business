import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  useCommentsQuery,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
} from "../hooks/use-comments";
import { Avatar, Button, Textarea, Skeleton, Spinner } from "@heroui/react";
import { formatDate } from "@/lib/utils";
import { Pencil, Send, Trash2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

export function TaskComments({ taskId }: { taskId: string }) {
  const { t, i18n } = useTranslation("tasks");
  const { data, isLoading } = useCommentsQuery(taskId);
  const addComment = useAddComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const currentUser = useAuthStore((s) => s.user);
  const [content, setContent] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const comments = data?.data ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    addComment.mutate(
      { taskId, content: content.trim() },
      { onSuccess: () => setContent("") },
    );
  }

  function startEdit(commentId: string, current: string) {
    setEditId(commentId);
    setEditContent(current);
  }

  function cancelEdit() {
    setEditId(null);
    setEditContent("");
  }

  function saveEdit(commentId: string) {
    if (!editContent.trim()) return;
    updateComment.mutate(
      { taskId, commentId, content: editContent.trim() },
      { onSuccess: () => cancelEdit() },
    );
  }

  function handleDelete(commentId: string) {
    if (!window.confirm(t("detail.deleteCommentConfirm"))) return;
    deleteComment.mutate({ taskId, commentId });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {t("detail.noComments")}
        </p>
      )}

      {comments.map((comment) => {
        const name =
          i18n.language === "ar"
            ? comment.author?.nameAr
            : comment.author?.name;
        const initials = (comment.author?.name ?? "U")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        const isMine = currentUser?.id === comment.authorId;
        const isEditing = editId === comment.id;
        const isBusy =
          (updateComment.isPending &&
            updateComment.variables?.commentId === comment.id) ||
          (deleteComment.isPending &&
            deleteComment.variables?.commentId === comment.id);

        return (
          <div key={comment.id} className="group flex gap-3">
            <Avatar
              size="sm"
              src={comment.author?.avatar}
              fallback={initials}
              showFallback
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </span>
                {comment.updatedAt &&
                  comment.updatedAt !== comment.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      · {t("detail.edited")}
                    </span>
                  )}
                {isMine && !isEditing && (
                  <span className="ms-auto flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      aria-label={t("detail.editComment")}
                      isDisabled={isBusy}
                      onPress={() => startEdit(comment.id, comment.content)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      aria-label={t("detail.deleteComment")}
                      isDisabled={isBusy}
                      onPress={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e: any) => setEditContent(e.target.value)}
                    color="primary"
                    variant="bordered"
                    rows={3}
                    className="bg-content1"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="light"
                      onPress={cancelEdit}
                      isDisabled={updateComment.isPending}
                    >
                      {t("detail.cancelEdit")}
                    </Button>
                    <Button
                      size="sm"
                      color="primary"
                      isLoading={updateComment.isPending}
                      isDisabled={!editContent.trim()}
                      onPress={() => saveEdit(comment.id)}
                    >
                      {t("detail.saveComment")}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm mt-0.5 whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Add comment */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 pt-4 border-t border-default-100"
      >
        <Textarea
          value={content}
          onChange={(e: any) => setContent(e.target.value)}
          placeholder={t("detail.addComment")}
          color="primary"
          variant="bordered"
          rows={3}
          className="bg-content1 flex-1"
        />
        <Button
          type="submit"
          isIconOnly
          color="primary"
          variant="solid"
          isDisabled={!content.trim() || addComment.isPending}
          className="shrink-0 self-end flex items-center justify-center shadow-md shadow-primary/20 h-11 w-11"
        >
          {addComment.isPending ? (
            <Spinner size="sm" color="current" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
