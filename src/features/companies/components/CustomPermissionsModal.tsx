import { useState, useMemo, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  Chip,
  Input
} from "@heroui/react";
import { Key, Shield, Search, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { User } from "@/features/auth/types/auth.types";
import type { Permission } from "@/lib/permissions";
import { useUpdateUserCustomPermissionsMutation } from "@/features/users/hooks/use-user-custom-permissions-mutation";

interface CustomPermissionsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: User | null;
}

interface PermissionDefinition {
  key: Permission;
  titleAr: string;
  titleEn: string;
  categoryAr: string;
  categoryEn: string;
}

const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // People & HR
  { key: "people.view", titleAr: "عرض قائمة وتفاصيل الموظفين", titleEn: "View Employees & Profiles", categoryAr: "الموارد البشرية والعمالة", categoryEn: "People & HR" },
  { key: "people.manage_employees", titleAr: "إدارة الموظفين والتعيين والإنهاء", titleEn: "Manage Employee Hiring & Status", categoryAr: "الموارد البشرية والعمالة", categoryEn: "People & HR" },
  { key: "people.approve_leave", titleAr: "الموافقة على طلبات الإجازات والاستئذان", titleEn: "Approve Leave & Time-off Requests", categoryAr: "الموارد البشرية والعمالة", categoryEn: "People & HR" },
  { key: "people.view_performance", titleAr: "عرض واستعراض تقييمات الأداء", titleEn: "View Performance Reviews", categoryAr: "الموارد البشرية والعمالة", categoryEn: "People & HR" },

  // CRM
  { key: "crm.view", titleAr: "الوصول لبوابة إدارة العملاء CRM", titleEn: "Access CRM Portal", categoryAr: "إدارة العلاقات والعملاء (CRM)", categoryEn: "CRM & Sales" },
  { key: "crm.manage_leads", titleAr: "إدارة العملاء المحتملين والفرص", titleEn: "Manage Leads & Opportunities", categoryAr: "إدارة العلاقات والعملاء (CRM)", categoryEn: "CRM & Sales" },
  { key: "crm.manage_contacts", titleAr: "إدارة جهات الاتصال ودليل العملاء", titleEn: "Manage Contacts Directory", categoryAr: "إدارة العلاقات والعملاء (CRM)", categoryEn: "CRM & Sales" },
  { key: "crm.manage_deals", titleAr: "إدارة الصفقات وخط المبيعات", titleEn: "Manage Deals & Pipelines", categoryAr: "إدارة العلاقات والعملاء (CRM)", categoryEn: "CRM & Sales" },
  { key: "crm.manage_contracts", titleAr: "إدارة وإنشاء وتوقيع العقود الرسمية", titleEn: "Manage & Sign Contracts", categoryAr: "إدارة العلاقات والعملاء (CRM)", categoryEn: "CRM & Sales" },
  { key: "crm.manage_tasks", titleAr: "إدارة مهام وتذكيرات المبيعات", titleEn: "Manage Sales Tasks", categoryAr: "إدارة العلاقات والعملاء (CRM)", categoryEn: "CRM & Sales" },
  { key: "crm.delete", titleAr: "صلاحية حذف عناصر وصفقات CRM", titleEn: "Delete CRM Items & Deals", categoryAr: "إدارة العلاقات والعملاء (CRM)", categoryEn: "CRM & Sales" },

  // Tasks & Projects
  { key: "tasks.view", titleAr: "عرض لوحة وقائمة المهام والمشاريع", titleEn: "View Tasks & Projects", categoryAr: "إدارة المهام والمشاريع", categoryEn: "Tasks & Projects" },
  { key: "tasks.create", titleAr: "إضافة وإنشاء مهام جديدة", titleEn: "Create New Tasks", categoryAr: "إدارة المهام والمشاريع", categoryEn: "Tasks & Projects" },
  { key: "tasks.edit", titleAr: "تعديل وتحديث تفاصيل المهام", titleEn: "Edit & Update Tasks", categoryAr: "إدارة المهام والمشاريع", categoryEn: "Tasks & Projects" },
  { key: "tasks.delete", titleAr: "حذف وإزالة المهام", titleEn: "Delete Tasks", categoryAr: "إدارة المهام والمشاريع", categoryEn: "Tasks & Projects" },
  { key: "tasks.approve", titleAr: "اعتماد وموافقة إنجاز المهام", titleEn: "Approve Task Completion", categoryAr: "إدارة المهام والمشاريع", categoryEn: "Tasks & Projects" },

  // Company & Admin Settings
  { key: "company.view", titleAr: "عرض بيانات وإعدادات الشركة", titleEn: "View Company Settings", categoryAr: "إدارات النظام والشركة", categoryEn: "Company & Admin" },
  { key: "company.manage", titleAr: "تعديل وإدارة بيانات الشركة والسجل التجاري", titleEn: "Manage Company Profile & Settings", categoryAr: "إدارات النظام والشركة", categoryEn: "Company & Admin" },
  { key: "users.manage_roles", titleAr: "إدارة أعضاء الفريق، التعيين، وتحديد الأدوار", titleEn: "Manage Team Roles & User Permissions", categoryAr: "إدارات النظام والشركة", categoryEn: "Company & Admin" },
  { key: "admin.seed", titleAr: "تهيئة وإعادة تعيين بيانات فايرستور", titleEn: "Seed System Data", categoryAr: "إدارات النظام والشركة", categoryEn: "Company & Admin" },
];

export function CustomPermissionsModal({ isOpen, onOpenChange, member }: CustomPermissionsModalProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const updatePermissions = useUpdateUserCustomPermissionsMutation();

  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (member) {
      setSelectedPermissions(member.customPermissions || []);
    }
  }, [member, isOpen]);

  const categories = useMemo(() => {
    const map = new Map<string, PermissionDefinition[]>();
    for (const def of PERMISSION_DEFINITIONS) {
      const catName = isAr ? def.categoryAr : def.categoryEn;
      const q = search.trim().toLowerCase();
      const match = !q || def.titleAr.toLowerCase().includes(q) || def.titleEn.toLowerCase().includes(q) || def.key.toLowerCase().includes(q);
      
      if (match) {
        if (!map.has(catName)) map.set(catName, []);
        map.get(catName)!.push(def);
      }
    }
    return map;
  }, [isAr, search]);

  const togglePermission = (key: Permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!member) return;
    await updatePermissions.mutateAsync({
      targetUserId: member.id,
      customPermissions: selectedPermissions,
    });
    onOpenChange(false);
  };

  if (!member) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl" classNames={{ backdrop: "backdrop-blur-md" }}>
      <ModalContent className="rounded-3xl border border-default-100 shadow-2xl">
        {() => (
          <div dir={isAr ? "rtl" : "ltr"}>
            <ModalHeader className="flex flex-col gap-1 p-6 pb-4 border-b border-default-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-secondary/10 text-secondary rounded-2xl border border-secondary/20">
                  <Key size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                    {isAr ? `تخصيص صلاحيات استثنائية: ${member.name}` : `Custom Permissions: ${member.name}`}
                    <Chip size="sm" color="secondary" variant="flat" className="font-bold text-xs">
                      {selectedPermissions.length} {isAr ? "صلاحيات مخصصة" : "custom perms"}
                    </Chip>
                  </h2>
                  <p className="text-xs text-default-400 font-medium mt-0.5">
                    {isAr
                      ? `منح ${member.name} صلاحيات محددة مباشرة بغض النظر عن دوره الحسابي الأولي (${member.role})`
                      : `Grant explicit custom permissions to ${member.name} beyond their default role.`}
                  </p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <Input
                size="sm"
                variant="bordered"
                placeholder={isAr ? "ابحث عن صلاحية..." : "Search permissions..."}
                value={search}
                onValueChange={setSearch}
                startContent={<Search className="h-4 w-4 text-default-400" />}
                classNames={{ inputWrapper: "rounded-2xl" }}
              />

              <div className="space-y-3">
                {Array.from(categories.entries()).map(([catName, defs]) => (
                  <div key={catName} className="rounded-2xl border border-default-100 p-4 space-y-3 bg-default-50/40">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <Shield size={14} />
                        {catName}
                      </span>
                      <Chip size="sm" variant="flat" color="default" className="text-xs font-bold">
                        {defs.filter(d => selectedPermissions.includes(d.key)).length} / {defs.length}
                      </Chip>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                      {defs.map((def) => {
                        const isChecked = selectedPermissions.includes(def.key);
                        return (
                          <div
                            key={def.key}
                            onClick={() => togglePermission(def.key)}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                              isChecked
                                ? "bg-primary/10 border-primary/40 shadow-sm"
                                : "bg-background border-default-100 hover:border-default-300"
                            }`}
                          >
                            <Checkbox
                              size="sm"
                              isSelected={isChecked}
                              onValueChange={() => togglePermission(def.key)}
                              className="mt-0.5"
                            />
                            <div className="flex flex-col gap-0.5">
                              <span className={`text-xs font-bold ${isChecked ? "text-primary-700 dark:text-primary-300" : "text-foreground"}`}>
                                {isAr ? def.titleAr : def.titleEn}
                              </span>
                              <span className="text-[10px] text-default-400 font-mono">
                                {def.key}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ModalBody>

            <ModalFooter className="p-6 pt-4 border-t border-default-100 flex items-center justify-between">
              <Button variant="flat" color="default" onPress={() => onOpenChange(false)} className="rounded-2xl font-bold">
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                color="primary"
                isLoading={updatePermissions.isPending}
                startContent={<Sparkles size={18} />}
                onPress={handleSave}
                className="rounded-2xl font-bold px-6 shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary-600"
              >
                {isAr ? "حفظ الصلاحيات المخصصة" : "Save Custom Permissions"}
              </Button>
            </ModalFooter>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
