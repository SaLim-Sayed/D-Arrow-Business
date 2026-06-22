import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  DatePicker,
} from "@heroui/react";
import { 
  Calendar, 
  Flag, 
  Plus, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Layout
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
    } catch (error) {
      toast.error(editingSprintId ? t("sprints.msgUpdateError") : t("sprints.msgCreateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (sprint: any, e: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
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
        return <Chip color="primary" variant="flat" startContent={<Clock className="w-3 h-3" />}>{t("sprints.statusActive")}</Chip>;
      case "completed":
        return <Chip color="success" variant="flat" startContent={<CheckCircle2 className="w-3 h-3" />}>{t("sprints.statusCompleted")}</Chip>;
      default:
        return <Chip color="default" variant="flat" startContent={<Flag className="w-3 h-3" />}>{t("sprints.statusPlanned")}</Chip>;
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-default-900 dark:text-white">
            {t("sprints.title")}
          </h1>
          <p className="text-default-500 mt-1">{t("sprints.subtitle")}</p>
        </div>
        <Button 
          color="primary" 
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => {
            setEditingSprintId(null);
            setNewSprint({ name: "", startDate: "", endDate: "", goal: "" });
            onOpen();
          }}
          className="font-bold shadow-lg shadow-primary/20"
        >
          {t("sprints.newSprint")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sprints.map((sprint) => (
            <Card 
              key={sprint.id} 
              isPressable
              onPress={() => navigate(`/tasks/work?sprintId=${sprint.id}`)}
              className="border-none bg-content1/50 backdrop-blur-md hover:bg-content1/80 transition-all cursor-pointer group relative"
            >
              <CardBody className="p-6">
                <div className="flex justify-between items-start mb-4">
                  {getStatusChip(sprint.status)}
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    className="absolute top-4 right-4 z-10"
                    onPress={(e) => openEditModal(sprint, e)}
                  >
                    <Layout className="w-5 h-5 text-default-300 group-hover:text-primary transition-colors" />
                  </Button>
                </div>
                
                <h3 className="text-xl font-bold text-default-900 dark:text-white mb-2 line-clamp-1 pr-8">
                  {sprint.name}
                </h3>
                
                {sprint.goal && (
                  <p className="text-sm text-default-500 mb-6 line-clamp-2 h-10">
                    {sprint.goal}
                  </p>
                )}

                <div className="flex items-center gap-3 text-sm text-default-400 bg-default-50 dark:bg-default-100/50 p-3 rounded-xl">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>{format(new Date(sprint.startDate), "MMM d")}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>{format(new Date(sprint.endDate), "MMM d, yyyy")}</span>
                </div>
              </CardBody>
            </Card>
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
                  variant="flat"
                  value={newSprint.name}
                  onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <DatePicker
                    label={t("sprints.startDate")}
                    variant="flat"
                    value={newSprint.startDate ? parseDate(newSprint.startDate.split('T')[0]) : null}
                    onChange={(date: any) => setNewSprint({ ...newSprint, startDate: date?.toString() || "" })}
                  />
                  <DatePicker
                    label={t("sprints.endDate")}
                    variant="flat"
                    value={newSprint.endDate ? parseDate(newSprint.endDate.split('T')[0]) : null}
                    onChange={(date: any) => setNewSprint({ ...newSprint, endDate: date?.toString() || "" })}
                  />
                </div>
                <Input
                  label={t("sprints.goalLabel")}
                  placeholder={t("sprints.goalPlaceholder")}
                  variant="flat"
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
