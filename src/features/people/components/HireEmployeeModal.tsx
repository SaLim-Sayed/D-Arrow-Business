import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Input, 
  Select, 
  SelectItem 
} from "@heroui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { selectFieldProps } from "@/components/shared/select-field";
import { PeopleService } from "../api/people.service";
import { useCompany } from "@/features/companies/context/company-context";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";

const hireSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email"),
  jobTitle: z.string().min(2, "Job title is required"),
  department: z.string().min(2, "Department is required"),
  role: z.string().min(1, "Role is required"),
  permissions: z.any().optional(),
  status: z.string().optional(),
  joiningDate: z.string().optional(),
});

type HireFormData = z.infer<typeof hireSchema>;

interface HireEmployeeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HireEmployeeModal({ isOpen, onOpenChange }: HireEmployeeModalProps) {
  const { t } = useTranslation("people");
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<HireFormData>({
    resolver: zodResolver(hireSchema),
    defaultValues: {
      status: "active",
      joiningDate: new Date().toISOString().split("T")[0]
    }
  });

  const onSubmit = async (data: HireFormData) => {
    if (!companyId) return;
    try {
      await PeopleService.createEmployee(companyId, {
        ...data,
        permissions: data.permissions ? (typeof data.permissions === 'string' ? data.permissions.split(',') : Array.from(data.permissions)) : [],
        userId: "new-user-" + Math.random().toString(36).substr(2, 9), // Mock user ID
        status: (data.status || "active") as any,
        joiningDate: new Date(data.joiningDate || new Date().toISOString()),
      } as any);
      toast.success(t("extra.hire_success"));
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.people.employees(companyId) });
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error(t("extra.hire_failed"));
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader className="flex flex-col gap-1">{t("hire_modal.title")}</ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t("hire_modal.first_name")}
                  placeholder={t("hire_modal.first_name")}
                  {...register("firstName")}
                  isInvalid={!!errors.firstName}
                  errorMessage={errors.firstName?.message}
                />
                <Input
                  label={t("hire_modal.last_name")}
                  placeholder={t("hire_modal.last_name")}
                  {...register("lastName")}
                  isInvalid={!!errors.lastName}
                  errorMessage={errors.lastName?.message}
                />
                <Input
                  label={t("hire_modal.email")}
                  placeholder={t("hire_modal.email")}
                  {...register("email")}
                  isInvalid={!!errors.email}
                  errorMessage={errors.email?.message}
                />
                <Input
                  label={t("hire_modal.job_title")}
                  placeholder={t("hire_modal.job_title")}
                  {...register("jobTitle")}
                  isInvalid={!!errors.jobTitle}
                  errorMessage={errors.jobTitle?.message}
                />
                <Select 
                  {...selectFieldProps()}
                  label={t("hire_modal.department")}
                  placeholder={t("hire_modal.department")}
                  {...register("department")}
                  isInvalid={!!errors.department}
                  errorMessage={errors.department?.message}
                >
                  <SelectItem key="Engineering" textValue={t("departments.Engineering")}>{t("departments.Engineering")}</SelectItem>
                  <SelectItem key="Product" textValue={t("departments.Product")}>{t("departments.Product")}</SelectItem>
                  <SelectItem key="Sales" textValue={t("departments.Sales")}>{t("departments.Sales")}</SelectItem>
                  <SelectItem key="Marketing" textValue={t("departments.Marketing")}>{t("departments.Marketing")}</SelectItem>
                  <SelectItem key="HR" textValue={t("departments.HR")}>{t("departments.HR")}</SelectItem>
                </Select>
                <Select 
                  {...selectFieldProps()}
                  label={t("profile.role")}
                  placeholder={t("profile.role")}
                  {...register("role")}
                  isInvalid={!!errors.role}
                  errorMessage={errors.role?.message}
                >
                  <SelectItem key="super_admin" textValue={t("roles.super_admin")}>{t("roles.super_admin")}</SelectItem>
                  <SelectItem key="admin" textValue={t("roles.admin")}>{t("roles.admin")}</SelectItem>
                  <SelectItem key="manager" textValue={t("roles.manager")}>{t("roles.manager")}</SelectItem>
                  <SelectItem key="employee" textValue={t("roles.employee")}>{t("roles.employee")}</SelectItem>
                </Select>
                <Select 
                  {...selectFieldProps()}
                  label={t("profile.permissions")}
                  placeholder={t("profile.permissions")}
                  selectionMode="multiple"
                  {...register("permissions")}
                  isInvalid={!!errors.permissions}
                  errorMessage={errors.permissions?.message as string}
                >
                  <SelectItem key="view_employees" textValue={t("extra.perm_view_employees")}>{t("extra.perm_view_employees")}</SelectItem>
                  <SelectItem key="manage_leaves" textValue={t("extra.perm_manage_leaves")}>{t("extra.perm_manage_leaves")}</SelectItem>
                  <SelectItem key="manage_payroll" textValue={t("extra.perm_manage_payroll")}>{t("extra.perm_manage_payroll")}</SelectItem>
                </Select>
                <Input
                  label={t("hire_modal.joining_date")}
                  type="date"
                  {...register("joiningDate")}
                  isInvalid={!!errors.joiningDate}
                  errorMessage={errors.joiningDate?.message}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("hire_modal.cancel")}
              </Button>
              <Button color="primary" type="submit" isLoading={isSubmitting}>
                {t("hire_modal.hire_employee")}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
