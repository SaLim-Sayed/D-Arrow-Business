import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Checkbox, 
  Chip, 
  Select, 
  SelectItem, 
  Popover, 
  PopoverTrigger, 
  PopoverContent, 
  Button 
} from "@heroui/react";
import { SlidersHorizontal } from "lucide-react";
import type { User } from "@/features/auth/types/auth.types";
import type { PortalId } from "@/lib/portal-permissions";
import { PORTAL_META } from "@/features/portals/constants/portal-meta";
import {
  getAssignablePortalsForUser,
  resolveUserPortals,
} from "@/lib/permissions/portal-access";
import { useUpdateUserPortalAccessMutation } from "@/features/users/hooks/use-user-portal-access-mutation";
import { selectFieldProps } from "@/components/shared/select-field";
import {
  getDefaultSubRole,
  PORTAL_SUB_ROLE_OPTIONS,
  resolvePortalSubRole,
  type CrmSubRole,
  type PeopleSubRole,
  type PortalSubRole,
  type PortalSubRoles,
  type TasksSubRole,
} from "@/lib/permissions/sub-roles";

interface PortalAccessEditorProps {
  member: User;
}

function setPortalSubRole(
  subRoles: PortalSubRoles,
  portal: PortalId,
  subRole: PortalSubRole
): PortalSubRoles {
  const next = { ...subRoles };
  if (portal === "tasks") next.tasks = subRole as TasksSubRole;
  else if (portal === "crm") next.crm = subRole as CrmSubRole;
  else if (portal === "people") next.people = subRole as PeopleSubRole;
  else if (portal === "billing") next.billing = subRole as any;
  return next;
}

function clearPortalSubRole(
  subRoles: PortalSubRoles,
  portal: PortalId
): PortalSubRoles {
  const next = { ...subRoles };
  if (portal === "tasks") delete next.tasks;
  else if (portal === "crm") delete next.crm;
  else if (portal === "people") delete next.people;
  else if (portal === "billing") delete next.billing;
  return next;
}

function pruneSubRoles(
  portals: PortalId[],
  subRoles: PortalSubRoles
): PortalSubRoles {
  const next: PortalSubRoles = {};
  for (const portal of portals) {
    if (portal === "chat") continue;
    const value = subRoles[portal];
    if (!value) continue;
    if (portal === "tasks") next.tasks = value as TasksSubRole;
    else if (portal === "crm") next.crm = value as CrmSubRole;
    else if (portal === "people") next.people = value as PeopleSubRole;
    else if (portal === "billing") next.billing = value as any;
  }
  return next;
}

export function PortalAccessEditor({ member }: PortalAccessEditorProps) {
  const { t, i18n } = useTranslation(["settings", "common"]);
  const isAr = i18n.language === "ar";
  const updatePortals = useUpdateUserPortalAccessMutation();
  const [isOpen, setIsOpen] = useState(false);

  const allowed = getAssignablePortalsForUser(member.role);
  const active = useMemo(
    () => resolveUserPortals(member.role, member.portalAccess),
    [member.role, member.portalAccess]
  );

  const portalTitle = (portal: PortalId) =>
    t(PORTAL_META[portal].titleKey, { ns: "common" });

  const subRoleLabel = (subRole: PortalSubRole) =>
    t(`team.subRoles.${subRole}`, { ns: "settings" });

  const save = (nextPortals: PortalId[], nextSubRoles: PortalSubRoles) => {
    if (nextPortals.length === 0) return;

    updatePortals.mutate({
      targetUserId: member.id,
      targetRole: member.role,
      selectedPortals: nextPortals,
      portalSubRoles: pruneSubRoles(nextPortals, nextSubRoles),
    });
  };

  const toggle = (portal: PortalId, checked: boolean) => {
    const next = checked
      ? [...new Set([...active, portal])]
      : active.filter((p) => p !== portal);

    let currentSubRoles = { ...(member.portalSubRoles ?? {}) };
    if (checked) {
      const defaultSubRole = getDefaultSubRole(portal, member.role);
      if (defaultSubRole) {
        currentSubRoles = setPortalSubRole(currentSubRoles, portal, defaultSubRole);
      }
    } else {
      currentSubRoles = clearPortalSubRole(currentSubRoles, portal);
    }

    save(next, currentSubRoles);
  };

  const changeSubRole = (portal: PortalId, subRole: PortalSubRole) => {
    const nextSubRoles = setPortalSubRole(member.portalSubRoles ?? {}, portal, subRole);
    save(active, nextSubRoles);
  };

  if (allowed.length <= 1) {
    const only = allowed[0];
    const subRole = resolvePortalSubRole(only, member.role, member.portalSubRoles);
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <Chip size="sm" variant="flat" color="primary" className="font-bold text-xs">
          {portalTitle(only)}
        </Chip>
        {subRole ? (
          <Chip size="sm" variant="flat" className="font-medium text-xs">
            {subRoleLabel(subRole)}
          </Chip>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Compact Badges Summary */}
      <div className="flex items-center gap-1.5 flex-wrap max-w-[280px]">
        {active.slice(0, 2).map((portal) => {
          const subRole = resolvePortalSubRole(portal, member.role, member.portalSubRoles);
          return (
            <Chip key={portal} size="sm" variant="flat" color="primary" className="font-bold text-xs">
              {portalTitle(portal)}
              {subRole ? ` (${subRoleLabel(subRole)})` : ""}
            </Chip>
          );
        })}
        {active.length > 2 && (
          <Chip size="sm" variant="flat" color="default" className="font-bold text-xs">
            +{active.length - 2}
          </Chip>
        )}
      </div>

      {/* Popover Editor */}
      <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-end">
        <PopoverTrigger>
          <Button
            size="sm"
            variant="flat"
            color="default"
            isIconOnly
            className="rounded-xl h-8 w-8 shrink-0"
            title={isAr ? "إدارة بوابات وصلاحيات العضو" : "Manage Portal Access"}
          >
            <SlidersHorizontal size={14} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-4 w-80 space-y-3 rounded-2xl shadow-2xl border border-default-100">
          <div className="flex items-center justify-between border-b border-default-100 pb-2">
            <span className="font-bold text-sm text-foreground">
              {isAr ? "بوابات وصلاحيات العضو" : "User Portal Access"}
            </span>
            <Chip size="sm" color="primary" variant="flat" className="font-bold text-xs">
              {active.length} / {allowed.length}
            </Chip>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 scrollbar-hide">
            {allowed.map((portal) => {
              const isOn = active.includes(portal);
              const subRole = resolvePortalSubRole(portal, member.role, member.portalSubRoles);
              const options = PORTAL_SUB_ROLE_OPTIONS[portal];

              return (
                <div 
                  key={portal} 
                  className="flex items-center justify-between gap-2 p-2 rounded-xl border border-default-100 hover:bg-default-50 transition-colors"
                >
                  <Checkbox
                    size="sm"
                    isSelected={isOn}
                    isDisabled={updatePortals.isPending}
                    onValueChange={(checked) => toggle(portal, checked)}
                  >
                    <span className="text-xs font-bold">{portalTitle(portal)}</span>
                  </Checkbox>

                  {isOn && subRole && options.length > 0 ? (
                    <Select
                      {...selectFieldProps({ compact: true })}
                      size="sm"
                      variant="bordered"
                      aria-label={t("team.subRoleFor", {
                        ns: "settings",
                        portal: portalTitle(portal),
                      })}
                      selectedKeys={new Set([subRole])}
                      isDisabled={updatePortals.isPending}
                      className="w-28 shrink-0"
                      classNames={{ trigger: "h-8 rounded-lg min-h-8" }}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as PortalSubRole;
                        if (selected && selected !== subRole) {
                          changeSubRole(portal, selected);
                        }
                      }}
                    >
                      {options.map((option) => (
                        <SelectItem key={option} textValue={subRoleLabel(option)}>
                          {subRoleLabel(option)}
                        </SelectItem>
                      ))}
                    </Select>
                  ) : null}
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
