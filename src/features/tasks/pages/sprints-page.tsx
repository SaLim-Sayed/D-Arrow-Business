import { useState } from "react";
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
} from "@heroui/react";
import { AppDatePicker } from "@/components/shared/app-date-picker";
import {
  Calendar,
  Flag,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Pencil,
} from "lucide-react";
import { useSprintsQuery } from "../hooks/use-tasks";
import { TaskService } from "../api/tasks.service";
import { useCompany } from "@/features/companies/context/company-context";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { parseDate } from "@internationalized/date";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { TasksPageHeader, TasksPanel } from "../components/tasks-ui";
import type { Sprint } from "../types/task.types";

export function SprintsPage() {
  const { t } = useTranslation("tasks");
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: sprintsResponse, isLoading } = useSprintsQuery();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [newSprint, setNewSprint] = useState({
    name: "",
    startDate: "",
    endDate: "",
    goal: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSprintId, setEditingSprintId] = useState<string | null>(null);

  const sprints = sprintsResponse?.data || [];

  const handleSaveSprint = async () => {
    if (!newSprint.name || !newSprint.startDate || !newSprint.endDate) {
      toast.error(t("sprints.msgFillRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSprintId) {
        await TaskService.updateSprint(companyId!, editingSprintId, newSprint);
        toast.success(t("sprints.msgUpdateSuccess"));
      } else {
        await TaskService.createSprint(companyId!, {
          ...newSprint,
          status: "planned",
        });
        toast.success(t("sprints.msgCreateSuccess"));
      }
      queryClient.invalidateQueries({ queryKey: ["sprints", companyId] });
      onOpenChange();
      setNewSprint({ name: "", startDate: "", endDate: "", goal: "" });
      setEditingSprintId(null);
    } catch {
      toast.error(
        editingSprintId ? t("sprints.msgUpdateError") : t("sprints.msgCreateError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (sprint: Sprint) => {
    setEditingSprintId(sprint.id);
    setNewSprint({
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      goal: sprint.goal || "",
    });
    onOpen();
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Chip
            color="primary"
            variant="flat"
            size="sm"
            startContent={<Clock className="h-3 w-3" />}
          >
            {t("sprints.statusActive")}
          </Chip>
        );
      case "completed":
        return (
          <Chip
            color="success"
            variant="flat"
            size="sm"
            startContent={<CheckCircle2 className="h-3 w-3" />}
          >
            {t("sprints.statusCompleted")}
          </Chip>
        );
      default:
        return (
          <Chip
            color="default"
            variant="flat"
            size="sm"
            startContent={<Flag className="h-3 w-3" />}
          >
            {t("sprints.statusPlanned")}
          </Chip>
        );
    }
  };

  return (
    <div className="animate-in fade-in pb-24 duration-300">
      <TasksPageHeader
        title={t("sprints.title")}
        description={t("sprints.subtitle")}
        breadcrumbLabel={t("nav.dashboard")}
        breadcrumbTo="/tasks"
        action={
          <Button
            color="primary"
            size="sm"
            className="font-semibold"
            startContent={<Plus className="h-4 w-4" />}
            onPress={() => {
              setEditingSprintId(null);
              setNewSprint({ name: "", startDate: "", endDate: "", goal: "" });
              onOpen();
            }}
          >
            {t("sprints.newSprint")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : sprints.length === 0 ? (
        <TasksPanel title={t("sprints.noSprints")}>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="mb-3 h-10 w-10 text-default-300" />
            <p className="text-sm text-default-500">{t("sprints.noSprintsHint")}</p>
            <Button
              color="primary"
              size="sm"
              className="mt-4 font-semibold"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => {
                setEditingSprintId(null);
                setNewSprint({ name: "", startDate: "", endDate: "", goal: "" });
                onOpen();
              }}
            >
              {t("sprints.newSprint")}
            </Button>
          </div>
        </TasksPanel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sprints.map((sprint) => (
            <button
              key={sprint.id}
              type="button"
              onClick={() => navigate(`/tasks/work?sprintId=${sprint.id}`)}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-lg border border-default-200 bg-content1 text-start shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/[0.02]"
              )}
            >
              <div className="flex items-center justify-between gap-2 border-b border-default-200 bg-default-50/90 px-4 py-3">
                {getStatusChip(sprint.status)}
                <span
                  role="presentation"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    className="h-7 w-7 min-w-0"
                    onPress={() => openEditModal(sprint)}
                  >
                    <Pencil className="h-3.5 w-3.5 text-default-400 group-hover:text-primary" />
                  </Button>
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="mb-2 line-clamp-1 text-base font-bold text-default-900">
                  {sprint.name}
                </h3>

                {sprint.goal ? (
                  <p className="mb-4 line-clamp-2 min-h-[2.5rem] text-sm text-default-500">
                    {sprint.goal}
                  </p>
                ) : (
                  <div className="mb-4 min-h-[2.5rem]" />
                )}

                <div className="mt-auto flex items-center gap-2 rounded-md border border-default-100 bg-default-50 px-3 py-2 text-xs text-default-500">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>{format(new Date(sprint.startDate), "MMM d")}</span>
                  <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                  <span>{format(new Date(sprint.endDate), "MMM d, yyyy")}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {editingSprintId ? t("sprints.editSprint") : t("sprints.createSprint")}
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label={t("sprints.nameLabel")}
                  placeholder={t("sprints.namePlaceholder")}
                  variant="bordered"
                  value={newSprint.name}
                  onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <AppDatePicker
                    label={t("sprints.startDate")}
                    variant="bordered"
                    value={
                      newSprint.startDate
                        ? parseDate(newSprint.startDate.split("T")[0])
                        : null
                    }
                    onChange={(date) =>
                      setNewSprint({ ...newSprint, startDate: date?.toString() || "" })
                    }
                  />
                  <AppDatePicker
                    label={t("sprints.endDate")}
                    variant="bordered"
                    value={
                      newSprint.endDate
                        ? parseDate(newSprint.endDate.split("T")[0])
                        : null
                    }
                    onChange={(date) =>
                      setNewSprint({ ...newSprint, endDate: date?.toString() || "" })
                    }
                  />
                </div>
                <Input
                  label={t("sprints.goalLabel")}
                  placeholder={t("sprints.goalPlaceholder")}
                  variant="bordered"
                  value={newSprint.goal}
                  onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("sprints.cancel")}
                </Button>
                <Button color="primary" onPress={handleSaveSprint} isLoading={isSubmitting}>
                  {editingSprintId ? t("sprints.saveChanges") : t("sprints.createBtn")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
