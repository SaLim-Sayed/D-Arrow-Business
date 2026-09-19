import { useEffect, useState } from "react";
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
  Chip
} from "@heroui/react";
import { NativeDateInput } from "@/components/shared/native-date-input";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { selectFieldProps } from "@/components/shared/select-field";
import { EMPLOYEE_EMAIL_EXISTS, PeopleService, type EmployeeEmailCheck } from "../api/people.service";
import { useCompany } from "@/features/companies/context/company-context";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { UserPlus, Mail, Copy, Check, Share2, Sparkles, AlertTriangle } from "lucide-react";

const hireSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول مطلوب / First name is required"),
  lastName: z.string().min(2, "الاسم الأخير مطلوب / Last name is required"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("البريد الإلكتروني غير صحيح / Invalid email"),
  jobTitle: z.string().min(2, "المسمى الوظيفي مطلوب / Job title is required"),
  department: z.string().min(2, "القسم مطلوب / Department is required"),
  role: z.string().min(1, "الدور الصلاحية مطلوب / Role is required"),
  permissions: z.any().optional(),
  status: z.string().optional(),
  joiningDate: z.string().optional(),
  sendEmailInvite: z.boolean().optional(),
});

type HireFormData = z.infer<typeof hireSchema>;

interface HireEmployeeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HireEmployeeModal({ isOpen, onOpenChange }: HireEmployeeModalProps) {
  const { t, i18n } = useTranslation("people");
  const isAr = i18n.language === "ar";
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  const [copiedLink, setCopiedLink] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<{ name: string; email: string; inviteUrl: string } | null>(null);

  const { register, handleSubmit, reset, setError, control, formState: { errors, isSubmitting } } = useForm<HireFormData>({
    resolver: zodResolver(hireSchema),
    defaultValues: {
      status: "active",
      joiningDate: new Date().toISOString().split("T")[0],
      sendEmailInvite: true,
      role: "employee",
      department: "Engineering"
    }
  });

  // Live email validation: warn about duplicates and about emails that have no
  // account yet. Results are tagged with the email they belong to, so a stale
  // response is never shown next to a newer value.
  const watchedEmail = useWatch({ control, name: "email" });
  const typedEmail = (watchedEmail ?? "").trim().toLowerCase();
  const isEmailComplete = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typedEmail);
  const [emailCheck, setEmailCheck] = useState<(EmployeeEmailCheck & { email: string }) | null>(null);

  useEffect(() => {
    if (!companyId || !isEmailComplete) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      PeopleService.checkEmployeeEmail(companyId, typedEmail)
        .then((result) => {
          if (!cancelled) setEmailCheck({ email: typedEmail, ...result });
        })
        .catch(() => {
          // Non-blocking hint only; createEmployee still enforces uniqueness.
        });
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [companyId, typedEmail, isEmailComplete]);

  const emailStatus = emailCheck?.email === typedEmail ? emailCheck : null;
  const duplicateMessage = isAr
    ? "هذا البريد الإلكتروني مسجّل بالفعل لموظف آخر"
    : "This email is already registered to another employee";

  const onSubmit = async (data: HireFormData) => {
    if (!companyId) return;
    try {
      const inviteToken = "inv_" + Math.random().toString(36).substring(2, 11);
      const inviteUrl = `${window.location.origin}/auth/register?invite=${inviteToken}&email=${encodeURIComponent(data.email)}`;

      await PeopleService.createEmployee(companyId, {
        ...data,
        workType: "remote",
        attendanceCheckMode: "flexible",
        autoStartTimer: true,
        allowRemoteTimer: true,
        permissions: data.permissions ? (typeof data.permissions === 'string' ? data.permissions.split(',') : Array.from(data.permissions)) : [],
        // Left blank on purpose: createEmployee links the record to the account
        // owning this email when one exists. Until the invitee signs up, the
        // directory resolves them by email instead.
        userId: "",
        status: (data.status || "active") as any,
        joiningDate: new Date(data.joiningDate || new Date().toISOString()),
        inviteToken,
        invitedAt: new Date().toISOString(),
      } as any);

      toast.success(isAr ? "تم إضافة الموظف وتفعيل حسابه مباشرة! 🎉" : "Employee added and activated successfully! 🎉");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.people.employees(companyId) });

      setCreatedInvite({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        inviteUrl,
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === EMPLOYEE_EMAIL_EXISTS) {
        setError("email", { type: "manual", message: duplicateMessage });
        toast.error(duplicateMessage);
        return;
      }
      toast.error(isAr ? "حدث خطأ أثناء إرسال الدعوة" : "Failed to invite employee");
    }
  };

  const handleCopyLink = () => {
    if (createdInvite?.inviteUrl) {
      navigator.clipboard.writeText(createdInvite.inviteUrl);
      setCopiedLink(true);
      toast.success(isAr ? "تم نسخ رابط الدعوة للحافظة" : "Invitation link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (createdInvite) {
      const text = isAr 
        ? `مرحباً ${createdInvite.name}،\nيسعدنا دعوتك للانضمام إلى فريق عملنا على المنصة الرقمية!\n\nرابط إكمال تسجيل حسابك والدخول:\n${createdInvite.inviteUrl}`
        : `Hello ${createdInvite.name},\nYou are invited to join our team platform!\n\nComplete your account registration here:\n${createdInvite.inviteUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const handleClose = () => {
    setCreatedInvite(null);
    setCopiedLink(false);
    reset();
    onOpenChange(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleClose} size="2xl" classNames={{ backdrop: "backdrop-blur-md" }}>
      <ModalContent className="rounded-3xl border border-default-100 shadow-2xl">
        {() => (
          createdInvite ? (
            /* Invite Success Step */
            <div dir={isAr ? "rtl" : "ltr"} className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shadow-lg animate-in zoom-in-50">
                <Sparkles size={32} />
              </div>

              <div>
                <h3 className="text-2xl font-black text-foreground">
                  {isAr ? "تم إرسال دعوة التعيين بنجاح! 🚀" : "Invitation Created Successfully!"}
                </h3>
                <p className="text-sm text-default-500 mt-1 max-w-md mx-auto">
                  {isAr 
                    ? `تم إضافة الموظف "${createdInvite.name}" وإرسال إشعار الدعوة على البريد الإلكتروني ${createdInvite.email}`
                    : `Added ${createdInvite.name} and sent invitation notice to ${createdInvite.email}`}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-default-50 dark:bg-default-50/20 border border-default-200/60 dark:border-default-100/40 text-start space-y-3">
                <span className="text-xs font-bold text-default-400 block uppercase">
                  {isAr ? "رابط الدعوة المباشر:" : "Direct Invite Link:"}
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    size="sm"
                    value={createdInvite.inviteUrl}
                    classNames={{ inputWrapper: "bg-background rounded-xl" }}
                  />
                  <Button
                    size="sm"
                    color={copiedLink ? "success" : "primary"}
                    variant="flat"
                    onPress={handleCopyLink}
                    startContent={copiedLink ? <Check size={16} /> : <Copy size={16} />}
                    className="font-bold shrink-0 rounded-xl"
                  >
                    {copiedLink ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ" : "Copy")}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  color="success"
                  variant="flat"
                  startContent={<Share2 size={16} />}
                  onPress={handleShareWhatsApp}
                  className="font-bold rounded-2xl h-11 px-5"
                >
                  {isAr ? "مشاركة الدعوة عبر الواتساب" : "Share via WhatsApp"}
                </Button>

                <Button
                  color="primary"
                  onPress={handleClose}
                  className="font-bold rounded-2xl h-11 px-6 shadow-md"
                >
                  {isAr ? "تم وإغلاق" : "Done & Close"}
                </Button>
              </div>
            </div>
          ) : (
            /* Invite Form Step */
            <form onSubmit={handleSubmit(onSubmit)} dir={isAr ? "rtl" : "ltr"}>
              <ModalHeader className="flex flex-col gap-1 p-6 pb-4 border-b border-default-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                      {isAr ? "إرسال دعوة تعيين موظف جديد" : "Invite New Employee"}
                      <Chip size="sm" color="primary" variant="flat" className="font-bold text-xs">
                        {isAr ? "دعوة عضو" : "Invitation"}
                      </Chip>
                    </h2>
                    <p className="text-xs text-default-400 font-medium mt-0.5">
                      {isAr
                        ? "إضافة موظف جديد للنظام وتزويده برابط دعوة الانضمام وتحديد دور حسابه وصلاحياته"
                        : "Add employee to system, generate login invite link, and configure role & permissions."}
                    </p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={isAr ? "الاسم الأول" : t("hire_modal.first_name")}
                    placeholder={isAr ? "مثال: محمد" : "e.g. John"}
                    {...register("firstName")}
                    isInvalid={!!errors.firstName}
                    errorMessage={errors.firstName?.message}
                    classNames={{ inputWrapper: "rounded-2xl" }}
                  />
                  <Input
                    label={isAr ? "الاسم الأخير" : t("hire_modal.last_name")}
                    placeholder={isAr ? "مثال: القحطاني" : "e.g. Doe"}
                    {...register("lastName")}
                    isInvalid={!!errors.lastName}
                    errorMessage={errors.lastName?.message}
                    classNames={{ inputWrapper: "rounded-2xl" }}
                  />
                  <Input
                    type="email"
                    label={isAr ? "البريد الإلكتروني لدعوة الموظف" : t("hire_modal.email")}
                    placeholder="employee@company.com"
                    startContent={<Mail size={16} className="text-default-400" />}
                    {...register("email")}
                    isInvalid={!!errors.email || !!emailStatus?.isTaken}
                    errorMessage={errors.email?.message ?? (emailStatus?.isTaken ? duplicateMessage : undefined)}
                    description={
                      emailStatus && !emailStatus.isTaken ? (
                        emailStatus.hasAccount ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Check size={13} />
                            {isAr
                              ? "مرتبط بحساب موجود على المنصة"
                              : "Matched to an existing platform account"}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-warning-600 dark:text-warning font-medium">
                            <AlertTriangle size={13} />
                            {isAr
                              ? "لا يوجد حساب بهذا البريد — سيتم إضافة الموظف مع رابط دعوة للتسجيل"
                              : "No account uses this email yet — the employee will be added with a sign-up invite"}
                          </span>
                        )
                      ) : undefined
                    }
                    className="md:col-span-2"
                    classNames={{ inputWrapper: "rounded-2xl" }}
                  />
                  <Input
                    label={isAr ? "المسمى الوظيفي" : t("hire_modal.job_title")}
                    placeholder={isAr ? "مثال: مهندس برمجيات أول" : "e.g. Senior Software Engineer"}
                    {...register("jobTitle")}
                    isInvalid={!!errors.jobTitle}
                    errorMessage={errors.jobTitle?.message}
                    classNames={{ inputWrapper: "rounded-2xl" }}
                  />
                  <Select 
                    {...selectFieldProps()}
                    label={isAr ? "القسم / الإدارة" : t("hire_modal.department")}
                    placeholder={isAr ? "اختر القسم" : "Select department"}
                    {...register("department")}
                    isInvalid={!!errors.department}
                    errorMessage={errors.department?.message}
                    classNames={{ trigger: "rounded-2xl" }}
                  >
                    <SelectItem key="Engineering">{isAr ? "التطوير والبرمجيات (Engineering)" : "Engineering"}</SelectItem>
                    <SelectItem key="Product">{isAr ? "المنتجات وتجربة المستخدم (Product)" : "Product"}</SelectItem>
                    <SelectItem key="Sales">{isAr ? "المبيعات وتطوير الأعمال (Sales)" : "Sales"}</SelectItem>
                    <SelectItem key="Marketing">{isAr ? "التسويق والإعلام (Marketing)" : "Marketing"}</SelectItem>
                    <SelectItem key="HR">{isAr ? "الموارد البشرية (HR)" : "HR"}</SelectItem>
                    <SelectItem key="Finance">{isAr ? "المالية والمحاسبة (Finance)" : "Finance"}</SelectItem>
                  </Select>
                  <Select 
                    {...selectFieldProps()}
                    label={isAr ? "دور الحساب والصلاحية" : t("profile.role")}
                    placeholder={isAr ? "اختر دور الموظف" : "Select role"}
                    {...register("role")}
                    isInvalid={!!errors.role}
                    errorMessage={errors.role?.message}
                    classNames={{ trigger: "rounded-2xl" }}
                  >
                    <SelectItem key="employee">{isAr ? "موظف عادي (Employee)" : "Employee"}</SelectItem>
                    <SelectItem key="manager">{isAr ? "مدير قسم (Manager)" : "Manager"}</SelectItem>
                    <SelectItem key="admin">{isAr ? "مدير نظام (Admin)" : "Admin"}</SelectItem>
                    <SelectItem key="super_admin">{isAr ? "مسؤول أعلى (Super Admin)" : "Super Admin"}</SelectItem>
                  </Select>
                  <Select 
                    {...selectFieldProps()}
                    label={isAr ? "الصلاحيات الإضافية" : t("profile.permissions")}
                    placeholder={isAr ? "حدد الصلاحيات" : "Select permissions"}
                    selectionMode="multiple"
                    {...register("permissions")}
                    isInvalid={!!errors.permissions}
                    errorMessage={errors.permissions?.message as string}
                    classNames={{ trigger: "rounded-2xl" }}
                  >
                    <SelectItem key="view_employees">{isAr ? "عرض قائمة وتفاصيل الموظفين" : "View Employees"}</SelectItem>
                    <SelectItem key="manage_leaves">{isAr ? "إدارة وموافقة طلبات الإجازات" : "Manage Leaves"}</SelectItem>
                    <SelectItem key="manage_payroll">{isAr ? "إدارة مسير الرواتب ومستحقات الموظف" : "Manage Payroll"}</SelectItem>
                  </Select>
                  <NativeDateInput
                    label={isAr ? "تاريخ المباشرة المتوقع" : t("hire_modal.joining_date")}
                    {...register("joiningDate")}
                    isInvalid={!!errors.joiningDate}
                    errorMessage={errors.joiningDate?.message}
                    className="md:col-span-2"
                  />
                </div>
              </ModalBody>

              <ModalFooter className="p-6 pt-4 border-t border-default-100 flex items-center justify-between">
                <Button variant="flat" color="default" onPress={handleClose} className="rounded-2xl font-bold">
                  {isAr ? "إلغاء" : t("hire_modal.cancel")}
                </Button>
                <Button 
                  color="primary" 
                  type="submit" 
                  isLoading={isSubmitting}
                  isDisabled={!!emailStatus?.isTaken}
                  startContent={<Mail size={18} />}
                  className="rounded-2xl font-bold px-6 shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary-600"
                >
                  {isAr ? "إرسال دعوة الانضمام" : "Send Invitation"}
                </Button>
              </ModalFooter>
            </form>
          )
        )}
      </ModalContent>
    </Modal>
  );
}
