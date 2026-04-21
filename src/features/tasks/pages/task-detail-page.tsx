import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTaskQuery } from "../hooks/use-tasks";
import { useUpdateTask, useDeleteTask } from "../hooks/use-task-mutations";
import { TaskForm } from "../components/task-form";
import { TaskComments } from "../components/task-comments";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil, Trash2, Calendar, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function TaskDetailPage() {
  const { t, i18n } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useTaskQuery(taskId!);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <LoadingSpinner />;

  const task = data?.data;
  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Task not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
          {tc("actions.back")}
        </Button>
      </div>
    );
  }

  const assigneeName =
    i18n.language === "ar" ? task.assignee?.nameAr : task.assignee?.name;
  const reporterName =
    i18n.language === "ar" ? task.reporter?.nameAr : task.reporter?.name;
  const assigneeInitials = (task.assignee?.name ?? "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={task.title}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 me-1" />
              {tc("actions.back")}
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 me-1" />
              {tc("actions.edit")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteTask.mutate(task.id, {
                  onSuccess: () => navigate("/tasks/list"),
                });
              }}
            >
              <Trash2 className="h-4 w-4 me-1" />
              {tc("actions.delete")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("detail.description")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {task.description ? (
                <p className="text-sm whitespace-pre-wrap">
                  {task.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {t("detail.noDescription")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Tabs defaultValue="comments">
                <TabsList>
                  <TabsTrigger value="comments">
                    {t("detail.comments")} ({task.commentsCount})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="comments" className="mt-4">
                  <TaskComments taskId={task.id} />
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t("form.status.label")}
                </p>
                <StatusBadge status={task.status} />
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t("form.priority.label")}
                </p>
                <PriorityBadge priority={task.priority} />
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {t("form.assignee.label")}
                </p>
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">
                        {assigneeInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{assigneeName}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t("form.assignee.unassigned")}
                  </span>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {t("form.dueDate.label")}
                </p>
                <span className="text-sm">
                  {task.dueDate ? formatDate(task.dueDate) : "—"}
                </span>
              </div>
              {task.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("form.tags.label")}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <Separator />
              <div className="text-xs text-muted-foreground space-y-1">
                {reporterName && <p>Reporter: {reporterName}</p>}
                <p>Created: {formatDate(task.createdAt)}</p>
                <p>Updated: {formatDate(task.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("form.editTitle")}</DialogTitle>
          </DialogHeader>
          <TaskForm
            defaultValues={task}
            onSubmit={(formData) => {
              updateTask.mutate(
                { id: task.id, data: formData },
                { onSuccess: () => setEditOpen(false) }
              );
            }}
            isSubmitting={updateTask.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
