import { Card, CardBody, Button, Input, Select, SelectItem } from "@heroui/react";
import { Check } from "lucide-react";
import type { UserRole } from "../../types/auth.types";

interface GeneralSectionProps {
  name: string;
  setName: (v: string) => void;
  nameAr: string;
  setNameAr: (v: string) => void;
  role: UserRole;
  setRole: (v: UserRole) => void;
  isSaving: boolean;
  onSave: () => void;
  tp: (key: string) => string;
}

const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin",       label: "Admin" },
  { value: "manager",     label: "Manager" },
  { value: "employee",    label: "Employee" },
  { value: "viewer",      label: "Viewer" },
];

export function GeneralSection({
  name,
  setName,
  nameAr,
  setNameAr,
  role,
  setRole,
  isSaving,
  onSave,
  tp
}: GeneralSectionProps) {
  return (
    <Card className="rounded-3xl shadow-premium border-default-100/50 bg-background/60 backdrop-blur-xl overflow-hidden">
      <div className="bg-primary/5 p-6 border-b border-default-100/50 flex justify-between items-center">
        <h2 className="text-xl font-black tracking-tight">Personal Details</h2>
        <Button
          color="primary"
          onPress={onSave}
          isLoading={isSaving}
          startContent={<Check size={18} />}
          className="font-bold shadow-lg shadow-primary/20 rounded-2xl"
        >
          Save Changes
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
            label={tp("role")}
            variant="bordered"
            selectedKeys={new Set([role])}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as UserRole;
              if (selected) setRole(selected);
            }}
            className="font-bold"
          >
            {USER_ROLES.map((r) => (
              <SelectItem key={r.value}>{r.label}</SelectItem>
            ))}
          </Select>
        </div>
      </CardBody>
    </Card>
  );
}
