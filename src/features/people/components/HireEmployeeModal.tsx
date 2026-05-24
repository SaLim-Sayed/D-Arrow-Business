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
      toast.success("Employee hired successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.people.employees(companyId) });
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error("Failed to hire employee");
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader className="flex flex-col gap-1">Hire New Employee</ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="Enter first name"
                  {...register("firstName")}
                  isInvalid={!!errors.firstName}
                  errorMessage={errors.firstName?.message}
                />
                <Input
                  label="Last Name"
                  placeholder="Enter last name"
                  {...register("lastName")}
                  isInvalid={!!errors.lastName}
                  errorMessage={errors.lastName?.message}
                />
                <Input
                  label="Email"
                  placeholder="Enter work email"
                  {...register("email")}
                  isInvalid={!!errors.email}
                  errorMessage={errors.email?.message}
                />
                <Input
                  label="Job Title"
                  placeholder="e.g. Software Engineer"
                  {...register("jobTitle")}
                  isInvalid={!!errors.jobTitle}
                  errorMessage={errors.jobTitle?.message}
                />
                <Select 
                  label="Department"
                  placeholder="Select department"
                  {...register("department")}
                  isInvalid={!!errors.department}
                  errorMessage={errors.department?.message}
                >
                  <SelectItem key="Engineering">Engineering</SelectItem>
                  <SelectItem key="Product">Product</SelectItem>
                  <SelectItem key="Sales">Sales</SelectItem>
                  <SelectItem key="Marketing">Marketing</SelectItem>
                  <SelectItem key="HR">HR</SelectItem>
                </Select>
                <Select 
                  label="Role"
                  placeholder="Select role"
                  {...register("role")}
                  isInvalid={!!errors.role}
                  errorMessage={errors.role?.message}
                >
                  <SelectItem key="super_admin">Super Admin</SelectItem>
                  <SelectItem key="admin">Admin</SelectItem>
                  <SelectItem key="manager">Manager</SelectItem>
                  <SelectItem key="employee">Employee</SelectItem>
                </Select>
                <Select 
                  label="Permissions"
                  placeholder="Select permissions"
                  selectionMode="multiple"
                  {...register("permissions")}
                  isInvalid={!!errors.permissions}
                  errorMessage={errors.permissions?.message as string}
                >
                  <SelectItem key="view_employees">View Employees</SelectItem>
                  <SelectItem key="manage_leaves">Manage Leaves</SelectItem>
                  <SelectItem key="manage_payroll">Manage Payroll</SelectItem>
                </Select>
                <Input
                  label="Joining Date"
                  type="date"
                  {...register("joiningDate")}
                  isInvalid={!!errors.joiningDate}
                  errorMessage={errors.joiningDate?.message}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" type="submit" isLoading={isSubmitting}>
                Confirm Hire
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
