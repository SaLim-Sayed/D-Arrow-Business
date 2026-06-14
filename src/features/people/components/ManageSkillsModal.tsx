import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Slider } from "@heroui/react";
import { Trash2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUpdateEmployeeMutation } from "../hooks/use-people";
import type { Employee } from "../types/people.types";

interface ManageSkillsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  employee: Employee;
}

export function ManageSkillsModal({ isOpen, onOpenChange, employee }: ManageSkillsModalProps) {
  const { t } = useTranslation("people");
  const [skills, setSkills] = useState<{ name: string; level: number }[]>([]);
  const updateMutation = useUpdateEmployeeMutation();

  // Reset skills state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSkills(employee.skills || []);
    }
  }, [isOpen, employee.skills]);

  const handleAddSkill = () => {
    setSkills([...skills, { name: "", level: 50 }]);
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSkillChange = (index: number, field: "name" | "level", value: string | number) => {
    const newSkills = [...skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    setSkills(newSkills);
  };

  const handleSave = () => {
    // Filter out skills with empty names
    const validSkills = skills.filter((s) => s.name.trim() !== "");
    
    updateMutation.mutate(
      {
        employeeId: employee.id,
        data: { skills: validSkills },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center" size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">{t("skills_modal.title")}</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {skills.length === 0 ? (
                  <p className="text-default-500 text-sm text-center py-4">{t("profile.no_skills")}</p>
                ) : (
                  skills.map((skill, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-default-100 rounded-xl bg-default-50/50">
                      <Input
                        label={t("skills_modal.skill_name")}
                        variant="bordered"
                        size="sm"
                        value={skill.name}
                        placeholder={t("skills_modal.skill_placeholder")}
                        className="flex-1"
                        onValueChange={(val) => handleSkillChange(index, "name", val)}
                      />
                      <div className="flex-1 w-full px-2">
                        <Slider
                           label={t("profile.proficiency")}
                          size="sm"
                          step={1}
                          maxValue={100}
                          minValue={0}
                          value={skill.level}
                          className="max-w-md"
                          onChange={(val) => handleSkillChange(index, "level", val as number)}
                        />
                      </div>
                      <Button isIconOnly color="danger" variant="light" onPress={() => handleRemoveSkill(index)} className="shrink-0">
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  ))
                )}
                <Button color="primary" variant="flat" onPress={handleAddSkill} startContent={<Plus size={16} />} className="w-full border-dashed border-2 bg-transparent">
                  {t("skills_modal.add_skill")}
                </Button>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onClose} isDisabled={updateMutation.isPending}>
                {t("skills_modal.cancel")}
              </Button>
              <Button color="primary" onPress={handleSave} isLoading={updateMutation.isPending}>
                {t("skills_modal.save")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
