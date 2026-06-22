import { Card, CardBody, Button, Input, Select, SelectItem } from "@heroui/react";
import { selectFieldProps } from "@/components/shared/select-field";
import { Check } from "lucide-react";
import type { UserRole } from "../../types/auth.types";

interface GeneralSectionProps {
  name: string;
  setName: (v: string) => void;
  nameAr: string;
  setNameAr: (v: string) => void;
  role: UserRole;
  setRole: (v: UserRole) => void;
  canEditRole?: boolean;
  isSaving: boolean;
  onSave: () => void;
  tp: (key: string) => string;
}

const USER_ROLES = [
  { value: "super_admin", labelKey: "role_super_admin" },
  { value: "admin",       labelKey: "role_admin" },
  { value: "manager",     labelKey: "role_manager" },
  { value: "employee",    labelKey: "role_employee" },
  { value: "viewer",      labelKey: "role_viewer" },
];

export function GeneralSection({
  name,
  setName,
  nameAr,
  setNameAr,
  role,
  setRole,
  canEditRole = false,
  isSaving,
  onSave,
  tp
}: GeneralSectionProps) {
  return (
    <Card className="rounded-3xl shadow-premium border-default-100/50 bg-background/60 backdrop-blur-xl overflow-hidden">
      <div className="bg-primary/5 p-6 border-b border-default-100/50 flex justify-between items-center">
        <h2 className="text-xl font-black tracking-tight">{tp("personalDetails")}</h2>
        <Button
          color="primary"
          onPress={onSave}
          isLoading={isSaving}
          startContent={<Check size={18} />}
          className="font-bold shadow-lg shadow-primary/20 rounded-2xl"
        >
          {tp("saveChanges")}
        </Button>
      </div>
      <CardBody className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label={tp("name")}
            placeholder={tp("namePlaceholder")}
            variant="bordered"
            value={name}
            onValueChange={setName}
            className="font-bold"
          />
          <Input
            label={tp("nameAr")}
            placeholder={tp("nameArPlaceholder")}
            variant="bordered"
            value={nameAr}
            onValueChange={setNameAr}
            dir="rtl"
            className="font-arabic font-bold"
          />
          <Select
            {...selectFieldProps()}
            label={tp("role")}
            variant="bordered"
            selectedKeys={new Set([role])}
            isDisabled={!canEditRole}
            description={!canEditRole ? tp("roleReadOnly") : undefined}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as UserRole;
              if (selected) setRole(selected);
            }}
            className="font-bold"
          >
            {USER_ROLES.map((r) => (
              <SelectItem key={r.value} textValue={tp(r.labelKey)}>{tp(r.labelKey)}</SelectItem>
            ))}
          </Select>
        </div>
      </CardBody>
    </Card>
  );
}
