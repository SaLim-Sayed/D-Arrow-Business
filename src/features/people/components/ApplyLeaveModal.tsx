import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Input, 
  Select, 
  SelectItem,
  Textarea
} from "@heroui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { selectFieldProps } from "@/components/shared/select-field";
import { PeopleService } from "../api/people.service";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";

const leaveSchema = z.object({
  type: z.string().min(1, "Type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

type LeaveFormData = z.infer<typeof leaveSchema>;

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplyLeaveModal({ isOpen, onOpenChange }: ApplyLeaveModalProps) {
  const { t } = useTranslation("people");
  const { companyId } = useCompany();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
  });

  const onSubmit = async (data: LeaveFormData) => {
    if (!companyId || !user) return;
    try {
      await PeopleService.submitLeaveRequest(companyId, {
        employeeId: user.id, // Should probably be employeeId mapped from user.id
        employeeName: user.name || "Unknown",
        type: data.type as any,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
      });
      toast.success(t("leave_modal.submitted_success"));
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.people.leaveRequests(companyId) });
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error(t("leave_modal.submitted_failed"));
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader className="flex flex-col gap-1">{t("leave_modal.title")}</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Select 
                  {...selectFieldProps()}
                  label={t("leave_modal.leave_type")}
                  placeholder={t("leave_modal.select_type")}
                  {...register("type")}
                  isInvalid={!!errors.type}
                  errorMessage={errors.type?.message}
                >
                  <SelectItem key="vacation" textValue={t("leave_modal.type_vacation")}>{t("leave_modal.type_vacation")}</SelectItem>
                  <SelectItem key="sick" textValue={t("leave_modal.type_sick")}>{t("leave_modal.type_sick")}</SelectItem>
                  <SelectItem key="personal" textValue={t("leave_modal.type_personal")}>{t("leave_modal.type_personal")}</SelectItem>
                  <SelectItem key="unpaid" textValue={t("leave_modal.type_unpaid")}>{t("leave_modal.type_unpaid")}</SelectItem>
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("leave_modal.start_date")}
                    type="date"
                    {...register("startDate")}
                    isInvalid={!!errors.startDate}
                    errorMessage={errors.startDate?.message}
                  />
                  <Input
                    label={t("leave_modal.end_date")}
                    type="date"
                    {...register("endDate")}
                    isInvalid={!!errors.endDate}
                    errorMessage={errors.endDate?.message}
                  />
                </div>
                <Textarea
                  label={t("leave_modal.reason")}
                  placeholder={t("leave_modal.reason")}
                  {...register("reason")}
                  isInvalid={!!errors.reason}
                  errorMessage={errors.reason?.message}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("leave_modal.cancel")}
              </Button>
              <Button color="primary" type="submit" isLoading={isSubmitting}>
                {t("leave_modal.submit")}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
