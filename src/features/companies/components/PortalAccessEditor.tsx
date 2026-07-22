import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox, Chip, Select, SelectItem } from "@heroui/react";
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
  else if (portal === "billing") next.billing = subRole as any; // Temporary cast until BillingSubRole imported if needed
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
  const { t } = useTranslation(["settings", "common"]);
  const updatePortals = useUpdateUserPortalAccessMutation();

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
      <div className="flex flex-wrap items-center gap-2">
        <Chip size="sm" variant="flat" color="primary">
          {portalTitle(only)}
        </Chip>
        {subRole ? (
          <Chip size="sm" variant="flat">
            {subRoleLabel(subRole)}
          </Chip>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 min-w-[220px]">
      {allowed.map((portal) => {
        const isOn = active.includes(portal);
        const subRole = resolvePortalSubRole(portal, member.role, member.portalSubRoles);
        const options = PORTAL_SUB_ROLE_OPTIONS[portal];

        return (
          <div key={portal} className="flex flex-wrap items-center gap-2">
            <Checkbox
              size="sm"
              isSelected={isOn}
              isDisabled={updatePortals.isPending}
              onValueChange={(checked) => toggle(portal, checked)}
            >
              <span className="text-xs font-semibold">{portalTitle(portal)}</span>
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
                className="min-w-[120px] max-w-[140px]"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as PortalSubRole;
                  if (selected && selected !== subRole) {
                    changeSubRole(portal, selected);
                  }
                }}
              >
                {options.map((option) => (
                  <SelectItem key={option} textValue={subRoleLabel(option)}>{subRoleLabel(option)}</SelectItem>
                ))}
              </Select>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
