import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import type { Employee, WorkLocation } from "../types/people.types";
import { employeeDisplayName } from "../utils/geo";

interface AssignAttendanceLocationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  locations: WorkLocation[];
  isSaving?: boolean;
  onSave: (payload: {
    employeeId: string;
    attendanceLocationIds: string[];
    attendanceCheckMode: "geofence" | "flexible";
  }) => Promise<void> | void;
}

export function AssignAttendanceLocationModal({
  isOpen,
  onOpenChange,
  employee,
  locations,
  isSaving,
  onSave,
}: AssignAttendanceLocationModalProps) {
  const { t } = useTranslation("people");
  const [mode, setMode] = useState<"geofence" | "flexible">("geofence");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen || !employee) return;
    setMode(employee.attendanceCheckMode ?? "geofence");
    setSelected(employee.attendanceLocationIds ?? []);
  }, [isOpen, employee]);

  const activeLocations = locations.filter((l) => l.isActive);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {t("attendance_settings.assign_title")}
              {employee && (
                <p className="text-sm font-normal text-default-500">
                  {employeeDisplayName(employee)}
                </p>
              )}
            </ModalHeader>
            <ModalBody className="gap-5">
              <RadioGroup
                label={t("attendance_settings.check_mode")}
                value={mode}
                onValueChange={(v) => setMode(v as "geofence" | "flexible")}
              >
                <Radio value="geofence" description={t("attendance_settings.mode_geofence_hint")}>
                  {t("attendance_settings.mode_geofence")}
                </Radio>
                <Radio value="flexible" description={t("attendance_settings.mode_flexible_hint")}>
                  {t("attendance_settings.mode_flexible")}
                </Radio>
              </RadioGroup>

              {mode === "geofence" && (
                <div>
                  {activeLocations.length === 0 ? (
                    <p className="rounded-lg border border-warning-200 bg-warning/10 p-3 text-sm text-warning-700">
                      {t("attendance_settings.need_locations_first")}
                    </p>
                  ) : (
                    <CheckboxGroup
                      label={t("attendance_settings.assigned_locations")}
                      value={selected}
                      onValueChange={setSelected}
                    >
                      {activeLocations.map((loc) => (
                        <Checkbox key={loc.id} value={loc.id}>
                          <span className="flex flex-col">
                            <span>{loc.name}</span>
                            <span className="text-xs text-default-400">
                              {loc.address || t("attendance_settings.radius_short", { meters: loc.radiusMeters })}
                            </span>
                          </span>
                        </Checkbox>
                      ))}
                    </CheckboxGroup>
                  )}
                </div>
              )}

              {mode === "flexible" && (
                <Chip color="warning" variant="flat" size="sm">
                  {t("attendance_settings.flexible_chip")}
                </Chip>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("attendance_settings.cancel")}
              </Button>
              <Button
                color="primary"
                isLoading={isSaving}
                isDisabled={mode === "geofence" && selected.length === 0}
                onPress={async () => {
                  if (!employee?.id) return;
                  await onSave({
                    employeeId: employee.id,
                    attendanceLocationIds: mode === "geofence" ? selected : [],
                    attendanceCheckMode: mode,
                  });
                  onClose();
                }}
              >
                {t("attendance_settings.save")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
