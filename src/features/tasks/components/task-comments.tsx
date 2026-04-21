import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useCommentsQuery, useAddComment } from "../hooks/use-comments";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Send } from "lucide-react";

export function TaskComments({ taskId }: { taskId: string }) {
  const { t, i18n } = useTranslation("tasks");
  const { data, isLoading } = useCommentsQuery(taskId);
  const addComment = useAddComment();
  const [content, setContent] = useState("");

  const comments = data?.data ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    addComment.mutate(
      { taskId, content: content.trim() },
      { onSuccess: () => setContent("") }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
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

        return (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm mt-0.5 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          </div>
        );
      })}

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t">
        <Textarea
          placeholder={t("detail.addComment")}
          value={content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
          rows={2}
          className="flex-1 resize-none"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || addComment.isPending}
          className="shrink-0 self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
