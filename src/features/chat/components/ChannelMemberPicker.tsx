import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, Chip, Input } from "@heroui/react";
import { Check, Search, Users } from "lucide-react";
import type { User } from "@/features/auth/types/auth.types";
import { cn } from "@/lib/utils";

interface ChannelMemberPickerProps {
  users: User[];
  /** Already in the channel — shown as checked + disabled when provided. */
  existingMemberIds?: string[];
  /** Currently selected invitees (excluding existing members). */
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Hide the current user from the list (they're always a member). */
  excludeUserId?: string;
  className?: string;
  /** Show removable chips for the current selection. */
  showSelectedChips?: boolean;
}

export function ChannelMemberPicker({
  users,
  existingMemberIds = [],
  selectedIds,
  onChange,
  excludeUserId,
  className,
  showSelectedChips = true,
}: ChannelMemberPickerProps) {
  const { t } = useTranslation("chat");
  const [query, setQuery] = useState("");

  const usersById = useMemo(() => {
    const map = new Map<string, User>();
    for (const user of users) map.set(user.id, user);
    return map;
  }, [users]);

  const existing = useMemo(
    () => new Set(existingMemberIds),
    [existingMemberIds]
  );
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((user) => user.id !== excludeUserId)
      .filter(
        (user) =>
          !q ||
          user.name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          (user.nameAr ?? "").toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const aIn = existing.has(a.id) ? 0 : 1;
        const bIn = existing.has(b.id) ? 0 : 1;
        if (aIn !== bIn) return aIn - bIn;
        const aSel = selected.has(a.id) ? 0 : 1;
        const bSel = selected.has(b.id) ? 0 : 1;
        if (aSel !== bSel) return aSel - bSel;
        return a.name.localeCompare(b.name);
      });
  }, [users, excludeUserId, query, existing, selected]);

  const toggle = (userId: string) => {
    if (existing.has(userId)) return;
    if (selected.has(userId)) onChange(selectedIds.filter((id) => id !== userId));
    else onChange([...selectedIds, userId]);
  };

  const selectedUsers = selectedIds
    .map((id) => usersById.get(id))
    .filter((user): user is User => Boolean(user));

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {showSelectedChips && selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedUsers.map((user) => (
            <Chip
              key={user.id}
              size="sm"
              variant="flat"
              color="primary"
              avatar={<Avatar src={user.avatar} name={user.name} />}
              onClose={() => toggle(user.id)}
            >
              {user.name}
            </Chip>
          ))}
        </div>
      )}

      <Input
        size="sm"
        variant="bordered"
        radius="lg"
        value={query}
        onValueChange={setQuery}
        placeholder={t("channels.searchMembers")}
        startContent={<Search className="h-3.5 w-3.5 text-default-400" />}
        endContent={
          selectedIds.length > 0 ? (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {selectedIds.length}
            </span>
          ) : null
        }
        aria-label={t("channels.searchMembers")}
        classNames={{
          inputWrapper: "border-default-200 bg-default-50/50",
        }}
      />

      <ul className="max-h-56 overflow-y-auto rounded-2xl border border-default-100/80 bg-content1 shadow-sm">
        {people.length === 0 ? (
          <li className="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-default-100 text-default-400">
              <Users className="h-4 w-4" />
            </div>
            <p className="text-xs text-default-400">{t("channels.noMembersFound")}</p>
          </li>
        ) : (
          people.map((user) => {
            const isExisting = existing.has(user.id);
            const isSelected = isExisting || selected.has(user.id);
            return (
              <li key={user.id} className="border-b border-default-100/70 last:border-b-0">
                <button
                  type="button"
                  disabled={isExisting}
                  onClick={() => toggle(user.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors",
                    isExisting
                      ? "cursor-default bg-default-50/60"
                      : "hover:bg-default-50 active:bg-default-100/80",
                    isSelected && !isExisting && "bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-default-300 bg-content1"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    size="sm"
                    className="shrink-0 ring-2 ring-background"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {user.name}
                    </span>
                    <span className="block truncate text-[11px] text-default-400">
                      {isExisting ? t("channels.alreadyMember") : user.email}
                    </span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
